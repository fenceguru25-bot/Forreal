declare module '@prisma/client' {
  export interface User {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    state: string;
    kycStatus: string;
    accountTier: string;
    emailVerified: boolean;
    verifyToken: string | null;
    isSelfExcluded: boolean;
    selfExcludedUntil: Date | null;
    depositLimit: number | null;
    createdAt: Date;
    updatedAt: Date;
    wallet?: Wallet | null;
  }

  export interface Wallet {
    id: string;
    userId: string;
    gcBalance: number;
    scBalance: number;
    updatedAt: Date;
  }

  export interface Transaction {
    id: string;
    userId: string;
    type: string;
    currency: string;
    amount: number;
    description: string;
    createdAt: Date;
    user?: Pick<User, 'email' | 'firstName' | 'lastName'>;
  }

  export interface Game {
    id: string;
    name: string;
    provider: string;
    category: string;
    imageUrl: string;
    isActive: boolean;
    minBetGc: number;
    minBetSc: number;
    rtp: number;
    createdAt: Date;
  }

  export interface Promotion {
    id: string;
    name: string;
    description: string;
    type: string;
    gcAmount: number;
    scAmount: number;
    isActive: boolean;
    maxClaims: number | null;
    claimCount: number;
    expiresAt: Date | null;
    createdAt: Date;
  }

  export interface PromotionClaim {
    id: string;
    userId: string;
    promotionId: string;
    claimedAt: Date;
  }

  export interface AmoeEntry {
    id: string;
    userId: string | null;
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    processedAt: Date | null;
    scAwarded: number;
    createdAt: Date;
  }

  interface UserDelegate {
    findUnique(args?: any): Promise<User | null>;
    findFirst(args?: any): Promise<User | null>;
    findMany(args?: any): Promise<User[]>;
    create(args?: any): Promise<User>;
    update(args?: any): Promise<User>;
    count(args?: any): Promise<number>;
  }

  interface WalletDelegate {
    findUnique(args?: any): Promise<Wallet | null>;
    update(args?: any): Promise<Wallet>;
  }

  interface TransactionDelegate {
    findMany(args?: any): Promise<Transaction[]>;
    create(args?: any): Promise<Transaction>;
    count(args?: any): Promise<number>;
  }

  interface GameDelegate {
    findMany(args?: any): Promise<Game[]>;
    findUnique(args?: any): Promise<Game | null>;
  }

  interface PromotionDelegate {
    findMany(args?: any): Promise<Promotion[]>;
    findUnique(args?: any): Promise<Promotion | null>;
    update(args?: any): Promise<Promotion>;
  }

  interface PromotionClaimDelegate {
    findFirst(args?: any): Promise<PromotionClaim | null>;
    create(args?: any): Promise<PromotionClaim>;
  }

  interface AmoeEntryDelegate {
    create(args?: any): Promise<AmoeEntry>;
  }

  export interface TransactionClient {
    user: UserDelegate;
    wallet: WalletDelegate;
    transaction: TransactionDelegate;
    game: GameDelegate;
    promotion: PromotionDelegate;
    promotionClaim: PromotionClaimDelegate;
    amoeEntry: AmoeEntryDelegate;
  }

  export class PrismaClient {
    user: UserDelegate;
    wallet: WalletDelegate;
    transaction: TransactionDelegate;
    game: GameDelegate;
    promotion: PromotionDelegate;
    promotionClaim: PromotionClaimDelegate;
    amoeEntry: AmoeEntryDelegate;
    $transaction<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T>;
    constructor(options?: any);
  }
}
