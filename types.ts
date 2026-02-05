
export enum DifferenceType {
  SYSTEM_ONLY = 'SYSTEM_ONLY',
  WALLET_ONLY = 'WALLET_ONLY',
  FREQUENCY_MISMATCH = 'FREQUENCY_MISMATCH',
  MATCHED = 'MATCHED'
}

export interface MatchingResult {
  value: number;
  status: DifferenceType;
  description: string;
  systemCount: number;
  walletCount: number;
}

export interface ComparisonSummary {
  totalSystem: number;
  totalWallet: number;
  matchedCount: number;
  differencesCount: number;
}
