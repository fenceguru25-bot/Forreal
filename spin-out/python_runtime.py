from __future__ import annotations

import base64
import sys
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import threading
import time
from contextlib import asynccontextmanager, closing, contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, Iterator, Literal
from uuid import uuid4

import socketio
import uvicorn
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from pydantic import BaseModel, Field, field_validator

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DIST_DIR = BASE_DIR / "client" / "dist"
DB_PATH = Path(os.getenv("SPIN_OUT_DB_PATH", DATA_DIR / "spin_out.db"))
JWT_SECRET = os.getenv("JWT_SECRET", "spin-out-dev-secret")
REFRESH_TOKEN_SECRET = os.getenv("REFRESH_TOKEN_SECRET", "spin-out-refresh-secret")
JWT_EXPIRES_IN = os.getenv("JWT_EXPIRES_IN", "15m")
CLIENT_URL = os.getenv("CLIENT_URL", "http://localhost:4000")
ADMIN_EMAILS = {email.strip().lower() for email in os.getenv("SPIN_OUT_ADMIN_EMAILS", "").split(",") if email.strip()}
RESTRICTED_STATES = {"WA", "ID", "MI", "NV", "KY", "AR"}
COIN_PACKAGES = [
    {"id": "starter", "name": "Starter Stack", "goldCoins": 450, "sweepsCoins": 1, "price": 4.99, "popular": False},
    {"id": "silver", "name": "Silver Spin", "goldCoins": 1000, "sweepsCoins": 2, "price": 9.99, "popular": True},
    {"id": "gold", "name": "Gold Rush", "goldCoins": 2100, "sweepsCoins": 5, "price": 19.99, "popular": False},
    {"id": "platinum", "name": "Platinum Vault", "goldCoins": 5500, "sweepsCoins": 15, "price": 49.99, "popular": False},
    {"id": "diamond", "name": "Diamond Deluxe", "goldCoins": 12000, "sweepsCoins": 35, "price": 99.99, "popular": False},
]
CASHAPP_CASHTAG = "$FENCEGUEULLC"
MIN_BET = 0.1
MAX_BET = 500.0
DAILY_BONUS_SC = 1.0
REEL_COUNT = 5
ROW_COUNT = 3
SUITS = ["♠", "♥", "♦", "♣"]
BLACKJACK_VALUES = [
    {"value": "A", "numericValue": 11},
    {"value": "2", "numericValue": 2},
    {"value": "3", "numericValue": 3},
    {"value": "4", "numericValue": 4},
    {"value": "5", "numericValue": 5},
    {"value": "6", "numericValue": 6},
    {"value": "7", "numericValue": 7},
    {"value": "8", "numericValue": 8},
    {"value": "9", "numericValue": 9},
    {"value": "10", "numericValue": 10},
    {"value": "J", "numericValue": 10},
    {"value": "Q", "numericValue": 10},
    {"value": "K", "numericValue": 10},
]
BACCARAT_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
WEIGHTED_SYMBOLS = ["🍒", "🍒", "🍒", "🍒", "🍋", "🍋", "🍋", "🍊", "🍊", "🍊", "🍇", "🍇", "💎", "⭐", "🔔", "7️⃣", "🃏", "🎰"]
PAYLINES = [[0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2]]
RED_NUMBERS = {1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36}
ALLOWED_ORIGINS = [
    CLIENT_URL,
    "http://localhost:4000",
    "http://127.0.0.1:4000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

DB_LOCK = threading.RLock()
STATIC_FILE_INDEX: dict[str, Path] = {}


class AppError(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@dataclass
class AuthUser:
    user_id: str
    email: str
    role: Literal["player", "admin"]


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: str
    password: str = Field(min_length=8)
    state: str = Field(min_length=2, max_length=2)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value:
            raise ValueError("Invalid email address.")
        return value

    @field_validator("state")
    @classmethod
    def normalize_state(cls, value: str) -> str:
        return value.strip().upper()


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value:
            raise ValueError("Invalid email address.")
        return value


class RefreshRequest(BaseModel):
    userId: str
    refreshToken: str = Field(min_length=20)


class LogoutRequest(BaseModel):
    userId: str
    refreshToken: str | None = Field(default=None, min_length=20)


class UpdateProfileRequest(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=30)
    avatar: str | None = None


class PaymentRequest(BaseModel):
    packageId: str
    amount: float = Field(gt=0)


class PaymentWebhookRequest(BaseModel):
    userId: str
    packageId: str
    eventId: str | None = None


class RecordWinRequest(BaseModel):
    userId: str
    username: str = Field(min_length=2)
    amount: float = Field(gt=0)


class AdminBalanceUpdateRequest(BaseModel):
    scAmount: float = 0
    gcAmount: float = 0


class SlotsSpinRequest(BaseModel):
    bet: float = Field(ge=MIN_BET, le=MAX_BET)
    currency: Literal["SC", "GC"]
    clientSeed: str = Field(min_length=3)
    nonce: int = Field(default=0, ge=0)


class BlackjackStartRequest(BaseModel):
    bet: float = Field(ge=MIN_BET, le=MAX_BET)
    currency: Literal["SC", "GC"]


class BlackjackActionRequest(BaseModel):
    action: Literal["hit", "stand", "double"]


class RouletteBetModel(BaseModel):
    type: Literal["straight", "split", "street", "corner", "red", "black", "even", "odd", "dozen", "column"]
    numbers: list[int] | None = None
    amount: float = Field(ge=MIN_BET, le=MAX_BET)
    value: int | None = None


class RouletteSpinRequest(BaseModel):
    bets: list[RouletteBetModel] = Field(min_length=1)
    currency: Literal["SC", "GC"]


class BaccaratDealRequest(BaseModel):
    bet: Literal["player", "banker", "tie"]
    amount: float = Field(ge=MIN_BET, le=MAX_BET)
    currency: Literal["SC", "GC"]


@contextmanager
def db_connection() -> Iterator[sqlite3.Connection]:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with DB_LOCK:
        with closing(sqlite3.connect(DB_PATH, check_same_thread=False)) as connection:
            connection.row_factory = sqlite3.Row
            connection.execute("PRAGMA foreign_keys = ON")
            try:
                yield connection
                connection.commit()
            except Exception:
                connection.rollback()
                raise


def now_utc() -> datetime:
    return datetime.now(UTC)


def refresh_static_index() -> None:
    global STATIC_FILE_INDEX
    if DIST_DIR.exists():
        STATIC_FILE_INDEX = {
            path.relative_to(DIST_DIR).as_posix(): path
            for path in DIST_DIR.rglob("*")
            if path.is_file()
        }
    else:
        STATIC_FILE_INDEX = {}


def now_iso() -> str:
    return now_utc().isoformat()


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def init_db() -> None:
    with db_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              username TEXT UNIQUE NOT NULL,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              avatar_url TEXT,
              sweeps_coins REAL NOT NULL DEFAULT 2.0,
              gold_coins REAL NOT NULL DEFAULT 500.0,
              role TEXT NOT NULL DEFAULT 'player',
              state TEXT NOT NULL,
              self_excluded INTEGER NOT NULL DEFAULT 0,
              last_daily_bonus_at TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS transactions (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              type TEXT NOT NULL,
              amount REAL NOT NULL,
              currency TEXT NOT NULL,
              metadata TEXT NOT NULL DEFAULT '{}',
              created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
            CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

            CREATE TABLE IF NOT EXISTS game_sessions (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              game_type TEXT NOT NULL,
              bet_amount REAL NOT NULL,
              currency TEXT NOT NULL,
              outcome TEXT,
              win_amount REAL NOT NULL DEFAULT 0,
              provable_seed TEXT,
              metadata TEXT NOT NULL DEFAULT '{}',
              created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at);

            CREATE TABLE IF NOT EXISTS refresh_tokens (
              user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
              token TEXT NOT NULL,
              expires_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS blackjack_games (
              user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
              state_json TEXT NOT NULL,
              deck_json TEXT NOT NULL,
              currency TEXT NOT NULL,
              expires_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS leaderboard_entries (
              period TEXT NOT NULL,
              period_key TEXT NOT NULL,
              user_id TEXT NOT NULL,
              username TEXT NOT NULL,
              amount REAL NOT NULL DEFAULT 0,
              PRIMARY KEY (period, period_key, user_id)
            );

            CREATE TABLE IF NOT EXISTS processed_webhooks (
              event_id TEXT PRIMARY KEY,
              created_at TEXT NOT NULL
            );
            """
        )


def json_data(value: Any) -> str:
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)


def decode_json(value: str | None, default: Any) -> Any:
    if not value:
        return default
    return json.loads(value)


def random_int(start: int, stop: int) -> int:
    return start + secrets.randbelow(stop - start + 1)


def generate_server_seed() -> str:
    return secrets.token_hex(32)


def sha256_hexdigest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def hash_seed(server_seed: str, client_seed: str, nonce: int) -> str:
    return hmac.new(server_seed.encode(), f"{client_seed}:{nonce}".encode(), hashlib.sha256).hexdigest()


def get_symbol_from_hash(hash_value: str, position: int) -> str:
    pair = hash_value[position * 2 : position * 2 + 2]
    return WEIGHTED_SYMBOLS[int(pair, 16) % len(WEIGHTED_SYMBOLS)]


def evaluate_line(symbols: list[str]) -> int:
    base_symbol = next((symbol for symbol in symbols if symbol != "🃏"), "🃏")
    count = 0
    for symbol in symbols:
        if symbol == base_symbol or symbol == "🃏":
            count += 1
        else:
            break
    if count >= 5:
        return 20
    if count == 4:
        return 5
    if count == 3:
        return 2
    return 0


def spin_slots(bet: float, server_seed: str, client_seed: str, nonce: int) -> dict[str, Any]:
    reels = [["🍒" for _ in range(REEL_COUNT)] for _ in range(ROW_COUNT)]
    base_hash = hash_seed(server_seed, client_seed, nonce)
    for reel in range(REEL_COUNT):
        reel_hash = sha256_hexdigest(f"{base_hash}:{reel}")
        for row in range(ROW_COUNT):
            reels[row][reel] = get_symbol_from_hash(reel_hash, row + reel * ROW_COUNT)
    total_win = 0.0
    multiplier = 0
    winning_paylines: list[int] = []
    for index, line in enumerate(PAYLINES):
        line_symbols = [reels[row][reel] for reel, row in enumerate(line)]
        line_multiplier = evaluate_line(line_symbols)
        if line_multiplier > 0:
            winning_paylines.append(index)
            total_win += bet * line_multiplier
            multiplier = max(multiplier, line_multiplier)
    scatter_count = sum(1 for row in reels for symbol in row if symbol == "🎰")
    return {
        "reels": reels,
        "paylines": winning_paylines,
        "winAmount": round(total_win, 2),
        "freeSpins": 10 if scatter_count >= 3 else 0,
        "multiplier": multiplier,
    }


def create_blackjack_deck() -> list[dict[str, Any]]:
    return [{**card, "suit": suit} for suit in SUITS for card in BLACKJACK_VALUES]


def shuffle_cards(deck: list[dict[str, Any]]) -> list[dict[str, Any]]:
    shuffled = deck[:]
    for index in range(len(shuffled) - 1, 0, -1):
        swap_index = random_int(0, index)
        shuffled[index], shuffled[swap_index] = shuffled[swap_index], shuffled[index]
    return shuffled


def deal_card(deck: list[dict[str, Any]]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    return deck[0], deck[1:]


def calculate_blackjack_score(hand: list[dict[str, Any]]) -> int:
    total = sum(int(card["numericValue"]) for card in hand)
    aces = sum(1 for card in hand if card["value"] == "A")
    while total > 21 and aces > 0:
        total -= 10
        aces -= 1
    return total


def blackjack_status(player_score: int, dealer_score: int) -> str:
    if player_score > 21:
        return "player_bust"
    if dealer_score > 21:
        return "dealer_bust"
    if player_score > dealer_score:
        return "player_win"
    if dealer_score > player_score:
        return "dealer_win"
    return "push"


def determine_blackjack_winner(state: dict[str, Any]) -> dict[str, Any]:
    updated = state.copy()
    updated["status"] = blackjack_status(updated["playerScore"], updated["dealerScore"])
    return updated


def start_blackjack_game(bet: float) -> dict[str, Any]:
    deck = shuffle_cards(create_blackjack_deck())
    player_hand: list[dict[str, Any]] = []
    dealer_hand: list[dict[str, Any]] = []
    for _ in range(2):
        card, deck = deal_card(deck)
        player_hand.append(card)
        card, deck = deal_card(deck)
        dealer_hand.append(card)
    state = {
        "playerHand": player_hand,
        "dealerHand": dealer_hand,
        "playerScore": calculate_blackjack_score(player_hand),
        "dealerScore": calculate_blackjack_score(dealer_hand),
        "status": "playing",
        "bet": bet,
        "canDouble": True,
    }
    if state["playerScore"] == 21 or state["dealerScore"] == 21:
        if state["playerScore"] == 21 and state["dealerScore"] == 21:
            state["status"] = "push"
        elif state["playerScore"] == 21:
            state["status"] = "player_win"
        else:
            state["status"] = "dealer_win"
        state["canDouble"] = False
        return {"state": state, "deck": deck}
    return {"state": state, "deck": deck}


def blackjack_hit(state: dict[str, Any], deck: list[dict[str, Any]]) -> dict[str, Any]:
    card, remaining_deck = deal_card(deck)
    player_hand = [*state["playerHand"], card]
    updated_state = {**state, "playerHand": player_hand, "playerScore": calculate_blackjack_score(player_hand), "canDouble": False}
    if updated_state["playerScore"] > 21:
        updated_state = determine_blackjack_winner(updated_state)
    return {"state": updated_state, "deck": remaining_deck}


def blackjack_stand(state: dict[str, Any], deck: list[dict[str, Any]]) -> dict[str, Any]:
    current_deck = deck[:]
    dealer_hand = state["dealerHand"][:]
    while calculate_blackjack_score(dealer_hand) < 17:
        card, current_deck = deal_card(current_deck)
        dealer_hand.append(card)
    updated = {
        **state,
        "dealerHand": dealer_hand,
        "dealerScore": calculate_blackjack_score(dealer_hand),
        "canDouble": False,
    }
    return {"state": determine_blackjack_winner(updated), "deck": current_deck}


def blackjack_double(state: dict[str, Any], deck: list[dict[str, Any]]) -> dict[str, Any]:
    doubled_state = {**state, "bet": round(state["bet"] * 2, 2), "canDouble": False}
    hit_result = blackjack_hit(doubled_state, deck)
    if hit_result["state"]["status"] == "playing":
        return blackjack_stand(hit_result["state"], hit_result["deck"])
    return hit_result


def calculate_blackjack_payout(state: dict[str, Any]) -> float:
    if state["status"] == "push":
        return round(state["bet"], 2)
    if state["status"] in {"player_win", "dealer_bust"}:
        blackjack = state["playerScore"] == 21 and len(state["playerHand"]) == 2
        return round(state["bet"] * (2.5 if blackjack else 2), 2)
    return 0.0


def baccarat_card_value(rank: str) -> int:
    if rank == "A":
        return 1
    if rank in {"10", "J", "Q", "K"}:
        return 0
    return int(rank)


def create_baccarat_deck() -> list[dict[str, Any]]:
    return [{"suit": suit, "value": rank, "numericValue": baccarat_card_value(rank)} for suit in SUITS for rank in BACCARAT_RANKS]


def calculate_baccarat_score(hand: list[dict[str, Any]]) -> int:
    return sum(int(card["numericValue"]) for card in hand) % 10


def deal_baccarat() -> dict[str, Any]:
    deck = shuffle_cards(create_baccarat_deck())
    player_hand = [deck.pop(0), deck.pop(0)]
    banker_hand = [deck.pop(0), deck.pop(0)]
    player_score = calculate_baccarat_score(player_hand)
    banker_score = calculate_baccarat_score(banker_hand)
    if player_score < 8 and banker_score < 8:
        player_third_card: dict[str, Any] | None = None
        if player_score <= 5:
            player_third_card = deck.pop(0)
            player_hand.append(player_third_card)
            player_score = calculate_baccarat_score(player_hand)

        def should_banker_draw() -> bool:
            if not player_third_card:
                return banker_score <= 5
            third = int(player_third_card["numericValue"])
            if banker_score <= 2:
                return True
            if banker_score == 3:
                return third != 8
            if banker_score == 4:
                return third in {2, 3, 4, 5, 6, 7}
            if banker_score == 5:
                return third in {4, 5, 6, 7}
            if banker_score == 6:
                return third in {6, 7}
            return False

        if should_banker_draw():
            banker_hand.append(deck.pop(0))
            banker_score = calculate_baccarat_score(banker_hand)

    winner = "tie" if player_score == banker_score else "player" if player_score > banker_score else "banker"
    return {"playerHand": player_hand, "bankerHand": banker_hand, "winner": winner}


def calculate_baccarat_payout(bet: str, winner: str, amount: float) -> float:
    if bet != winner:
        return 0.0
    if bet == "tie":
        return round(amount * 9, 2)
    if bet == "banker":
        return round(amount * 1.95, 2)
    return round(amount * 2, 2)


def wheel_number(number: int) -> dict[str, Any]:
    return {"number": number, "color": "green" if number == 0 else "red" if number in RED_NUMBERS else "black"}


def roulette_column(number: int) -> int:
    return 0 if number == 0 else ((number - 1) % 3) + 1


def roulette_dozen(number: int) -> int:
    return 0 if number == 0 else (number - 1) // 12 + 1


def roulette_winnings(number: int, bets: list[dict[str, Any]]) -> float:
    color = wheel_number(number)["color"]
    total = 0.0
    for bet in bets:
        amount = float(bet["amount"])
        numbers = bet.get("numbers") or []
        match bet["type"]:
            case "straight":
                total += amount * 36 if number in numbers else 0
            case "split":
                total += amount * 18 if number in numbers else 0
            case "street":
                total += amount * 12 if number in numbers else 0
            case "corner":
                total += amount * 9 if number in numbers else 0
            case "red" | "black":
                total += amount * 2 if color == bet["type"] else 0
            case "even":
                total += amount * 2 if number != 0 and number % 2 == 0 else 0
            case "odd":
                total += amount * 2 if number % 2 == 1 else 0
            case "dozen":
                total += amount * 3 if roulette_dozen(number) == bet.get("value") else 0
            case "column":
                total += amount * 3 if roulette_column(number) == bet.get("value") else 0
    return round(total, 2)


def spin_roulette(bets: list[dict[str, Any]]) -> dict[str, Any]:
    number = random_int(0, 36)
    color = wheel_number(number)["color"]
    win_amount = roulette_winnings(number, bets)
    return {"number": number, "color": color, "win": win_amount > 0, "winAmount": win_amount}


def b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def b64url_decode(raw: str) -> bytes:
    padding = "=" * (-len(raw) % 4)
    return base64.urlsafe_b64decode(raw + padding)


def parse_duration(value: str) -> int:
    suffix = value[-1]
    amount = int(value[:-1])
    units = {"m": 60, "h": 3600, "d": 86400}
    return amount * units.get(suffix, 60)


def generate_jwt(payload: dict[str, Any]) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    body = {**payload, "exp": int(time.time()) + parse_duration(JWT_EXPIRES_IN)}
    encoded_header = b64url_encode(json_data(header).encode())
    encoded_body = b64url_encode(json_data(body).encode())
    signing_input = f"{encoded_header}.{encoded_body}".encode()
    signature = hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest()
    return f"{encoded_header}.{encoded_body}.{b64url_encode(signature)}"


def verify_jwt(token: str) -> dict[str, Any]:
    try:
        encoded_header, encoded_body, encoded_signature = token.split(".")
    except ValueError as exc:
        raise AppError("Invalid token.", status.HTTP_401_UNAUTHORIZED) from exc
    signing_input = f"{encoded_header}.{encoded_body}".encode()
    expected = hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest()
    if not hmac.compare_digest(expected, b64url_decode(encoded_signature)):
        raise AppError("Invalid token.", status.HTTP_401_UNAUTHORIZED)
    payload = json.loads(b64url_decode(encoded_body))
    if int(payload.get("exp", 0)) < int(time.time()):
        raise AppError("Token expired.", status.HTTP_401_UNAUTHORIZED)
    return payload


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    iterations = 310_000
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), iterations)
    return f"pbkdf2_sha256${iterations}${salt}${hashed.hex()}"


def compare_password(password: str, stored_hash: str) -> bool:
    try:
        _, iterations, salt, digest = stored_hash.split("$")
    except ValueError:
        return False
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(iterations))
    return hmac.compare_digest(candidate.hex(), digest)


def generate_refresh_token() -> str:
    return hmac.new(REFRESH_TOKEN_SECRET.encode(), f"{uuid4()}:{time.time()}".encode(), hashlib.sha256).hexdigest()


def row_to_user(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "sweepsCoins": round(float(row["sweeps_coins"]), 2),
        "goldCoins": round(float(row["gold_coins"]), 2),
        "role": row["role"],
        "state": row["state"],
        "createdAt": row["created_at"],
        "avatarUrl": row["avatar_url"],
        "selfExcluded": bool(row["self_excluded"]),
    }


def row_to_transaction(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "userId": row["user_id"],
        "type": row["type"],
        "amount": round(float(row["amount"]), 2),
        "currency": row["currency"],
        "metadata": decode_json(row["metadata"], {}),
        "createdAt": row["created_at"],
    }


def row_to_session(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "userId": row["user_id"],
        "gameType": row["game_type"],
        "betAmount": round(float(row["bet_amount"]), 2),
        "currency": row["currency"],
        "outcome": row["outcome"] or "",
        "winAmount": round(float(row["win_amount"]), 2),
        "provableSeed": row["provable_seed"] or "",
        "createdAt": row["created_at"],
    }


def find_user_by_id(user_id: str) -> dict[str, Any] | None:
    with db_connection() as connection:
        row = connection.execute("SELECT * FROM users WHERE id = ? LIMIT 1", (user_id,)).fetchone()
    return row_to_user(row) if row else None


def find_user_by_email(email: str, include_password_hash: bool = False) -> dict[str, Any] | None:
    with db_connection() as connection:
        row = connection.execute("SELECT * FROM users WHERE email = ? LIMIT 1", (email.lower(),)).fetchone()
    if not row:
        return None
    user = row_to_user(row)
    if include_password_hash:
        user["passwordHash"] = row["password_hash"]
    return user


def create_user(username: str, email: str, password: str, state: str) -> dict[str, Any]:
    role = "admin" if email in ADMIN_EMAILS else "player"
    created_at = now_iso()
    user_id = str(uuid4())
    with db_connection() as connection:
        try:
            connection.execute(
                """
                INSERT INTO users (id, username, email, password_hash, role, state, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (user_id, username, email.lower(), hash_password(password), role, state, created_at, created_at),
            )
        except sqlite3.IntegrityError as exc:
            message = "An account already exists for this email." if "email" in str(exc).lower() else "Username is already taken."
            raise AppError(message, status.HTTP_409_CONFLICT) from exc
    user = find_user_by_id(user_id)
    if not user:
        raise AppError("Unable to create user.")
    return user


def update_user_balance(user_id: str, sweeps_delta: float, gold_delta: float) -> dict[str, Any]:
    with db_connection() as connection:
        row = connection.execute("SELECT sweeps_coins, gold_coins FROM users WHERE id = ? LIMIT 1", (user_id,)).fetchone()
        if not row:
            raise AppError("User not found.", status.HTTP_404_NOT_FOUND)
        sweeps = round(float(row["sweeps_coins"]) + sweeps_delta, 2)
        gold = round(float(row["gold_coins"]) + gold_delta, 2)
        if sweeps < 0:
            raise AppError("Insufficient sweeps coin balance.")
        if gold < 0:
            raise AppError("Insufficient gold coin balance.")
        connection.execute(
            "UPDATE users SET sweeps_coins = ?, gold_coins = ?, updated_at = ? WHERE id = ?",
            (sweeps, gold, now_iso(), user_id),
        )
    user = find_user_by_id(user_id)
    if not user:
        raise AppError("User not found.", status.HTTP_404_NOT_FOUND)
    return user


def update_profile(user_id: str, username: str | None, avatar_url: str | None) -> dict[str, Any]:
    with db_connection() as connection:
        current = connection.execute("SELECT * FROM users WHERE id = ? LIMIT 1", (user_id,)).fetchone()
        if not current:
            raise AppError("User not found.", status.HTTP_404_NOT_FOUND)
        try:
            connection.execute(
                """
                UPDATE users
                SET username = ?, avatar_url = ?, updated_at = ?
                WHERE id = ?
                """,
                (username or current["username"], avatar_url if avatar_url is not None else current["avatar_url"], now_iso(), user_id),
            )
        except sqlite3.IntegrityError as exc:
            raise AppError("Username is already taken.", status.HTTP_409_CONFLICT) from exc
    user = find_user_by_id(user_id)
    if not user:
        raise AppError("User not found.", status.HTTP_404_NOT_FOUND)
    return user


def set_self_excluded(user_id: str, self_excluded: bool) -> dict[str, Any]:
    with db_connection() as connection:
        connection.execute(
            "UPDATE users SET self_excluded = ?, updated_at = ? WHERE id = ?",
            (1 if self_excluded else 0, now_iso(), user_id),
        )
    user = find_user_by_id(user_id)
    if not user:
        raise AppError("User not found.", status.HTTP_404_NOT_FOUND)
    return user


def list_users() -> list[dict[str, Any]]:
    with db_connection() as connection:
        rows = connection.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
    return [row_to_user(row) for row in rows]


def store_refresh_token(user_id: str, token: str) -> None:
    expires_at = int(time.time()) + 60 * 60 * 24 * 30
    with db_connection() as connection:
        connection.execute(
            """
            INSERT INTO refresh_tokens (user_id, token, expires_at)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET token = excluded.token, expires_at = excluded.expires_at
            """,
            (user_id, token, expires_at),
        )


def verify_refresh_token(user_id: str, token: str) -> bool:
    with db_connection() as connection:
        row = connection.execute("SELECT token, expires_at FROM refresh_tokens WHERE user_id = ? LIMIT 1", (user_id,)).fetchone()
    return bool(row and row["expires_at"] >= int(time.time()) and hmac.compare_digest(row["token"], token))


def delete_refresh_token(user_id: str) -> None:
    with db_connection() as connection:
        connection.execute("DELETE FROM refresh_tokens WHERE user_id = ?", (user_id,))


def record_transaction(user_id: str, tx_type: str, amount: float, currency: str, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
    tx_id = str(uuid4())
    created_at = now_iso()
    with db_connection() as connection:
        connection.execute(
            """
            INSERT INTO transactions (id, user_id, type, amount, currency, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (tx_id, user_id, tx_type, round(amount, 2), currency, json_data(metadata or {}), created_at),
        )
        row = connection.execute("SELECT * FROM transactions WHERE id = ? LIMIT 1", (tx_id,)).fetchone()
    return row_to_transaction(row)


def get_user_transactions(user_id: str, page: int = 1, limit: int = 20) -> list[dict[str, Any]]:
    offset = max(page - 1, 0) * limit
    with db_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (user_id, limit, offset),
        ).fetchall()
    return [row_to_transaction(row) for row in rows]


def create_game_session(
    user_id: str,
    game_type: str,
    bet_amount: float,
    currency: str,
    outcome: str,
    win_amount: float,
    provable_seed: str = "",
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    session_id = str(uuid4())
    created_at = now_iso()
    with db_connection() as connection:
        connection.execute(
            """
            INSERT INTO game_sessions (id, user_id, game_type, bet_amount, currency, outcome, win_amount, provable_seed, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (session_id, user_id, game_type, round(bet_amount, 2), currency, outcome, round(win_amount, 2), provable_seed, json_data(metadata or {}), created_at),
        )
        row = connection.execute("SELECT * FROM game_sessions WHERE id = ? LIMIT 1", (session_id,)).fetchone()
    return row_to_session(row)


def get_game_history(user_id: str, page: int = 1, limit: int = 20) -> list[dict[str, Any]]:
    offset = max(page - 1, 0) * limit
    with db_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM game_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (user_id, limit, offset),
        ).fetchall()
    return [row_to_session(row) for row in rows]


def get_stats() -> dict[str, int]:
    cutoff = (now_utc() - timedelta(hours=24)).isoformat()
    with db_connection() as connection:
        total_players = connection.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
        total_transactions = connection.execute("SELECT COUNT(*) AS count FROM transactions").fetchone()["count"]
        active_games = connection.execute("SELECT COUNT(*) AS count FROM game_sessions WHERE created_at >= ?", (cutoff,)).fetchone()["count"]
    return {"totalPlayers": int(total_players), "totalTransactions": int(total_transactions), "activeGames": int(active_games)}


def save_blackjack_game(user_id: str, state: dict[str, Any], deck: list[dict[str, Any]], currency: str) -> None:
    expires_at = int(time.time()) + 60 * 30
    with db_connection() as connection:
        connection.execute(
            """
            INSERT INTO blackjack_games (user_id, state_json, deck_json, currency, expires_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              state_json = excluded.state_json,
              deck_json = excluded.deck_json,
              currency = excluded.currency,
              expires_at = excluded.expires_at
            """,
            (user_id, json_data(state), json_data(deck), currency, expires_at),
        )


def load_blackjack_game(user_id: str) -> dict[str, Any] | None:
    with db_connection() as connection:
        row = connection.execute("SELECT * FROM blackjack_games WHERE user_id = ? LIMIT 1", (user_id,)).fetchone()
        if not row:
            return None
        if int(row["expires_at"]) < int(time.time()):
            connection.execute("DELETE FROM blackjack_games WHERE user_id = ?", (user_id,))
            return None
    return {
        "state": decode_json(row["state_json"], {}),
        "deck": decode_json(row["deck_json"], []),
        "currency": row["currency"],
    }


def delete_blackjack_game(user_id: str) -> None:
    with db_connection() as connection:
        connection.execute("DELETE FROM blackjack_games WHERE user_id = ?", (user_id,))


def daily_period_key() -> str:
    return now_utc().date().isoformat()


def weekly_period_key() -> str:
    current = now_utc()
    first_day = datetime(current.year, 1, 1, tzinfo=UTC)
    diff = (current - first_day).days
    week = (diff + first_day.weekday() + 2 + 6) // 7
    return f"{current.year}-{week}"


async def record_win(user_id: str, username: str, amount: float) -> None:
    rounded_amount = round(amount, 2)
    with db_connection() as connection:
        for period, period_key in (("daily", daily_period_key()), ("weekly", weekly_period_key())):
            connection.execute(
                """
                INSERT INTO leaderboard_entries (period, period_key, user_id, username, amount)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(period, period_key, user_id) DO UPDATE SET
                  username = excluded.username,
                  amount = leaderboard_entries.amount + excluded.amount
                """,
                (period, period_key, user_id, username, rounded_amount),
            )
    payload = {
        "userId": user_id,
        "username": username,
        "amount": rounded_amount,
        "daily": leaderboard("daily"),
        "weekly": leaderboard("weekly"),
    }
    await sio.emit("leaderboard:update", payload, room="leaderboard")


def leaderboard(period: Literal["daily", "weekly"]) -> list[dict[str, Any]]:
    key = daily_period_key() if period == "daily" else weekly_period_key()
    with db_connection() as connection:
        rows = connection.execute(
            """
            SELECT username, amount
            FROM leaderboard_entries
            WHERE period = ? AND period_key = ?
            ORDER BY amount DESC, username ASC
            LIMIT 20
            """,
            (period, key),
        ).fetchall()
    return [{"rank": index + 1, "username": row["username"], "amount": round(float(row["amount"]), 2)} for index, row in enumerate(rows)]


def claim_daily_bonus(user_id: str) -> dict[str, Any]:
    with db_connection() as connection:
        row = connection.execute("SELECT sweeps_coins, last_daily_bonus_at FROM users WHERE id = ? LIMIT 1", (user_id,)).fetchone()
        if not row:
            raise AppError("User not found.", status.HTTP_404_NOT_FOUND)
        last_claimed = parse_iso(row["last_daily_bonus_at"])
        if last_claimed and now_utc() - last_claimed < timedelta(hours=24):
            raise AppError("Daily bonus already claimed in the last 24 hours.")
        timestamp = now_iso()
        updated_sweeps = round(float(row["sweeps_coins"]) + DAILY_BONUS_SC, 2)
        connection.execute(
            "UPDATE users SET sweeps_coins = ?, last_daily_bonus_at = ?, updated_at = ? WHERE id = ?",
            (updated_sweeps, timestamp, timestamp, user_id),
        )
        connection.execute(
            """
            INSERT INTO transactions (id, user_id, type, amount, currency, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (str(uuid4()), user_id, "daily_bonus", DAILY_BONUS_SC, "SC", json_data({"source": "daily_bonus"}), timestamp),
        )
        row = connection.execute("SELECT * FROM users WHERE id = ? LIMIT 1", (user_id,)).fetchone()
    if not row:
        raise AppError("User not found.", status.HTTP_404_NOT_FOUND)
    return row_to_user(row)


def create_payment_request(user_id: str, package_id: str, amount: float) -> dict[str, Any]:
    package = next((item for item in COIN_PACKAGES if item["id"] == package_id), None)
    if not package:
        raise AppError("Invalid coin package.")
    return {
        "paymentUrl": f"https://cash.app/{CASHAPP_CASHTAG}/{float(package['price']):.2f}",
        "requestId": str(uuid4()),
        "metadata": {"userId": user_id, "packageId": package_id, "amount": float(package["price"]), "requestedAmount": amount},
    }


def verify_webhook_signature(payload: str, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return len(signature) == len(expected) and hmac.compare_digest(signature, expected)


def process_payment(user_id: str, package_id: str) -> dict[str, Any]:
    package = next((item for item in COIN_PACKAGES if item["id"] == package_id), None)
    if not package:
        raise AppError("Invalid coin package.")
    user = update_user_balance(user_id, float(package["sweepsCoins"]), float(package["goldCoins"]))
    record_transaction(
        user_id,
        "purchase",
        float(package["price"]),
        "GC",
        {"packageId": package_id, "goldCoins": package["goldCoins"], "sweepsCoins": package["sweepsCoins"]},
    )
    return user


async def settle_blackjack_action(user_id: str, action: Literal["hit", "stand", "double"]) -> dict[str, Any]:
    game = load_blackjack_game(user_id)
    if not game:
        raise AppError("No blackjack game in progress.", status.HTTP_404_NOT_FOUND)
    state = game["state"]
    if state.get("status") != "playing":
        delete_blackjack_game(user_id)
        raise AppError("No blackjack game in progress.", status.HTTP_404_NOT_FOUND)
    if action == "double" and not state.get("canDouble", False):
        raise AppError("Double is only available before taking another action.")

    if action == "hit":
        result = blackjack_hit(state, game["deck"])
    elif action == "stand":
        result = blackjack_stand(state, game["deck"])
    else:
        update_user_balance(user_id, -state["bet"] if game["currency"] == "SC" else 0, -state["bet"] if game["currency"] == "GC" else 0)
        result = blackjack_double(state, game["deck"])

    payout = calculate_blackjack_payout(result["state"])
    profile = find_user_by_id(user_id)
    if result["state"]["status"] != "playing":
        delete_blackjack_game(user_id)
        if payout > 0:
            update_user_balance(user_id, payout if game["currency"] == "SC" else 0, payout if game["currency"] == "GC" else 0)
            if profile:
                await record_win(profile["id"], profile["username"], max(0.0, round(payout - result["state"]["bet"], 2)))
        create_game_session(user_id, "blackjack", result["state"]["bet"], game["currency"], result["state"]["status"], payout, metadata=result["state"])
        record_transaction(user_id, "win" if payout > result["state"]["bet"] else "loss", payout if payout > 0 else result["state"]["bet"], game["currency"], {"game": "blackjack", "status": result["state"]["status"]})
    else:
        save_blackjack_game(user_id, result["state"], result["deck"], game["currency"])
    return {"currency": game["currency"], "state": result["state"], "payout": payout}


def mark_webhook_processed(event_id: str) -> bool:
    with db_connection() as connection:
        existing = connection.execute("SELECT event_id FROM processed_webhooks WHERE event_id = ? LIMIT 1", (event_id,)).fetchone()
        if existing:
            return False
        connection.execute("INSERT INTO processed_webhooks (event_id, created_at) VALUES (?, ?)", (event_id, now_iso()))
    return True


def process_payment_webhook(event_id: str, user_id: str, package_id: str) -> dict[str, Any] | None:
    package = next((item for item in COIN_PACKAGES if item["id"] == package_id), None)
    if not package:
        raise AppError("Invalid coin package.")
    with db_connection() as connection:
        existing = connection.execute("SELECT event_id FROM processed_webhooks WHERE event_id = ? LIMIT 1", (event_id,)).fetchone()
        if existing:
            return None
        user_row = connection.execute("SELECT * FROM users WHERE id = ? LIMIT 1", (user_id,)).fetchone()
        if not user_row:
            raise AppError("User not found.", status.HTTP_404_NOT_FOUND)
        sweeps = round(float(user_row["sweeps_coins"]) + float(package["sweepsCoins"]), 2)
        gold = round(float(user_row["gold_coins"]) + float(package["goldCoins"]), 2)
        timestamp = now_iso()
        connection.execute(
            "UPDATE users SET sweeps_coins = ?, gold_coins = ?, updated_at = ? WHERE id = ?",
            (sweeps, gold, timestamp, user_id),
        )
        connection.execute(
            """
            INSERT INTO transactions (id, user_id, type, amount, currency, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid4()),
                user_id,
                "purchase",
                float(package["price"]),
                "GC",
                json_data({"packageId": package_id, "goldCoins": package["goldCoins"], "sweepsCoins": package["sweepsCoins"]}),
                timestamp,
            ),
        )
        connection.execute("INSERT INTO processed_webhooks (event_id, created_at) VALUES (?, ?)", (event_id, timestamp))
        updated_row = connection.execute("SELECT * FROM users WHERE id = ? LIMIT 1", (user_id,)).fetchone()
    if not updated_row:
        raise AppError("User not found.", status.HTTP_404_NOT_FOUND)
    return row_to_user(updated_row)


def auth_from_header(authorization: str | None) -> AuthUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise AppError("Authorization token is required.", status.HTTP_401_UNAUTHORIZED)
    payload = verify_jwt(authorization.removeprefix("Bearer ").strip())
    return AuthUser(user_id=payload["userId"], email=payload["email"], role=payload["role"])


def require_auth(authorization: str | None = Header(default=None)) -> AuthUser:
    return auth_from_header(authorization)


def require_admin(user: AuthUser = Depends(require_auth)) -> AuthUser:
    if user.role != "admin":
        raise AppError("Admin access required.", status.HTTP_403_FORBIDDEN)
    return user


@asynccontextmanager
async def lifespan(_app: FastAPI) -> Iterator[None]:
    init_db()
    refresh_static_index()
    yield


app = FastAPI(title="Spin Out Python Runtime", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins=ALLOWED_ORIGINS)
socket_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path="socket.io")


@app.exception_handler(AppError)
async def app_error_handler(_request: Request, error: AppError) -> JSONResponse:
    return JSONResponse(status_code=error.status_code, content={"success": False, "error": error.message})


@app.exception_handler(HTTPException)
async def http_error_handler(_request: Request, error: HTTPException) -> JSONResponse:
    detail = error.detail if isinstance(error.detail, str) else "Request failed."
    return JSONResponse(status_code=error.status_code, content={"success": False, "error": detail})


@app.exception_handler(Exception)
async def unexpected_error_handler(_request: Request, error: Exception) -> JSONResponse:
    print(f"[spin-out] unexpected error: {error}", file=sys.stderr)
    return JSONResponse(status_code=500, content={"success": False, "error": "Internal server error."})


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"success": True, "message": "Spin Out server is healthy."}


@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest) -> dict[str, Any]:
    if payload.state in RESTRICTED_STATES:
        raise AppError("Residents of this state are not eligible.", status.HTTP_403_FORBIDDEN)
    if find_user_by_email(payload.email):
        raise AppError("An account already exists for this email.", status.HTTP_409_CONFLICT)
    user = create_user(payload.username, payload.email, payload.password, payload.state)
    token = generate_jwt({"userId": user["id"], "email": user["email"], "role": user["role"]})
    return {"success": True, "data": {"user": user, "token": token}}


@app.post("/api/auth/login")
async def login(payload: LoginRequest) -> dict[str, Any]:
    user = find_user_by_email(payload.email, include_password_hash=True)
    if not user or "passwordHash" not in user or not compare_password(payload.password, str(user["passwordHash"])):
        raise AppError("Invalid email or password.", status.HTTP_401_UNAUTHORIZED)
    if user["selfExcluded"]:
        raise AppError("This account is self-excluded.", status.HTTP_403_FORBIDDEN)
    token = generate_jwt({"userId": user["id"], "email": user["email"], "role": user["role"]})
    refresh_token = generate_refresh_token()
    store_refresh_token(str(user["id"]), refresh_token)
    user.pop("passwordHash", None)
    return {"success": True, "data": {"user": user, "token": token, "refreshToken": refresh_token}}


@app.post("/api/auth/refresh")
async def refresh(payload: RefreshRequest) -> dict[str, Any]:
    if not verify_refresh_token(payload.userId, payload.refreshToken):
        raise AppError("Refresh token is invalid.", status.HTTP_401_UNAUTHORIZED)
    user = find_user_by_id(payload.userId)
    if not user:
        raise AppError("User not found.", status.HTTP_404_NOT_FOUND)
    token = generate_jwt({"userId": user["id"], "email": user["email"], "role": user["role"]})
    return {"success": True, "data": {"token": token}}


@app.post("/api/auth/logout")
async def logout(payload: LogoutRequest, user: AuthUser = Depends(require_auth)) -> dict[str, Any]:
    if payload.userId != user.user_id:
        raise AppError("Cannot revoke another user's session.", status.HTTP_403_FORBIDDEN)
    if not payload.refreshToken or not verify_refresh_token(user.user_id, payload.refreshToken):
        raise AppError("Refresh token is invalid.", status.HTTP_401_UNAUTHORIZED)
    delete_refresh_token(user.user_id)
    return {"success": True, "message": "Logged out successfully."}


@app.get("/api/user/profile")
async def user_profile(user: AuthUser = Depends(require_auth)) -> dict[str, Any]:
    profile = find_user_by_id(user.user_id)
    if not profile:
        raise AppError("User not found.", status.HTTP_404_NOT_FOUND)
    return {"success": True, "data": {"user": profile, "history": get_game_history(profile["id"], 1, 10)}}


@app.put("/api/user/profile")
async def user_profile_update(payload: UpdateProfileRequest, user: AuthUser = Depends(require_auth)) -> dict[str, Any]:
    avatar_url = None if payload.avatar == "" else payload.avatar
    updated = update_profile(user.user_id, payload.username, avatar_url)
    return {"success": True, "data": updated}


@app.get("/api/user/transactions")
async def user_transactions(page: int = 1, limit: int = 20, user: AuthUser = Depends(require_auth)) -> dict[str, Any]:
    return {"success": True, "data": get_user_transactions(user.user_id, page, limit)}


@app.post("/api/user/daily-bonus")
async def daily_bonus(user: AuthUser = Depends(require_auth)) -> dict[str, Any]:
    return {"success": True, "data": claim_daily_bonus(user.user_id), "message": "Daily sweeps coin awarded."}


@app.post("/api/user/self-exclude")
async def self_exclude(user: AuthUser = Depends(require_auth)) -> dict[str, Any]:
    return {"success": True, "data": set_self_excluded(user.user_id, True), "message": "Self-exclusion activated."}


@app.post("/api/games/slots/spin")
async def slot_spin(payload: SlotsSpinRequest, user: AuthUser = Depends(require_auth)) -> dict[str, Any]:
    profile = find_user_by_id(user.user_id)
    if not profile or profile["selfExcluded"]:
        raise AppError("Unable to play games on this account.", status.HTTP_403_FORBIDDEN)
    update_user_balance(profile["id"], -payload.bet if payload.currency == "SC" else 0, -payload.bet if payload.currency == "GC" else 0)
    server_seed = generate_server_seed()
    result = spin_slots(payload.bet, server_seed, payload.clientSeed, payload.nonce)
    if result["winAmount"] > 0:
        update_user_balance(profile["id"], result["winAmount"] if payload.currency == "SC" else 0, result["winAmount"] if payload.currency == "GC" else 0)
        await record_win(profile["id"], profile["username"], max(0.0, round(result["winAmount"] - payload.bet, 2)))
    record_transaction(profile["id"], "win" if result["winAmount"] > 0 else "loss", result["winAmount"] if result["winAmount"] > 0 else payload.bet, payload.currency, {"game": "slots", "clientSeed": payload.clientSeed, "nonce": payload.nonce, "paylines": result["paylines"]})
    session = create_game_session(profile["id"], "slot", payload.bet, payload.currency, "win" if result["winAmount"] > 0 else "loss", result["winAmount"], server_seed, result)
    return {"success": True, "data": {"result": result, "session": session}}


@app.post("/api/games/blackjack/start")
async def blackjack_start(payload: BlackjackStartRequest, user: AuthUser = Depends(require_auth)) -> dict[str, Any]:
    profile = find_user_by_id(user.user_id)
    if not profile or profile["selfExcluded"]:
        raise AppError("Unable to play games on this account.", status.HTTP_403_FORBIDDEN)
    update_user_balance(profile["id"], -payload.bet if payload.currency == "SC" else 0, -payload.bet if payload.currency == "GC" else 0)
    game = start_blackjack_game(payload.bet)
    if game["state"]["status"] != "playing":
        payout = calculate_blackjack_payout(game["state"])
        if payout > 0:
            update_user_balance(profile["id"], payout if payload.currency == "SC" else 0, payout if payload.currency == "GC" else 0)
            await record_win(profile["id"], profile["username"], max(0.0, round(payout - game["state"]["bet"], 2)))
        create_game_session(profile["id"], "blackjack", game["state"]["bet"], payload.currency, game["state"]["status"], payout, metadata=game["state"])
        record_transaction(profile["id"], "win" if payout > game["state"]["bet"] else "loss", payout if payout > 0 else game["state"]["bet"], payload.currency, {"game": "blackjack", "status": game["state"]["status"]})
        return {"success": True, "data": {**game["state"], "payout": payout}}
    save_blackjack_game(profile["id"], game["state"], game["deck"], payload.currency)
    return {"success": True, "data": game["state"]}


@app.post("/api/games/blackjack/action")
async def blackjack_action(payload: BlackjackActionRequest, user: AuthUser = Depends(require_auth)) -> dict[str, Any]:
    result = await settle_blackjack_action(user.user_id, payload.action)
    return {"success": True, "data": {**result["state"], "payout": result["payout"]}}


@app.post("/api/games/roulette/spin")
async def roulette_spin(payload: RouletteSpinRequest, user: AuthUser = Depends(require_auth)) -> dict[str, Any]:
    profile = find_user_by_id(user.user_id)
    if not profile or profile["selfExcluded"]:
        raise AppError("Unable to play games on this account.", status.HTTP_403_FORBIDDEN)
    bets = [bet.model_dump() for bet in payload.bets]
    total_bet = round(sum(float(bet["amount"]) for bet in bets), 2)
    update_user_balance(profile["id"], -total_bet if payload.currency == "SC" else 0, -total_bet if payload.currency == "GC" else 0)
    result = spin_roulette(bets)
    if result["winAmount"] > 0:
        update_user_balance(profile["id"], result["winAmount"] if payload.currency == "SC" else 0, result["winAmount"] if payload.currency == "GC" else 0)
        await record_win(profile["id"], profile["username"], max(0.0, round(result["winAmount"] - total_bet, 2)))
    create_game_session(profile["id"], "roulette", total_bet, payload.currency, "win" if result["win"] else "loss", result["winAmount"], metadata={"bets": bets, "result": result})
    record_transaction(profile["id"], "win" if result["win"] else "loss", result["winAmount"] if result["win"] else total_bet, payload.currency, {"game": "roulette"})
    return {"success": True, "data": result}


@app.post("/api/games/baccarat/deal")
async def baccarat_deal(payload: BaccaratDealRequest, user: AuthUser = Depends(require_auth)) -> dict[str, Any]:
    profile = find_user_by_id(user.user_id)
    if not profile or profile["selfExcluded"]:
        raise AppError("Unable to play games on this account.", status.HTTP_403_FORBIDDEN)
    update_user_balance(profile["id"], -payload.amount if payload.currency == "SC" else 0, -payload.amount if payload.currency == "GC" else 0)
    result = deal_baccarat()
    payout = calculate_baccarat_payout(payload.bet, result["winner"], payload.amount)
    if payout > 0:
        update_user_balance(profile["id"], payout if payload.currency == "SC" else 0, payout if payload.currency == "GC" else 0)
        await record_win(profile["id"], profile["username"], max(0.0, round(payout - payload.amount, 2)))
    create_game_session(profile["id"], "baccarat", payload.amount, payload.currency, result["winner"], payout, metadata=result)
    record_transaction(profile["id"], "win" if payout > 0 else "loss", payout if payout > 0 else payload.amount, payload.currency, {"game": "baccarat", "winner": result["winner"], "bet": payload.bet})
    return {"success": True, "data": {**result, "payout": payout}}


@app.get("/api/games/history")
async def game_history(page: int = 1, limit: int = 20, user: AuthUser = Depends(require_auth)) -> dict[str, Any]:
    return {"success": True, "data": get_game_history(user.user_id, page, limit)}


@app.get("/api/cashapp/packages")
async def cashapp_packages() -> dict[str, Any]:
    return {"success": True, "data": {"packages": COIN_PACKAGES, "cashtag": CASHAPP_CASHTAG}}


@app.post("/api/cashapp/create-payment")
async def cashapp_create_payment(payload: PaymentRequest, user: AuthUser = Depends(require_auth)) -> dict[str, Any]:
    return {"success": True, "data": create_payment_request(user.user_id, payload.packageId, payload.amount)}


@app.post("/api/cashapp/webhook")
async def cashapp_webhook(payload: PaymentWebhookRequest, request: Request) -> dict[str, Any]:
    signature = request.headers.get("x-cashapp-signature", "")
    secret = os.getenv("CASHAPP_WEBHOOK_SECRET", "")
    if not secret:
        raise AppError("CashApp webhook secret is not configured.", status.HTTP_503_SERVICE_UNAVAILABLE)
    body = (await request.body()).decode() or json_data(payload.model_dump())
    if not signature or not verify_webhook_signature(body, signature, secret):
        raise AppError("Invalid webhook signature.", status.HTTP_401_UNAUTHORIZED)
    event_id = payload.eventId or request.headers.get("x-cashapp-event-id", "").strip()
    if not event_id:
        raise AppError("CashApp webhook event id is required.")
    processed = process_payment_webhook(event_id, payload.userId, payload.packageId)
    if processed is None:
        return {"success": True, "message": "Webhook already processed."}
    return {"success": True, "data": processed}


@app.get("/api/leaderboard/daily")
async def daily_leaderboard() -> dict[str, Any]:
    return {"success": True, "data": leaderboard("daily")}


@app.get("/api/leaderboard/weekly")
async def weekly_leaderboard() -> dict[str, Any]:
    return {"success": True, "data": leaderboard("weekly")}


@app.post("/api/leaderboard/record-win")
async def leaderboard_record_win(payload: RecordWinRequest, _user: AuthUser = Depends(require_admin)) -> dict[str, Any]:
    await record_win(payload.userId, payload.username, payload.amount)
    return {"success": True, "message": "Win recorded."}


@app.get("/api/admin/users")
async def admin_users(_user: AuthUser = Depends(require_admin)) -> dict[str, Any]:
    return {"success": True, "data": list_users()}


@app.get("/api/admin/stats")
async def admin_stats(_user: AuthUser = Depends(require_admin)) -> dict[str, Any]:
    return {"success": True, "data": get_stats()}


@app.put("/api/admin/user/{target_user_id}/balance")
async def admin_adjust_balance(target_user_id: str, payload: AdminBalanceUpdateRequest, _user: AuthUser = Depends(require_admin)) -> dict[str, Any]:
    return {"success": True, "data": update_user_balance(target_user_id, payload.scAmount, payload.gcAmount)}


@sio.event
async def connect(sid: str, environ: dict[str, Any], auth: dict[str, Any] | None) -> None:
    session: dict[str, Any] = {}
    token = auth.get("token") if isinstance(auth, dict) else None
    if token:
        try:
            session["user"] = verify_jwt(token)
        except AppError:
            await sio.emit("error-message", {"message": "Invalid token provided to socket connection."}, to=sid)
    await sio.save_session(sid, session)


@sio.on("join-game")
async def join_game(sid: str, room: str) -> None:
    if room != "leaderboard":
        await sio.emit("error-message", {"message": "Unsupported room."}, to=sid)
        return
    session = await sio.get_session(sid)
    if not session.get("user"):
        await sio.emit("error-message", {"message": "Authentication required for leaderboard room."}, to=sid)
        return
    await sio.enter_room(sid, room)


@sio.on("leave-game")
async def leave_game(sid: str, room: str) -> None:
    if room != "leaderboard":
        return
    await sio.leave_room(sid, room)


@sio.on("blackjack:action")
async def socket_blackjack_action(sid: str, data: dict[str, Any]) -> dict[str, Any]:
    session = await sio.get_session(sid)
    auth_user = session.get("user")
    if not auth_user:
        return {"success": False, "error": "Unauthorized socket user."}
    action = data.get("action")
    if action not in {"hit", "stand", "double"}:
        return {"success": False, "error": "Invalid blackjack action."}
    try:
        result = await settle_blackjack_action(auth_user["userId"], action)
    except AppError as error:
        return {"success": False, "error": error.message}
    await sio.emit("blackjack:update", {**result["state"], "payout": result["payout"]}, to=sid)
    return {"success": True, "data": {**result["state"], "payout": result["payout"]}}


@sio.on("leaderboard:subscribe")
async def leaderboard_subscribe(sid: str) -> None:
    session = await sio.get_session(sid)
    if not session.get("user"):
        await sio.emit("error-message", {"message": "Authentication required for leaderboard room."}, to=sid)
        return
    await sio.enter_room(sid, "leaderboard")


@app.get("/", include_in_schema=False, response_model=None)
async def root_index() -> Response:
    index_file = STATIC_FILE_INDEX.get("index.html")
    if index_file and index_file.exists():
        return FileResponse(index_file)
    return JSONResponse(status_code=503, content={"success": False, "error": "Frontend bundle not found. Build the client first."})


@app.get("/{full_path:path}", include_in_schema=False, response_model=None)
async def spa_assets(full_path: str) -> Response:
    """Serve bundled frontend assets and fall back to index.html for safe SPA routes only."""
    parts = Path(full_path).parts
    top_level = parts[0] if parts else ""
    if top_level in {"api", "socket.io", "health"}:
        raise HTTPException(status_code=404, detail="Not found.")
    if Path(full_path).is_absolute() or ".." in parts or any(part.startswith(".") for part in parts):
        raise HTTPException(status_code=404, detail="Not found.")
    candidate = STATIC_FILE_INDEX.get(Path(full_path).as_posix())
    if candidate and candidate.is_file():
        return FileResponse(candidate)
    if Path(full_path).suffix:
        raise HTTPException(status_code=404, detail="Not found.")
    index_file = STATIC_FILE_INDEX.get("index.html")
    if index_file and index_file.exists():
        return FileResponse(index_file)
    return JSONResponse(status_code=503, content={"success": False, "error": "Frontend bundle not found. Build the client first."})


if __name__ == "__main__":
    uvicorn.run(socket_app, host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", "4000")))
