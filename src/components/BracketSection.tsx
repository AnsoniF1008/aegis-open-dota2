import React from 'react';
import { Swords, Trophy } from 'lucide-react';
import type { BracketMatch, PublicTeam } from '../types';

interface BracketSectionProps {
  bracket: BracketMatch[];
  teams: PublicTeam[];
  maxTeams: number;
}

export const BracketSection: React.FC<BracketSectionProps> = ({
  bracket,
  teams,
  maxTeams,
}) => {
  const confirmedTeams = teams.filter((t) => t.status === 'confirmed');
  const rounds = Array.from(new Set(bracket.map((m) => m.round))).sort((a, b) => a - b);

  if (bracket.length === 0) {
    const previewSlots = Math.min(8, maxTeams);
    return (
      <div className="rounded-2xl border border-white/10 bg-[#12161D] p-5 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Swords className="h-5 w-5 text-[#E23D28]" />
            <div>
              <h3 className="font-display text-lg font-bold text-[#F3EFE6]">
                Llave Proyectada (Esperando cierre de cupos)
              </h3>
              <p className="text-xs text-[#9BA3B0]">
                El organizador sorteará el bracket oficial al completar los cupos confirmados.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-[#D9A441]/30 bg-[#D9A441]/10 px-3 py-1 font-mono text-xs text-[#F5C563] tabular-nums">
            {confirmedTeams.length} / {maxTeams} listos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: previewSlots / 2 }).map((_, idx) => {
            const tA = confirmedTeams[idx * 2];
            const tB = confirmedTeams[idx * 2 + 1];
            return (
              <div
                key={idx}
                className="rounded-xl border border-white/10 bg-[#0B0D10] p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-[#9BA3B0]">
                  <span>SERIE #{idx + 1}</span>
                  <span>BO1</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between rounded-md bg-[#161B24] px-2.5 py-2 text-xs">
                    <span className={tA ? 'font-semibold text-[#F3EFE6]' : 'text-[#6E7785]'}>
                      {tA ? `${tA.teamName} [${tA.teamTag}]` : `Cupo #${idx * 2 + 1} disponible`}
                    </span>
                    <span className="font-mono text-[#9BA3B0]">-</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-[#161B24] px-2.5 py-2 text-xs">
                    <span className={tB ? 'font-semibold text-[#F3EFE6]' : 'text-[#6E7785]'}>
                      {tB ? `${tB.teamName} [${tB.teamTag}]` : `Cupo #${idx * 2 + 2} disponible`}
                    </span>
                    <span className="font-mono text-[#9BA3B0]">-</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#12161D] p-5 sm:p-7 overflow-x-auto">
      <div className="flex items-center gap-2.5 mb-6">
        <Trophy className="h-5 w-5 text-[#D9A441]" />
        <h3 className="font-display text-lg font-bold text-[#F3EFE6]">
          Bracket Oficial en Vivo
        </h3>
      </div>

      <div className="flex gap-6 min-w-[680px]">
        {rounds.map((roundNum) => {
          const roundMatches = bracket
            .filter((m) => m.round === roundNum)
            .sort((a, b) => a.matchIndex - b.matchIndex);
          const roundTitle = roundMatches[0]?.roundName || `Ronda ${roundNum}`;

          return (
            <div key={roundNum} className="flex-1 min-w-[220px] flex flex-col">
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-[#D9A441]">
                  {roundTitle}
                </span>
                <span className="font-mono text-[11px] text-[#9BA3B0]">
                  BO{roundMatches[0]?.bestOf || 1}
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-around gap-4">
                {roundMatches.map((match) => {
                  const aWon = match.winnerId && match.teamA?.id === match.winnerId;
                  const bWon = match.winnerId && match.teamB?.id === match.winnerId;
                  return (
                    <div
                      key={match.id}
                      className="rounded-xl border border-white/10 bg-[#0B0D10] p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#9BA3B0]">
                        <span>{match.lobbyName}</span>
                        <span>{match.scheduledTime}</span>
                      </div>

                      <div className="space-y-1">
                        <div
                          className={`flex items-center justify-between rounded-md px-2.5 py-2 text-xs border ${
                            aWon
                              ? 'border-[#2EA067]/40 bg-[#2EA067]/10 text-white font-semibold'
                              : 'border-transparent bg-[#161B24] text-[#F3EFE6]'
                          }`}
                        >
                          <span className="truncate">
                            {match.teamA ? `[${match.teamA.teamTag}] ${match.teamA.teamName}` : 'Por definir'}
                          </span>
                          <span className="font-mono font-bold tabular-nums ml-2">
                            {match.scoreA}
                          </span>
                        </div>

                        <div
                          className={`flex items-center justify-between rounded-md px-2.5 py-2 text-xs border ${
                            bWon
                              ? 'border-[#2EA067]/40 bg-[#2EA067]/10 text-white font-semibold'
                              : 'border-transparent bg-[#161B24] text-[#F3EFE6]'
                          }`}
                        >
                          <span className="truncate">
                            {match.teamB
                              ? `[${match.teamB.teamTag}] ${match.teamB.teamName}`
                              : match.isBye
                                ? 'BYE (Avanza directo)'
                                : 'Por definir'}
                          </span>
                          <span className="font-mono font-bold tabular-nums ml-2">
                            {match.scoreB}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
