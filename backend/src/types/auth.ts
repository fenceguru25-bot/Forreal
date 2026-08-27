export interface RequestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  state: string;
  accountTier: string;
  emailVerified: boolean;
  isSelfExcluded: boolean;
  selfExcludedUntil: Date | null;
  depositLimit: number | null;
}
