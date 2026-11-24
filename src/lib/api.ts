import type {
  AdminOverviewPayload,
  BracketMatch,
  FullRegistration,
  TournamentConfig,
  TournamentPayload,
} from '../types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  getTournament: () => request<TournamentPayload>('/api/tournament'),

  validatePromo: (code: string, type: string) =>
    request<{
      valid: boolean;
      code: string;
      discountPercent: number;
      baseAmount: number;
      discountAmount: number;
      finalAmount: number;
    }>('/api/promo/validate', {
      method: 'POST',
      body: JSON.stringify({ code, type }),
    }),

  createRegistration: (payload: Record<string, unknown>) =>
    request<{
      ticket?: FullRegistration;
      tournament?: TournamentPayload;
      stripeCheckoutUrl?: string;
    }>('/api/registrations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  lookupTicket: (query: string) =>
    request<{ ticket: FullRegistration; nextMatch: BracketMatch | null }>(
      `/api/tickets/lookup?query=${encodeURIComponent(query)}`
    ),

  checkInTicket: (ticketCode: string) =>
    request<{ ok: boolean; checkedIn: boolean; ticketCode: string }>(
      `/api/tickets/${encodeURIComponent(ticketCode)}/checkin`,
      { method: 'POST' }
    ),

  // Admin endpoints
  adminLogin: (pin: string) =>
    request<{ ok: boolean }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),

  getAdminOverview: (pin: string) =>
    request<AdminOverviewPayload>('/api/admin/overview', {
      headers: { 'x-admin-pin': pin },
    }),

  updateRegistrationStatus: (
    pin: string,
    id: string,
    status: 'confirmed' | 'pending_verification' | 'rejected'
  ) =>
    request<{ ok: boolean }>(`/api/admin/registrations/${id}/status`, {
      method: 'PATCH',
      headers: { 'x-admin-pin': pin },
      body: JSON.stringify({ status }),
    }),

  deleteRegistration: (pin: string, id: string) =>
    request<{ ok: boolean }>(`/api/admin/registrations/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': pin },
    }),

  mergeFreeAgents: (
    pin: string,
    payload: { agentIds: string[]; teamName: string; teamTag: string; region: string }
  ) =>
    request<{ ok: boolean; team: FullRegistration }>('/api/admin/free-agents/merge', {
      method: 'POST',
      headers: { 'x-admin-pin': pin },
      body: JSON.stringify(payload),
    }),

  updateConfig: (pin: string, config: Partial<TournamentConfig>) =>
    request<{ ok: boolean; config: TournamentConfig }>('/api/admin/config', {
      method: 'PUT',
      headers: { 'x-admin-pin': pin },
      body: JSON.stringify(config),
    }),

  generateBracket: (pin: string) =>
    request<{ ok: boolean; bracket: BracketMatch[] }>('/api/admin/bracket/generate', {
      method: 'POST',
      headers: { 'x-admin-pin': pin },
    }),

  updateBracketMatch: (
    pin: string,
    matchId: string,
    payload: {
      winnerId?: string | null;
      scoreA?: number;
      scoreB?: number;
      scheduledTime?: string;
      lobbyName?: string;
    }
  ) =>
    request<{ ok: boolean; bracket: BracketMatch[] }>(
      `/api/admin/bracket/match/${matchId}`,
      {
        method: 'PATCH',
        headers: { 'x-admin-pin': pin },
        body: JSON.stringify(payload),
      }
    ),

  clearDemoData: (pin: string) =>
    request<{ ok: boolean }>('/api/admin/demo/clear', {
      method: 'POST',
      headers: { 'x-admin-pin': pin },
    }),

  seedDemoData: (pin: string) =>
    request<{ ok: boolean }>('/api/admin/demo/seed', {
      method: 'POST',
      headers: { 'x-admin-pin': pin },
    }),

  startNewEdition: (
    pin: string,
    payload: {
      newEditionLabel: string;
      newMaxTeams: number;
      newTicketPrice: number;
      newPrizePool: number;
      newDivisionLabel: string;
    }
  ) =>
    request<{ ok: boolean; config: TournamentConfig }>('/api/admin/edition/new', {
      method: 'POST',
      headers: { 'x-admin-pin': pin },
      body: JSON.stringify(payload),
    }),
};
