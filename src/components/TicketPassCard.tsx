import React, { useState } from 'react';
import { Check, CheckCircle2, Clock, Copy, ShieldCheck, Users } from 'lucide-react';
import type { FullRegistration } from '../types';
import { DeterministicTicketQr } from './AegisLogo';

interface TicketPassCardProps {
  ticket: FullRegistration;
  tournamentName: string;
  edition: string;
}

export const TicketPassCard: React.FC<TicketPassCardProps> = ({
  ticket,
  tournamentName,
  edition,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(ticket.ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConfirmed = ticket.status === 'confirmed';
  const typeLabel =
    ticket.type === 'team'
      ? 'Ticket de Equipo 5v5'
      : ticket.type === 'free_agent'
        ? 'Ticket Free Agent'
        : 'Pase Supporter VIP';

  return (
    <div className="rounded-xl border border-white/15 bg-[#12161D] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#181E27] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-[#D9A441]" />
          <span className="font-display text-sm font-bold tracking-wide uppercase text-[#F3EFE6]">
            {tournamentName} · {edition}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            isConfirmed
              ? 'bg-[#2EA067]/15 text-[#4ADE80] border border-[#2EA067]/30'
              : 'bg-[#D9A441]/15 text-[#F5C563] border border-[#D9A441]/30'
          }`}
        >
          {isConfirmed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
          {isConfirmed ? 'Pago Confirmado' : 'Pendiente de Verificación'}
        </span>
      </div>

      <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-[#9BA3B0]">
            {typeLabel}
          </div>

          <h3 className="font-display text-2xl font-bold text-[#F3EFE6] truncate">
            {ticket.type === 'team'
              ? `${ticket.teamName} [${ticket.teamTag}]`
              : ticket.nickname}
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base font-bold text-[#D9A441] bg-[#0B0D10] border border-[#D9A441]/30 rounded-lg px-3 py-1.5">
              {ticket.ticketCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#F3EFE6] hover:bg-white/10 transition cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#4ADE80]" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copiado' : 'Copiar código'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs text-[#9BA3B0]">
            <div>
              <span className="block text-[11px] uppercase tracking-wide text-[#6E7785]">Monto</span>
              <span className="font-mono font-semibold text-[#F3EFE6] tabular-nums">
                ${ticket.amountPaid} USD
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-wide text-[#6E7785]">Método</span>
              <span className="font-medium text-[#F3EFE6] uppercase">
                {ticket.paymentMethod.replace('_', ' ')}
              </span>
            </div>
            {ticket.region && (
              <div>
                <span className="block text-[11px] uppercase tracking-wide text-[#6E7785]">Servidor</span>
                <span className="font-medium text-[#F3EFE6]">{ticket.region}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 self-center sm:self-auto shrink-0">
          <DeterministicTicketQr code={ticket.ticketCode} size={92} />
          <span className="font-mono text-[10px] text-[#9BA3B0]">ID DE PASE</span>
        </div>
      </div>

      {ticket.type === 'team' && ticket.roster && ticket.roster.length > 0 && (
        <div className="border-t border-white/10 bg-[#0B0D10]/60 px-5 py-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9BA3B0] mb-2">
            <Users className="h-3.5 w-3.5 text-[#E23D28]" />
            Roster registrado ({ticket.roster.length} titulares)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {ticket.roster.map((player, idx) => (
              <div
                key={`${player.nickname}-${idx}`}
                className="rounded-md border border-white/10 bg-[#12161D] px-2.5 py-1.5 text-xs"
              >
                <div className="font-semibold text-[#F3EFE6] truncate">{player.nickname}</div>
                <div className="text-[11px] text-[#9BA3B0] leading-tight">{player.role}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
