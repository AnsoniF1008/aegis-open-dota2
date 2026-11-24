export type TicketType = 'team' | 'free_agent' | 'supporter';
export type RegistrationStatus = 'confirmed' | 'pending_verification' | 'rejected';
export type PaymentMethod = 'card' | 'yape_plin' | 'bank_transfer' | 'paypal' | 'crypto_usdt';

export interface PrizeSplitItem {
  place: string;
  share: number;
  label: string;
}

export interface PaymentConfig {
  cardEnabled: boolean;
  transferEnabled: boolean;
  yapePlinNumber: string;
  yapePlinHolder: string;
  bankAccount: string;
  paypalEmail: string;
  cryptoAddress: string;
  stripeConfigured?: boolean;
}

export interface PromoCode {
  code: string;
  discountPercent: number;
  active: boolean;
}

export interface TournamentConfig {
  id: string;
  name: string;
  edition: string;
  tagline: string;
  divisionLabel: string;
  dateISO: string;
  region: string;
  format: string;
  maxTeams: number;
  teamTicketPrice: number;
  freeAgentTicketPrice: number;
  supporterTicketPrice: number;
  currency: string;
  prizePoolGuaranteed: number;
  prizeSplit: PrizeSplitItem[];
  registrationOpen: boolean;
  streamUrl: string;
  discordUrl: string;
  paymentConfig: PaymentConfig;
  promoCodes?: PromoCode[];
}

export interface RosterPlayer {
  nickname: string;
  role: string;
  steamId?: string;
}

export interface PublicTeam {
  id: string;
  type: 'team';
  ticketCode: string;
  status: RegistrationStatus;
  checkedIn: boolean;
  isDemo: boolean;
  createdAt: string;
  teamName: string;
  teamTag: string;
  region: string;
  avgMmr: number;
  roster: RosterPlayer[];
}

export interface PublicFreeAgent {
  id: string;
  type: 'free_agent';
  ticketCode: string;
  status: RegistrationStatus;
  checkedIn: boolean;
  isDemo: boolean;
  createdAt: string;
  nickname: string;
  mmr: number;
  primaryRole: string;
  secondaryRole: string;
  region: string;
}

export interface BracketTeamRef {
  id: string;
  teamName: string;
  teamTag: string;
}

export interface BracketMatch {
  id: string;
  round: number;
  roundName: string;
  matchIndex: number;
  bestOf: number;
  teamA: BracketTeamRef | null;
  teamB: BracketTeamRef | null;
  scoreA: number;
  scoreB: number;
  winnerId: string | null;
  isBye: boolean;
  scheduledTime: string;
  lobbyName: string;
}

export interface PastEdition {
  edition: string;
  teamsCount: number;
  grossUSD: number;
  prizePoolUSD: number;
  champion: string;
  archivedAt: string;
}

export interface TournamentPayload {
  config: TournamentConfig;
  stats: {
    confirmedTeamsCount: number;
    pendingTeamsCount: number;
    usedSlots: number;
    remainingSlots: number;
    freeAgentsCount: number;
    supportersCount: number;
  };
  teams: PublicTeam[];
  freeAgents: PublicFreeAgent[];
  bracket: BracketMatch[];
  pastEditions: PastEdition[];
}

export interface FullRegistration {
  id: string;
  type: TicketType;
  ticketCode: string;
  status: RegistrationStatus;
  checkedIn: boolean;
  isDemo: boolean;
  createdAt: string;
  paidAt: string;
  paymentMethod: PaymentMethod | 'free_agent_mix';
  operationRef: string;
  baseAmount: number;
  discountPercent: number;
  amountPaid: number;
  promoCode: string;
  receiptImageBase64?: string;
  teamName?: string;
  teamTag?: string;
  region?: string;
  avgMmr?: number;
  captainDiscord?: string;
  captainContact?: string;
  email?: string;
  roster?: RosterPlayer[];
  subPlayer?: { nickname: string; steamId: string } | null;
  nickname?: string;
  steamId?: string;
  mmr?: number;
  primaryRole?: string;
  secondaryRole?: string;
  discord?: string;
  contact?: string;
}

export interface AdminOverviewPayload {
  config: TournamentConfig;
  registrations: FullRegistration[];
  bracket: BracketMatch[];
  pastEditions: PastEdition[];
  finance: {
    grossConfirmedUSD: number;
    pendingUSD: number;
    prizePoolUSD: number;
    organizerNetUSD: number;
    confirmedCount: number;
    pendingCount: number;
  };
}
