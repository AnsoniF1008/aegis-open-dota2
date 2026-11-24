import React, { useState } from 'react';
import { CheckCircle2, Loader2, Search, Swords, X } from 'lucide-react';
import { api } from '../lib/api';
import type { BracketMatch, FullRegistration, TournamentConfig } from '../types';
import { TicketPassCard } from './TicketPassCard';

interface TicketLookupModalProps {
  isOpen: boolean;
  config: TournamentConfig;
  onClose: () => void;
  onCheckInSuccess: () => void;
}

export const TicketLookupModal: React.FC<TicketLookupModalProps> = ({
  isOpen,
  config,
  onClose,
  onCheckInSuccess,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    ticket: FullRegistration;
    nextMatch: BracketMatch | null;
  } | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.lookupTicket(query.trim());
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Ticket no encontrado.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!result) return;
    setCheckingIn(true);
    setError('');
    try {
      await api.checkInTicket(result.ticket.ticketCode);
      setResult({
        ...result,
        ticket: { ...result.ticket, checkedIn: true },
      });
      onCheckInSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el check-in.');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lookup-title"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#12161D] shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-[#161B24] rounded-t-2xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D9A441]">
              Verificación & Check-In
            </p>
            <h2 id="lookup-title" className="font-display text-lg font-bold text-[#F3EFE6]">
              Consulta tu Ticket de {config.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar buscador de tickets"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#9BA3B0] hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-[#9BA3B0] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Código (ej. AEG-T-1042), Discord o correo"
                className="w-full rounded-lg border border-white/15 bg-[#0B0D10] pl-10 pr-3 py-2.5 text-sm text-[#F3EFE6] focus:border-[#D9A441] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E23D28] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#F04A35] transition cursor-pointer"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Buscar Ticket
            </button>
          </form>

          {error && (
            <div className="rounded-lg border border-[#E23D28]/40 bg-[#E23D28]/15 px-3.5 py-2.5 text-xs text-red-200">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <TicketPassCard
                ticket={result.ticket}
                tournamentName={config.name}
                edition={config.edition}
              />

              {result.nextMatch && (
                <div className="rounded-xl border border-[#D9A441]/30 bg-[#0B0D10] p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Swords className="h-5 w-5 text-[#D9A441]" />
                    <div>
                      <div className="text-xs text-[#9BA3B0]">{result.nextMatch.roundName}</div>
                      <div className="text-sm font-semibold text-[#F3EFE6]">
                        Lobby: <span className="font-mono text-[#D9A441]">{result.nextMatch.lobbyName}</span> · {result.nextMatch.scheduledTime}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0B0D10] p-4">
                <div>
                  <div className="text-sm font-semibold text-[#F3EFE6]">Check-in de Torneo</div>
                  <div className="text-xs text-[#9BA3B0]">
                    Confirma asistencia antes del inicio de las partidas para asegurar tu lugar en el bracket.
                  </div>
                </div>
                {result.ticket.checkedIn ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#2EA067]/15 border border-[#2EA067]/30 px-4 py-2 text-xs font-semibold text-[#4ADE80]">
                    <CheckCircle2 className="h-4 w-4" />
                    Check-in Confirmado
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={checkingIn || result.ticket.status !== 'confirmed'}
                    onClick={handleCheckIn}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2EA067] px-4 py-2 text-xs font-semibold text-white hover:bg-[#35B575] disabled:opacity-50 cursor-pointer"
                  >
                    {checkingIn && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirmar Check-In
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
