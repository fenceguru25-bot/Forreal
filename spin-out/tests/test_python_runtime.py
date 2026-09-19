import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

import python_runtime


class PythonRuntimeTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.original_db_path = python_runtime.DB_PATH
        python_runtime.DB_PATH = Path(self.temp_dir.name) / "test.db"
        python_runtime.init_db()
        user = python_runtime.create_user("tester", "tester@example.com", "password123", "TX")
        self.user_id = user["id"]

    def tearDown(self) -> None:
        python_runtime.DB_PATH = self.original_db_path
        self.temp_dir.cleanup()

    async def test_record_win_accumulates_daily_and_weekly_leaderboards(self) -> None:
        with patch.object(python_runtime.sio, "emit", new=AsyncMock()) as emit_mock:
            await python_runtime.record_win(self.user_id, "tester", 1.5)
            await python_runtime.record_win(self.user_id, "tester", 2.0)

        daily = python_runtime.leaderboard("daily")
        weekly = python_runtime.leaderboard("weekly")

        self.assertEqual(len(daily), 1)
        self.assertEqual(len(weekly), 1)
        self.assertEqual(daily[0]["amount"], 3.5)
        self.assertEqual(weekly[0]["amount"], 3.5)
        self.assertEqual(daily[0]["rank"], 1)
        self.assertEqual(weekly[0]["rank"], 1)
        self.assertGreaterEqual(emit_mock.await_count, 2)

    def test_create_payment_request_uses_package_price(self) -> None:
        payment = python_runtime.create_payment_request(self.user_id, "diamond", 0.01)
        self.assertTrue(payment["paymentUrl"].endswith("/99.99"))
        self.assertEqual(payment["metadata"]["packageId"], "diamond")
        self.assertEqual(payment["metadata"]["amount"], 99.99)
        self.assertEqual(payment["metadata"]["requestedAmount"], 0.01)


if __name__ == "__main__":
    unittest.main()
