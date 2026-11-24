import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  Menu,
  ShieldCheck,
  Sparkles,
  Swords,
  Ticket,
  Trophy,
  User,
  Users,
  X,
} from 'lucide-react';
import { AegisLogo } from './components/AegisLogo';
import { AdminDashboard } from './components/AdminDashboard';
import { BracketSection } from './components/BracketSection';
import { CheckoutModal } from './components/CheckoutModal';
import { TicketLookupModal } from './components/TicketLookupModal';
import { api } from './lib/api';
import type { TicketType, TournamentPayload } from './types';

function formatTournamentDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return 'Próximo Sábado · 17:00';
  }
}

export function App() {
  const [data, setData] = useState<TournamentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutType, setCheckoutType] = useState<TicketType>('team');
  const [lookupOpen, setLookupOpen] = useState(false);

  const fetchTournament = useCallback(async () => {
    try {
      const payload = await api.getTournament();
      setData(payload);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con el servidor del torneo.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  const openCheckout = (type: TicketType) => {
    setCheckoutType(type);
    setCheckoutOpen(true);
    setMobileMenuOpen(false);
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <AegisLogo size={42} />
          <p className="text-sm text-[#9BA3B0]">Cargando Aegis Open...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-[#E23D28]/30 bg-[#12161D] p-6 text-center space-y-4">
          <h1 className="font-display text-xl font-bold text-[#F3EFE6]">
            Servidor API no disponible
          </h1>
          <p className="text-sm text-[#9BA3B0]">{error}</p>
          <button
            type="button"
            onClick={fetchTournament}
            className="rounded-lg bg-[#E23D28] px-4 py-2 text-sm font-semibold text-white cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (viewMode === 'admin') {
    return (
      <AdminDashboard
        onBackToSite={() => setViewMode('public')}
        onDataChanged={fetchTournament}
      />
    );
  }

  const { config, stats, teams, freeAgents, bracket, pastEditions } = data;
  const fillPercentage = Math.min(
    100,
    Math.round((stats.usedSlots / Math.max(1, config.maxTeams)) * 100)
  );
  const perPlayerPrice = (config.teamTicketPrice / 5).toFixed(2).replace(/\.00$/, '');

  return (
    <div id="top" className="min-h-screen bg-[#0B0D10] text-[#F3EFE6]">
      {/* Fixed Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0D10]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-2.5 shrink-0">
            <AegisLogo size={32} />
            <div className="leading-none">
              <span className="font-display text-lg font-bold tracking-tight text-[#F3EFE6]">
                {config.name}
              </span>
              <span className="ml-2 hidden sm:inline-block rounded border border-[#D9A441]/35 bg-[#D9A441]/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-[#F5C563]">
                {config.edition}
              </span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#9BA3B0]">
            <a href="#tickets" className="hover:text-white transition">
              Tickets
            </a>
            <a href="#premios" className="hover:text-white transition">
              Premios
            </a>
            <a href="#equipos" className="hover:text-white transition">
              Equipos
            </a>
            <a href="#bracket" className="hover:text-white transition">
              Bracket
            </a>
            <a href="#reglas" className="hover:text-white transition">
              Reglas
            </a>
            <button
              type="button"
              onClick={() => setLookupOpen(true)}
              className="hover:text-white transition cursor-pointer"
            >
              Mi Ticket
            </button>
            <button
              type="button"
              onClick={() => setViewMode('admin')}
              className="text-[#D9A441] hover:text-[#F5C563] transition cursor-pointer"
            >
              Organizador
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setLookupOpen(true)}
              className="hidden sm:inline-flex lg:hidden items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-[#F3EFE6] hover:bg-white/5 cursor-pointer"
            >
              Mi Ticket
            </button>
            <button
              type="button"
              disabled={!config.registrationOpen || stats.remainingSlots <= 0}
              onClick={() => openCheckout('team')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#E23D28] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#F04A35] disabled:opacity-50 transition cursor-pointer"
            >
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">Comprar Ticket</span>
              <span className="sm:hidden">Inscribirse</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Abrir menú de navegación"
              className="lg:hidden flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-[#12161D] text-[#F3EFE6] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#12161D] px-4 py-4 space-y-2">
            {[
              { href: '#tickets', label: 'Tickets y Precios' },
              { href: '#premios', label: 'Prize Pool y Formato' },
              { href: '#equipos', label: 'Equipos y Free Agents' },
              { href: '#bracket', label: 'Bracket en Vivo' },
              { href: '#reglas', label: 'Reglamento y FAQ' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#F3EFE6] hover:bg-white/5"
              >
                {item.label}
              </a>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLookupOpen(true);
                }}
                className="rounded-lg border border-white/15 bg-[#0B0D10] py-2.5 text-xs font-semibold text-[#F3EFE6]"
              >
                Consultar Mi Ticket
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setViewMode('admin');
                }}
                className="rounded-lg border border-[#D9A441]/30 bg-[#D9A441]/10 py-2.5 text-xs font-semibold text-[#F5C563]"
              >
                Panel Organizador
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0">
            <img
              src="/images/hero-arena.jpg"
              alt="Arena oficial de Aegis Open Dota 2"
              className="h-full w-full object-cover object-center opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D10] via-[#0B0D10]/85 to-[#0B0D10]/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-transparent to-transparent" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
            <div className="max-w-2xl space-y-6">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[#D9A441]/35 bg-[#12161D]/90 px-3.5 py-1.5 text-xs font-medium text-[#F5C563]">
                <span className="h-2 w-2 rounded-full bg-[#2EA067]" />
                <span>{config.edition}</span>
                <span className="text-white/25">·</span>
                <span>{config.divisionLabel}</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F3EFE6] leading-[1.05]">
                Compite en {config.name}.{' '}
                <span className="text-[#D9A441]">Gana el Escudo.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#C7CCD6] leading-relaxed max-w-xl">
                {config.tagline}. Compra tu ticket de equipo 5v5 por{' '}
                <strong className="text-white font-mono">${config.teamTicketPrice} USD</strong> (${perPlayerPrice} por jugador) o únete como Free Agent y compite por un Prize Pool garantizado de{' '}
                <strong className="text-[#D9A441] font-mono">${config.prizePoolGuaranteed} USD</strong>.
              </p>

              {/* Key Tournament Facts Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="rounded-xl border border-white/10 bg-[#12161D]/90 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#9BA3B0]">
                    <Trophy className="h-3.5 w-3.5 text-[#D9A441]" />
                    Prize Pool
                  </div>
                  <div className="font-mono text-lg font-bold text-[#D9A441] tabular-nums mt-0.5">
                    ${config.prizePoolGuaranteed} USD
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#12161D]/90 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#9BA3B0]">
                    <Users className="h-3.5 w-3.5 text-[#E23D28]" />
                    Cupos
                  </div>
                  <div className="font-mono text-lg font-bold text-[#F3EFE6] tabular-nums mt-0.5">
                    {stats.usedSlots} / {config.maxTeams}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#12161D]/90 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#9BA3B0]">
                    <Globe className="h-3.5 w-3.5 text-[#9BA3B0]" />
                    Servidor
                  </div>
                  <div className="text-xs font-semibold text-[#F3EFE6] mt-1 leading-tight">
                    {config.region}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#12161D]/90 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#9BA3B0]">
                    <Calendar className="h-3.5 w-3.5 text-[#9BA3B0]" />
                    Inicio
                  </div>
                  <div className="text-xs font-semibold text-[#F3EFE6] mt-1 capitalize leading-tight">
                    {formatTournamentDate(config.dateISO)}
                  </div>
                </div>
              </div>

              {/* Live Capacity Progress */}
              <div className="max-w-md space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#9BA3B0]">Disponibilidad de tickets</span>
                  <span className="font-mono text-[#F5C563] tabular-nums">
                    {stats.remainingSlots} cupos restantes ({fillPercentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#E23D28] to-[#D9A441] transition-all duration-500"
                    style={{ width: `${fillPercentage}%` }}
                  />
                </div>
              </div>

              {/* Hero CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  disabled={!config.registrationOpen || stats.remainingSlots <= 0}
                  onClick={() => openCheckout('team')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E23D28] px-6 py-3.5 text-base font-semibold text-white hover:bg-[#F04A35] disabled:opacity-50 transition cursor-pointer shadow-lg shadow-[#E23D28]/20"
                >
                  Inscribir Equipo (${config.teamTicketPrice})
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={!config.registrationOpen}
                  onClick={() => openCheckout('free_agent')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-[#12161D]/90 px-6 py-3.5 text-base font-semibold text-[#F3EFE6] hover:bg-[#1A202B] transition cursor-pointer"
                >
                  Jugar Solo · Free Agent (${config.freeAgentTicketPrice})
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* TICKET TIERS / MONETIZATION */}
        <section id="tickets" className="py-16 sm:py-20 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#D9A441]">
                  Entradas y Registro
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F3EFE6]">
                  Elige tu Ticket para {config.name}
                </h2>
                <p className="text-sm sm:text-base text-[#9BA3B0]">
                  Aceptamos tarjeta (confirmación inmediata), Yape, Plin, transferencia bancaria, PayPal y USDT. Usa el código{' '}
                  <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-[#D9A441]">
                    AEGIS10
                  </code>{' '}
                  para 10% de descuento de lanzamiento.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Team Ticket */}
              <div className="relative rounded-2xl border-2 border-[#E23D28] bg-[#12161D] p-6 sm:p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E23D28]/15 px-3 py-1 text-xs font-semibold text-[#FF7B6B]">
                      <Users className="h-3.5 w-3.5" />
                      Ticket Principal
                    </span>
                    <span className="font-mono text-xs text-[#9BA3B0] tabular-nums">
                      {stats.remainingSlots} libres
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-[#F3EFE6]">
                      Equipo Completo 5v5
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-mono text-4xl font-bold text-[#F3EFE6] tabular-nums">
                        ${config.teamTicketPrice}
                      </span>
                      <span className="text-xs text-[#9BA3B0]">
                        {config.currency} / equipo (${perPlayerPrice} c/u)
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-sm text-[#C7CCD6]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#2EA067] shrink-0 mt-0.5" />
                      Cupo oficial para 5 titulares + 1 suplente
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#2EA067] shrink-0 mt-0.5" />
                      Ticket digital con código único y Check-in web
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#2EA067] shrink-0 mt-0.5" />
                      Acceso directo al bracket y premio en efectivo
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={!config.registrationOpen || stats.remainingSlots <= 0}
                  onClick={() => openCheckout('team')}
                  className="w-full rounded-xl bg-[#E23D28] py-3 text-sm font-semibold text-white hover:bg-[#F04A35] disabled:opacity-50 transition cursor-pointer"
                >
                  {stats.remainingSlots > 0 ? 'Comprar Ticket de Equipo' : 'Cupos Agotados'}
                </button>
              </div>

              {/* Free Agent Ticket */}
              <div className="rounded-2xl border border-white/15 bg-[#12161D] p-6 sm:p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#F3EFE6]">
                      <User className="h-3.5 w-3.5 text-[#D9A441]" />
                      Individual
                    </span>
                    <span className="font-mono text-xs text-[#9BA3B0] tabular-nums">
                      {stats.freeAgentsCount} inscritos
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-[#F3EFE6]">
                      Free Agent (Solo)
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-mono text-4xl font-bold text-[#F3EFE6] tabular-nums">
                        ${config.freeAgentTicketPrice}
                      </span>
                      <span className="text-xs text-[#9BA3B0]">
                        {config.currency} / jugador
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-sm text-[#C7CCD6]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#2EA067] shrink-0 mt-0.5" />
                      ¿Sin equipo? Te agrupamos con 4 jugadores por MMR y rol
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#2EA067] shrink-0 mt-0.5" />
                      Eliges posición principal y secundaria (Pos 1–5)
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#2EA067] shrink-0 mt-0.5" />
                      Compites por el mismo Prize Pool oficial
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={!config.registrationOpen}
                  onClick={() => openCheckout('free_agent')}
                  className="w-full rounded-xl border border-white/20 bg-[#181E27] py-3 text-sm font-semibold text-[#F3EFE6] hover:bg-white/10 transition cursor-pointer"
                >
                  Registrarme como Free Agent
                </button>
              </div>

              {/* Supporter Pass */}
              <div className="rounded-2xl border border-[#D9A441]/30 bg-[#12161D] p-6 sm:p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D9A441]/15 px-3 py-1 text-xs font-semibold text-[#F5C563]">
                      <Sparkles className="h-3.5 w-3.5" />
                      Comunidad
                    </span>
                    <span className="font-mono text-xs text-[#9BA3B0] tabular-nums">
                      {stats.supportersCount} pases
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-[#F3EFE6]">
                      Pase Supporter VIP
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-mono text-4xl font-bold text-[#D9A441] tabular-nums">
                        ${config.supporterTicketPrice}
                      </span>
                      <span className="text-xs text-[#9BA3B0]">
                        {config.currency} / pase
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-sm text-[#C7CCD6]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#D9A441] shrink-0 mt-0.5" />
                      Rol exclusivo Supporter en el Discord oficial
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#D9A441] shrink-0 mt-0.5" />
                      Participación en sorteos de sets y Arcanas en vivo
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#D9A441] shrink-0 mt-0.5" />
                      Transmisión siempre gratuita cumpliendo reglas de Valve
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => openCheckout('supporter')}
                  className="w-full rounded-xl border border-[#D9A441]/45 bg-[#D9A441]/15 py-3 text-sm font-semibold text-[#F5C563] hover:bg-[#D9A441]/25 transition cursor-pointer"
                >
                  Obtener Pase Supporter
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* PRIZE POOL & TROPHY SHOWCASE */}
        <section id="premios" className="py-16 sm:py-20 bg-[#101319] border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#D9A441]">
                  Premios y Formato
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F3EFE6]">
                  ${config.prizePoolGuaranteed} USD Garantizados en Premios
                </h2>
                <p className="text-sm sm:text-base text-[#9BA3B0]">
                  Pagos directos a los capitanes ganadores al finalizar la Gran Final por transferencia, Yape/Plin, PayPal o USDT. Sin burocracia.
                </p>
              </div>

              <div className="space-y-3">
                {config.prizeSplit.map((item, idx) => {
                  const amount = Math.round(config.prizePoolGuaranteed * item.share);
                  return (
                    <div
                      key={item.place}
                      className={`flex items-center justify-between rounded-xl border p-4 ${
                        idx === 0
                          ? 'border-[#D9A441]/40 bg-[#161B24]'
                          : 'border-white/10 bg-[#12161D]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Trophy
                          className={`h-5 w-5 ${idx === 0 ? 'text-[#D9A441]' : 'text-[#9BA3B0]'}`}
                        />
                        <div>
                          <div className="font-display font-bold text-[#F3EFE6]">{item.place}</div>
                          <div className="text-xs text-[#9BA3B0]">{item.label}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-2xl font-bold text-[#D9A441] tabular-nums">
                          ${amount} USD
                        </div>
                        <div className="text-[11px] font-mono text-[#9BA3B0]">
                          {Math.round(item.share * 100)}% del pozo
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-white/10 bg-[#12161D] p-3.5">
                  <div className="font-semibold text-[#F3EFE6] mb-1">Modo de Juego</div>
                  <div className="text-[#9BA3B0]">5v5 Captains Mode · {config.format}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#12161D] p-3.5">
                  <div className="font-semibold text-[#F3EFE6] mb-1">Escalamiento por Ligas</div>
                  <div className="text-[#9BA3B0]">
                    Ediciones futuras por medalla para mayor balance competitivo.
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0B0D10]">
                <img
                  src="/images/aegis-trophy.jpg"
                  alt="Trofeo escudo de campeones Aegis Open"
                  className="w-full aspect-video object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* REGISTERED TEAMS & FREE AGENTS */}
        <section id="equipos" className="py-16 sm:py-20 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#D9A441]">
                  Participantes en Vivo
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F3EFE6]">
                  Equipos Inscritos ({stats.usedSlots} / {config.maxTeams})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => openCheckout('team')}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#12161D] px-4 py-2 text-xs font-semibold text-[#F3EFE6] hover:bg-white/10 cursor-pointer"
              >
                <Swords className="h-4 w-4 text-[#E23D28]" />
                Sumar tu equipo
              </button>
            </div>

            {teams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-[#12161D] p-8 text-center space-y-3">
                <p className="text-sm text-[#9BA3B0]">
                  Aún no hay equipos inscritos en esta edición. ¡Sé el primero en asegurar tu cupo!
                </p>
                <button
                  type="button"
                  onClick={() => openCheckout('team')}
                  className="rounded-lg bg-[#E23D28] px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
                >
                  Inscribir Primer Equipo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {teams.map((team) => {
                  const isConfirmed = team.status === 'confirmed';
                  return (
                    <div
                      key={team.id}
                      className="rounded-xl border border-white/10 bg-[#12161D] p-4 space-y-3 hover:border-white/25 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-[#0B0D10] border border-white/15 px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#D9A441]">
                              {team.teamTag}
                            </span>
                            <h3 className="font-display font-bold text-base text-[#F3EFE6] truncate">
                              {team.teamName}
                            </h3>
                          </div>
                          <div className="mt-1 text-xs text-[#9BA3B0]">
                            {team.region} · <span className="font-mono">{team.avgMmr} MMR</span>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isConfirmed
                              ? 'bg-[#2EA067]/15 text-[#4ADE80]'
                              : 'bg-[#D9A441]/15 text-[#F5C563]'
                          }`}
                        >
                          {isConfirmed ? 'Confirmado' : 'En revisión'}
                        </span>
                      </div>

                      <div className="border-t border-white/10 pt-2.5 space-y-1">
                        {team.roster.slice(0, 5).map((p, i) => (
                          <div key={`${p.nickname}-${i}`} className="flex justify-between text-xs">
                            <span className="text-[#F3EFE6] truncate">{p.nickname}</span>
                            <span className="text-[#6E7785] text-[11px] shrink-0 ml-2">
                              {p.role.split('·')[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Free Agents Pool */}
            {freeAgents.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#12161D] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#F3EFE6]">
                      Pool de Free Agents ({freeAgents.length} jugadores buscando mix)
                    </h3>
                    <p className="text-xs text-[#9BA3B0]">
                      Cada 5 Free Agents confirmados formamos un equipo oficial balanceado por MMR.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCheckout('free_agent')}
                    className="text-xs font-semibold text-[#D9A441] hover:underline cursor-pointer"
                  >
                    + Unirme al pool (${config.freeAgentTicketPrice})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {freeAgents.map((fa) => (
                    <div
                      key={fa.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0B0D10] px-3.5 py-2.5 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#F3EFE6]">{fa.nickname}</div>
                        <div className="text-[11px] text-[#9BA3B0]">
                          {fa.primaryRole} · {fa.region}
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-[#D9A441] tabular-nums">
                        {fa.mmr} MMR
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* BRACKET SECTION */}
        <section id="bracket" className="py-16 sm:py-20 bg-[#101319] border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#D9A441]">
                Camino al Campeonato
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F3EFE6]">
                Bracket y Cruces
              </h2>
            </div>

            <BracketSection bracket={bracket} teams={teams} maxTeams={config.maxTeams} />

            {pastEditions.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-[#12161D] p-5 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#D9A441]">
                  Historial de Ediciones Anteriores
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {pastEditions.map((ed) => (
                    <div
                      key={ed.edition}
                      className="rounded-lg border border-white/10 bg-[#0B0D10] p-3 text-xs space-y-1"
                    >
                      <div className="font-display font-bold text-[#F3EFE6]">{ed.edition}</div>
                      <div className="text-[#9BA3B0]">
                        Campeón: <strong className="text-[#D9A441]">{ed.champion}</strong>
                      </div>
                      <div className="text-[#9BA3B0] font-mono">
                        {ed.teamsCount} equipos · Prize ${ed.prizePoolUSD}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RULES & VALVE COMPLIANCE */}
        <section id="reglas" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#D9A441]">
                Reglamento Oficial
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F3EFE6]">
                Reglas Claras y Fair Play
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-xl border border-white/10 bg-[#12161D] p-5 space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-[#F3EFE6]">
                  <Clock className="h-4 w-4 text-[#E23D28]" />
                  Check-in y Tolerancia
                </div>
                <p className="text-sm text-[#9BA3B0] leading-relaxed">
                  Todos los capitanes confirman asistencia en <strong>Mi Ticket</strong> 30 minutos antes del inicio. Todas las series se juegan exclusivamente en el servidor <strong>{config.region}</strong> por máxima estabilidad.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#12161D] p-5 space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-[#F3EFE6]">
                  <ShieldCheck className="h-4 w-4 text-[#D9A441]" />
                  Anti-Smurf y Roster Lock
                </div>
                <p className="text-sm text-[#9BA3B0] leading-relaxed">
                  Solo juegan las cuentas registradas con su Friend ID en el ticket (o el suplente declarado). Cuentas nuevas sospechosas o suplantación implican descalificación sin reembolso.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#12161D] p-5 space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-[#F3EFE6]">
                  <Swords className="h-4 w-4 text-[#2EA067]" />
                  Transmisión Libre (Licencia Valve)
                </div>
                <p className="text-sm text-[#9BA3B0] leading-relaxed">
                  El torneo opera bajo las directrices de la Limited Game Tournament License de Valve: el stream oficial es 100% gratuito para todos los espectadores.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#080A0C] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AegisLogo size={24} />
              <span className="font-display text-base font-bold text-[#F3EFE6]">
                {config.name}
              </span>
            </div>
            <p className="text-xs text-[#9BA3B0] max-w-md">
              Plataforma independiente de torneos comunitarios de Dota 2. No afiliada ni respaldada oficialmente por Valve Corporation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#9BA3B0]">
            <button
              type="button"
              onClick={() => setLookupOpen(true)}
              className="hover:text-white cursor-pointer"
            >
              Consultar Ticket / Check-in
            </button>
            <button
              type="button"
              onClick={() => setViewMode('admin')}
              className="text-[#D9A441] hover:underline cursor-pointer"
            >
              Acceso Organizador
            </button>
          </div>
        </div>
      </footer>

      <CheckoutModal
        isOpen={checkoutOpen}
        initialType={checkoutType}
        config={config}
        remainingSlots={stats.remainingSlots}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={(updated) => {
          if (updated) setData(updated);
          else fetchTournament();
        }}
      />

      <TicketLookupModal
        isOpen={lookupOpen}
        config={config}
        onClose={() => setLookupOpen(false)}
        onCheckInSuccess={fetchTournament}
      />
    </div>
  );
}

export default App;
