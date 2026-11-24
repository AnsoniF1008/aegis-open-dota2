import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  Lock,
  Plus,
  RefreshCw,
  Settings2,
  Shuffle,
  Sparkles,
  Swords,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import type {
  AdminOverviewPayload,
  BracketMatch,
  FullRegistration,
  PromoCode,
  TournamentConfig,
} from '../types';

interface AdminDashboardProps {
  onBackToSite: () => void;
  onDataChanged: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToSite,
  onDataChanged,
}) => {
  const [pin, setPin] = useState(() => sessionStorage.getItem('aegis_admin_pin') || '');
  const [authenticated, setAuthenticated] = useState(false);
  const [loginPinInput, setLoginPinInput] = useState('aegis2026');
  const [loginError, setLoginError] = useState('');

  const [overview, setOverview] = useState<AdminOverviewPayload | null>(null);
  const [activeTab, setActiveTab] = useState<'registrations' | 'bracket' | 'scaling'>(
    'registrations'
  );
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'confirmed' | 'team' | 'free_agent' | 'supporter'
  >('all');
  const [loading, setLoading] = useState(false);
  const [bannerMsg, setBannerMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Free agent mix builder
  const [selectedFaIds, setSelectedFaIds] = useState<string[]>([]);
  const [mixTeamName, setMixTeamName] = useState('Aegis Mix #1');
  const [mixTeamTag, setMixTeamTag] = useState('MIX1');

  // Config editor state
  const [cfgDraft, setCfgDraft] = useState<TournamentConfig | null>(null);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoPercent, setNewPromoPercent] = useState('15');

  // Scaling simulator
  const [simTeams, setSimTeams] = useState(32);
  const [simPrice, setSimPrice] = useState(25);
  const [simFreeAgents, setSimFreeAgents] = useState(20);
  const [simPrize, setSimPrize] = useState(400);

  // New edition modal
  const [showNewEdition, setShowNewEdition] = useState(false);
  const [nextEdLabel, setNextEdLabel] = useState('Edición #2');
  const [nextEdDivision, setNextEdDivision] = useState('División Amateur · Herald – Legend');
  const [nextEdMaxTeams, setNextEdMaxTeams] = useState('32');
  const [nextEdPrice, setNextEdPrice] = useState('25');
  const [nextEdPrize, setNextEdPrize] = useState('400');

  const loadOverview = useCallback(
    async (activePin: string) => {
      setLoading(true);
      setErrorMsg('');
      try {
        const data = await api.getAdminOverview(activePin);
        setOverview(data);
        setCfgDraft(data.config);
        setAuthenticated(true);
      } catch (err) {
        setAuthenticated(false);
        sessionStorage.removeItem('aegis_admin_pin');
        setErrorMsg(err instanceof Error ? err.message : 'Error de autenticación.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (pin) {
      loadOverview(pin);
    }
  }, [pin, loadOverview]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await api.adminLogin(loginPinInput.trim());
      sessionStorage.setItem('aegis_admin_pin', loginPinInput.trim());
      setPin(loginPinInput.trim());
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'PIN inválido.');
    }
  };

  const notify = (msg: string) => {
    setBannerMsg(msg);
    setTimeout(() => setBannerMsg(''), 3500);
  };

  const handleStatusChange = async (
    id: string,
    status: 'confirmed' | 'pending_verification' | 'rejected'
  ) => {
    setErrorMsg('');
    try {
      await api.updateRegistrationStatus(pin, id, status);
      await loadOverview(pin);
      onDataChanged();
      notify('Estado del ticket actualizado.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo actualizar.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteRegistration(pin, id);
      await loadOverview(pin);
      onDataChanged();
      notify('Registro eliminado.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al eliminar.');
    }
  };

  const handleMergeFreeAgents = async () => {
    if (selectedFaIds.length !== 5) return;
    setErrorMsg('');
    try {
      await api.mergeFreeAgents(pin, {
        agentIds: selectedFaIds,
        teamName: mixTeamName,
        teamTag: mixTeamTag,
        region: overview?.config.region || 'Estados Unidos (US East)',
      });
      setSelectedFaIds([]);
      await loadOverview(pin);
      onDataChanged();
      notify('Equipo Mix creado y confirmado en el torneo.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo crear el equipo mix.');
    }
  };

  const handleGenerateBracket = async () => {
    setErrorMsg('');
    try {
      await api.generateBracket(pin);
      await loadOverview(pin);
      onDataChanged();
      notify('Bracket sorteado con los equipos confirmados.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error generando bracket.');
    }
  };

  const handleMatchUpdate = async (
    match: BracketMatch,
    patch: { winnerId?: string | null; scoreA?: number; scoreB?: number; scheduledTime?: string; lobbyName?: string }
  ) => {
    try {
      await api.updateBracketMatch(pin, match.id, patch);
      await loadOverview(pin);
      onDataChanged();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error actualizando serie.');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfgDraft) return;
    setErrorMsg('');
    try {
      await api.updateConfig(pin, cfgDraft);
      await loadOverview(pin);
      onDataChanged();
      notify('Configuración de torneo y pagos guardada.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error guardando configuración.');
    }
  };

  const handleAddPromo = () => {
    if (!cfgDraft || !newPromoCode.trim()) return;
    const clean = newPromoCode.trim().toUpperCase();
    const pct = Math.min(90, Math.max(1, Number(newPromoPercent) || 10));
    const list: PromoCode[] = [...(cfgDraft.promoCodes || [])];
    if (list.some((p) => p.code === clean)) return;
    list.push({ code: clean, discountPercent: pct, active: true });
    setCfgDraft({ ...cfgDraft, promoCodes: list });
    setNewPromoCode('');
  };

  const handleExportCsv = () => {
    if (!overview) return;
    const headers = [
      'Ticket',
      'Tipo',
      'Nombre',
      'Tag',
      'Estado',
      'Metodo',
      'Referencia',
      'MontoUSD',
      'Discord',
      'Email',
      'CheckIn',
    ];
    const rows = overview.registrations.map((r) => [
      r.ticketCode,
      r.type,
      `"${(r.teamName || r.nickname || '').replace(/"/g, '""')}"`,
      r.teamTag || '',
      r.status,
      r.paymentMethod,
      `"${r.operationRef}"`,
      r.amountPaid,
      `"${r.captainDiscord || r.discord || ''}"`,
      r.email || '',
      r.checkedIn ? 'SI' : 'NO',
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-open-tickets.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartNewEdition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.startNewEdition(pin, {
        newEditionLabel: nextEdLabel,
        newDivisionLabel: nextEdDivision,
        newMaxTeams: Number(nextEdMaxTeams) || 32,
        newTicketPrice: Number(nextEdPrice) || 25,
        newPrizePool: Number(nextEdPrize) || 400,
      });
      setShowNewEdition(false);
      await loadOverview(pin);
      onDataChanged();
      notify('Nueva edición lanzada. Edición anterior archivada.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error creando nueva edición.');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#12161D] p-6 sm:p-8 space-y-5 shadow-2xl">
          <button
            type="button"
            onClick={onBackToSite}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9BA3B0] hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al sitio del torneo
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E23D28]/15 border border-[#E23D28]/30">
              <Lock className="h-5 w-5 text-[#E23D28]" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-[#F3EFE6]">
                Panel de Organizador
              </h1>
              <p className="text-xs text-[#9BA3B0]">
                Control de ingresos, aprobación de pagos y escalamiento
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9BA3B0] mb-1.5">
                PIN de acceso
              </label>
              <input
                type="password"
                value={loginPinInput}
                onChange={(e) => setLoginPinInput(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3.5 py-2.5 text-sm font-mono text-[#F3EFE6] focus:border-[#D9A441] focus:outline-none"
                placeholder="Ingresa el PIN de administrador"
              />
              <p className="mt-1.5 text-[11px] text-[#9BA3B0]">
                PIN por defecto local: <code className="text-[#D9A441]">aegis2026</code> (cámbialo en <code className="text-[#D9A441]">.env</code> con <code className="text-[#D9A441]">ADMIN_PIN</code>).
              </p>
            </div>

            {loginError && (
              <div className="rounded-lg border border-[#E23D28]/40 bg-[#E23D28]/15 px-3 py-2 text-xs text-red-200">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-[#E23D28] py-2.5 text-sm font-semibold text-white hover:bg-[#F04A35] transition cursor-pointer"
            >
              Entrar al Centro de Control
            </button>
          </form>
        </div>
      </div>
    );
  }

  const registrations = overview?.registrations || [];
  const filteredRegs = registrations.filter((r) => {
    if (filter === 'pending') return r.status === 'pending_verification';
    if (filter === 'confirmed') return r.status === 'confirmed';
    if (filter === 'team') return r.type === 'team';
    if (filter === 'free_agent') return r.type === 'free_agent';
    if (filter === 'supporter') return r.type === 'supporter';
    return true;
  });

  const confirmedFreeAgents = registrations.filter(
    (r) => r.type === 'free_agent' && r.status === 'confirmed'
  );
  const hasDemoRecords = registrations.some((r) => r.isDemo);

  // Scaling projection
  const simGross = simTeams * simPrice + simFreeAgents * (cfgDraft?.freeAgentTicketPrice || 5);
  const simNet = simGross - simPrize;

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#F3EFE6]">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#12161D]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToSite}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#F3EFE6] hover:bg-white/10 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Ver Web Pública
            </button>
            <div className="hidden sm:block">
              <div className="font-display text-sm font-bold text-[#F3EFE6]">
                {overview?.config.name} · Admin ({overview?.config.edition})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadOverview(pin)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-[#9BA3B0] hover:text-white cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('aegis_admin_pin');
                setPin('');
                setAuthenticated(false);
              }}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#9BA3B0] hover:text-white cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {bannerMsg && (
          <div className="rounded-xl border border-[#2EA067]/40 bg-[#2EA067]/15 px-4 py-3 text-xs font-medium text-[#4ADE80]">
            {bannerMsg}
          </div>
        )}
        {errorMsg && (
          <div className="rounded-xl border border-[#E23D28]/40 bg-[#E23D28]/15 px-4 py-3 text-xs font-medium text-red-200">
            {errorMsg}
          </div>
        )}

        {/* Finance KPI Row */}
        {overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/10 bg-[#12161D] p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-[#9BA3B0]">
                <span>Ingresos Confirmados</span>
                <Wallet className="h-4 w-4 text-[#2EA067]" />
              </div>
              <div className="font-mono text-2xl font-bold text-[#F3EFE6] tabular-nums">
                ${overview.finance.grossConfirmedUSD} USD
              </div>
              <div className="text-[11px] text-[#9BA3B0]">
                {overview.finance.confirmedCount} tickets pagados
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#12161D] p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-[#9BA3B0]">
                <span>Por Verificar</span>
                <Eye className="h-4 w-4 text-[#D9A441]" />
              </div>
              <div className="font-mono text-2xl font-bold text-[#F5C563] tabular-nums">
                ${overview.finance.pendingUSD} USD
              </div>
              <div className="text-[11px] text-[#9BA3B0]">
                {overview.finance.pendingCount} transferencias pendientes
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#12161D] p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-[#9BA3B0]">
                <span>Prize Pool Comprometido</span>
                <Swords className="h-4 w-4 text-[#E23D28]" />
              </div>
              <div className="font-mono text-2xl font-bold text-[#F3EFE6] tabular-nums">
                ${overview.finance.prizePoolUSD} USD
              </div>
              <div className="text-[11px] text-[#9BA3B0]">
                Meta: {overview.config.maxTeams} equipos × ${overview.config.teamTicketPrice}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#12161D] p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-[#9BA3B0]">
                <span>Balance Neto Organizador</span>
                <TrendingUp className="h-4 w-4 text-[#D9A441]" />
              </div>
              <div
                className={`font-mono text-2xl font-bold tabular-nums ${
                  overview.finance.organizerNetUSD >= 0 ? 'text-[#4ADE80]' : 'text-[#F5C563]'
                }`}
              >
                {overview.finance.organizerNetUSD >= 0 ? '+' : ''}$
                {overview.finance.organizerNetUSD} USD
              </div>
              <div className="text-[11px] text-[#9BA3B0]">
                Ingresos confirmados menos Prize Pool
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'registrations' as const, label: 'Pagos y Registros', icon: Users },
              { id: 'bracket' as const, label: 'Bracket y Lobbies', icon: Swords },
              { id: 'scaling' as const, label: 'Escalamiento y Precios', icon: Settings2 },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                    active
                      ? 'bg-[#E23D28] text-white'
                      : 'border border-white/10 bg-[#12161D] text-[#9BA3B0] hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {hasDemoRecords ? (
              <button
                type="button"
                onClick={async () => {
                  await api.clearDemoData(pin);
                  await loadOverview(pin);
                  onDataChanged();
                  notify('Datos demo eliminados. Torneo limpio para inscripciones reales.');
                }}
                className="rounded-lg border border-[#D9A441]/40 bg-[#D9A441]/10 px-3 py-1.5 text-xs font-semibold text-[#F5C563] hover:bg-[#D9A441]/20 cursor-pointer"
              >
                Limpiar datos demo
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await api.seedDemoData(pin);
                  await loadOverview(pin);
                  onDataChanged();
                  notify('Datos de prueba cargados.');
                }}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-[#9BA3B0] hover:text-white cursor-pointer"
              >
                Cargar datos de prueba
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#12161D] px-3 py-1.5 text-xs font-medium text-[#F3EFE6] hover:bg-white/10 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* TAB 1: REGISTRATIONS */}
        {activeTab === 'registrations' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all' as const, label: `Todos (${registrations.length})` },
                {
                  id: 'pending' as const,
                  label: `Pendientes (${registrations.filter((r) => r.status === 'pending_verification').length})`,
                },
                {
                  id: 'confirmed' as const,
                  label: `Confirmados (${registrations.filter((r) => r.status === 'confirmed').length})`,
                },
                { id: 'team' as const, label: 'Equipos' },
                { id: 'free_agent' as const, label: 'Free Agents' },
                { id: 'supporter' as const, label: 'Supporters' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                    filter === f.id
                      ? 'bg-[#D9A441] text-[#0B0D10] font-semibold'
                      : 'border border-white/10 bg-[#12161D] text-[#9BA3B0] hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-[#12161D] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-[#161B24] text-[#9BA3B0] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Ticket</th>
                      <th className="px-4 py-3">Participante</th>
                      <th className="px-4 py-3">Contacto</th>
                      <th className="px-4 py-3">Pago</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredRegs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[#9BA3B0]">
                          No hay tickets en esta categoría.
                        </td>
                      </tr>
                    ) : (
                      filteredRegs.map((reg: FullRegistration) => (
                        <tr key={reg.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3.5 font-mono">
                            <div className="font-bold text-[#D9A441]">{reg.ticketCode}</div>
                            <div className="text-[11px] text-[#9BA3B0] uppercase">
                              {reg.type === 'team'
                                ? 'Equipo 5v5'
                                : reg.type === 'free_agent'
                                  ? 'Free Agent'
                                  : 'Supporter'}
                              {reg.isDemo ? ' · DEMO' : ''}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-[#F3EFE6]">
                              {reg.type === 'team'
                                ? `[${reg.teamTag}] ${reg.teamName}`
                                : reg.nickname}
                            </div>
                            <div className="text-[11px] text-[#9BA3B0]">
                              {reg.type === 'team'
                                ? `${reg.region} · ${reg.avgMmr} MMR`
                                : reg.type === 'free_agent'
                                  ? `${reg.primaryRole} · ${reg.mmr} MMR`
                                  : 'Pase VIP'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-[#9BA3B0]">
                            <div className="text-[#F3EFE6]">{reg.captainDiscord || reg.discord}</div>
                            <div className="text-[11px]">{reg.email}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-mono font-bold text-[#F3EFE6] tabular-nums">
                              ${reg.amountPaid} USD
                            </div>
                            <div className="text-[11px] text-[#9BA3B0]">
                              {reg.paymentMethod} · <span className="font-mono">{reg.operationRef}</span>
                            </div>
                            {reg.receiptImageBase64 && (
                              <button
                                type="button"
                                onClick={() => setReceiptPreview(reg.receiptImageBase64 || null)}
                                className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#D9A441] hover:underline cursor-pointer"
                              >
                                <Eye className="h-3 w-3" />
                                Ver comprobante
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                reg.status === 'confirmed'
                                  ? 'bg-[#2EA067]/15 text-[#4ADE80]'
                                  : reg.status === 'pending_verification'
                                    ? 'bg-[#D9A441]/15 text-[#F5C563]'
                                    : 'bg-red-500/15 text-red-300'
                              }`}
                            >
                              {reg.status === 'confirmed'
                                ? 'Confirmado'
                                : reg.status === 'pending_verification'
                                  ? 'Pendiente'
                                  : 'Rechazado'}
                            </span>
                            {reg.checkedIn && (
                              <div className="mt-1 text-[10px] font-semibold text-[#4ADE80]">
                                Check-in OK
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {reg.status !== 'confirmed' && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(reg.id, 'confirmed')}
                                  title="Aprobar pago"
                                  className="inline-flex items-center gap-1 rounded-md bg-[#2EA067]/20 border border-[#2EA067]/30 px-2.5 py-1.5 text-[11px] font-semibold text-[#4ADE80] hover:bg-[#2EA067]/30 cursor-pointer"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Aprobar
                                </button>
                              )}
                              {reg.status === 'pending_verification' && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(reg.id, 'rejected')}
                                  title="Rechazar"
                                  className="inline-flex items-center gap-1 rounded-md bg-red-500/15 border border-red-500/30 px-2 py-1.5 text-[11px] font-semibold text-red-300 hover:bg-red-500/25 cursor-pointer"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDelete(reg.id)}
                                title="Eliminar registro"
                                className="rounded-md border border-white/10 p-1.5 text-[#9BA3B0] hover:text-red-300 hover:border-red-500/30 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Free Agent Mix Builder */}
            <div className="rounded-xl border border-white/10 bg-[#12161D] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-bold text-[#F3EFE6]">
                    Armador de Equipo Mix (Free Agents → Equipo Oficial)
                  </h3>
                  <p className="text-xs text-[#9BA3B0]">
                    Selecciona 5 jugadores Free Agent confirmados para unirlos en un equipo listo para el bracket.
                  </p>
                </div>
                <span className="font-mono text-xs text-[#D9A441]">
                  {selectedFaIds.length} / 5 seleccionados
                </span>
              </div>

              {confirmedFreeAgents.length === 0 ? (
                <p className="text-xs text-[#9BA3B0]">
                  Aún no hay Free Agents confirmados en esta edición.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {confirmedFreeAgents.map((fa) => {
                    const checked = selectedFaIds.includes(fa.id);
                    return (
                      <label
                        key={fa.id}
                        className={`flex items-center justify-between gap-2 rounded-lg border p-3 text-xs cursor-pointer transition ${
                          checked
                            ? 'border-[#D9A441] bg-[#D9A441]/10'
                            : 'border-white/10 bg-[#0B0D10]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedFaIds((prev) =>
                                prev.includes(fa.id)
                                  ? prev.filter((x) => x !== fa.id)
                                  : prev.length < 5
                                    ? [...prev, fa.id]
                                    : prev
                              );
                            }}
                            className="accent-[#E23D28]"
                          />
                          <div>
                            <div className="font-semibold text-[#F3EFE6]">{fa.nickname}</div>
                            <div className="text-[11px] text-[#9BA3B0]">{fa.primaryRole}</div>
                          </div>
                        </div>
                        <span className="font-mono text-[#D9A441]">{fa.mmr} MMR</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {confirmedFreeAgents.length >= 5 && (
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <input
                    type="text"
                    value={mixTeamName}
                    onChange={(e) => setMixTeamName(e.target.value)}
                    placeholder="Nombre del equipo mix"
                    className="rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-xs text-[#F3EFE6]"
                  />
                  <input
                    type="text"
                    maxLength={5}
                    value={mixTeamTag}
                    onChange={(e) => setMixTeamTag(e.target.value.toUpperCase())}
                    placeholder="TAG"
                    className="w-24 rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-xs font-mono uppercase text-[#F3EFE6]"
                  />
                  <button
                    type="button"
                    disabled={selectedFaIds.length !== 5}
                    onClick={handleMergeFreeAgents}
                    className="rounded-lg bg-[#E23D28] px-4 py-2 text-xs font-semibold text-white hover:bg-[#F04A35] disabled:opacity-50 cursor-pointer"
                  >
                    Crear Equipo Mix (5 jugadores)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: BRACKET MANAGER */}
        {activeTab === 'bracket' && overview && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#12161D] p-5">
              <div>
                <h3 className="font-display text-base font-bold text-[#F3EFE6]">
                  Generación y Control del Bracket
                </h3>
                <p className="text-xs text-[#9BA3B0]">
                  Sortea las llaves automáticamente con todos los equipos con pago confirmado y avanza ganadores en vivo.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateBracket}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E23D28] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#F04A35] cursor-pointer"
              >
                <Shuffle className="h-4 w-4" />
                {overview.bracket.length > 0 ? 'Re-sortear Bracket' : 'Generar Bracket Oficial'}
              </button>
            </div>

            {overview.bracket.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 bg-[#12161D]/60 p-8 text-center text-sm text-[#9BA3B0]">
                Presiona <strong>Generar Bracket Oficial</strong> cuando tengas al menos 2 equipos confirmados.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overview.bracket.map((match) => (
                  <div
                    key={match.id}
                    className="rounded-xl border border-white/10 bg-[#12161D] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-display font-bold text-[#D9A441]">
                        {match.roundName} · {match.id}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          defaultValue={match.lobbyName}
                          onBlur={(e) =>
                            handleMatchUpdate(match, { lobbyName: e.target.value })
                          }
                          className="w-24 rounded border border-white/10 bg-[#0B0D10] px-2 py-1 text-[11px] font-mono text-[#F3EFE6]"
                          title="Nombre de Lobby"
                        />
                        <input
                          type="text"
                          defaultValue={match.scheduledTime}
                          onBlur={(e) =>
                            handleMatchUpdate(match, { scheduledTime: e.target.value })
                          }
                          className="w-28 rounded border border-white/10 bg-[#0B0D10] px-2 py-1 text-[11px] text-[#9BA3B0]"
                          title="Horario"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {[
                        { team: match.teamA, score: match.scoreA, key: 'A' as const },
                        { team: match.teamB, score: match.scoreB, key: 'B' as const },
                      ].map(({ team, score, key }) => {
                        const isWinner = Boolean(team && match.winnerId === team.id);
                        return (
                          <div
                            key={key}
                            className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 text-xs ${
                              isWinner
                                ? 'border-[#2EA067]/50 bg-[#2EA067]/10'
                                : 'border-white/10 bg-[#0B0D10]'
                            }`}
                          >
                            <span className="font-semibold text-[#F3EFE6] truncate">
                              {team ? `[${team.teamTag}] ${team.teamName}` : 'Esperando rival'}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="number"
                                min={0}
                                max={3}
                                value={score}
                                onChange={(e) =>
                                  handleMatchUpdate(
                                    match,
                                    key === 'A'
                                      ? { scoreA: Number(e.target.value) }
                                      : { scoreB: Number(e.target.value) }
                                  )
                                }
                                className="w-12 rounded border border-white/15 bg-[#12161D] px-2 py-1 text-center font-mono text-xs text-[#F3EFE6]"
                              />
                              {team && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMatchUpdate(match, {
                                      winnerId: team.id,
                                      ...(key === 'A'
                                        ? { scoreA: Math.max(1, match.scoreA) }
                                        : { scoreB: Math.max(1, match.scoreB) }),
                                    })
                                  }
                                  className={`rounded px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                                    isWinner
                                      ? 'bg-[#2EA067] text-white'
                                      : 'border border-white/15 bg-white/5 text-[#9BA3B0] hover:text-white'
                                  }`}
                                >
                                  {isWinner ? 'Ganador' : 'Dar Victoria'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SCALING & CONFIG */}
        {activeTab === 'scaling' && cfgDraft && (
          <div className="space-y-6">
            {/* Scaling Simulator */}
            <div className="rounded-xl border border-[#D9A441]/30 bg-[#12161D] p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#D9A441]">
                    <TrendingUp className="h-4 w-4" />
                    Planificador de Escalamiento
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#F3EFE6]">
                    Proyecta tus ganancias de Torneo Sencillo a Liga Mensual
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Fase 1: 16 Eq.', t: 16, p: 20, fa: 10, pr: 200 },
                    { label: 'Fase 2: 32 Eq.', t: 32, p: 25, fa: 20, pr: 450 },
                    { label: 'Fase 3: 64 Eq.', t: 64, p: 30, fa: 35, pr: 1000 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setSimTeams(preset.t);
                        setSimPrice(preset.p);
                        setSimFreeAgents(preset.fa);
                        setSimPrize(preset.pr);
                      }}
                      className="rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-1.5 text-xs font-medium text-[#F3EFE6] hover:border-[#D9A441] cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="flex justify-between text-xs text-[#9BA3B0] mb-1">
                    <span>Equipos inscritos</span>
                    <strong className="font-mono text-[#F3EFE6]">{simTeams}</strong>
                  </label>
                  <input
                    type="range"
                    min={8}
                    max={64}
                    step={4}
                    value={simTeams}
                    onChange={(e) => setSimTeams(Number(e.target.value))}
                    className="w-full accent-[#E23D28]"
                  />
                </div>
                <div>
                  <label className="flex justify-between text-xs text-[#9BA3B0] mb-1">
                    <span>Ticket Equipo (USD)</span>
                    <strong className="font-mono text-[#F3EFE6]">${simPrice}</strong>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={5}
                    value={simPrice}
                    onChange={(e) => setSimPrice(Number(e.target.value))}
                    className="w-full accent-[#E23D28]"
                  />
                </div>
                <div>
                  <label className="flex justify-between text-xs text-[#9BA3B0] mb-1">
                    <span>Tickets Free Agents</span>
                    <strong className="font-mono text-[#F3EFE6]">{simFreeAgents}</strong>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    step={5}
                    value={simFreeAgents}
                    onChange={(e) => setSimFreeAgents(Number(e.target.value))}
                    className="w-full accent-[#E23D28]"
                  />
                </div>
                <div>
                  <label className="flex justify-between text-xs text-[#9BA3B0] mb-1">
                    <span>Prize Pool (USD)</span>
                    <strong className="font-mono text-[#F3EFE6]">${simPrize}</strong>
                  </label>
                  <input
                    type="range"
                    min={100}
                    max={2000}
                    step={50}
                    value={simPrize}
                    onChange={(e) => setSimPrize(Number(e.target.value))}
                    className="w-full accent-[#D9A441]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-[#0B0D10] p-4 border border-white/10">
                <div>
                  <div className="text-xs text-[#9BA3B0]">Recaudación Bruta Estimada</div>
                  <div className="font-mono text-xl font-bold text-[#F3EFE6] tabular-nums">
                    ${simGross} USD
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#9BA3B0]">Premios a Repartir</div>
                  <div className="font-mono text-xl font-bold text-[#D9A441] tabular-nums">
                    ${simPrize} USD
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#9BA3B0]">Margen Neto Organizador</div>
                  <div
                    className={`font-mono text-xl font-bold tabular-nums ${
                      simNet >= 0 ? 'text-[#4ADE80]' : 'text-red-400'
                    }`}
                  >
                    ${simNet} USD
                  </div>
                </div>
              </div>
            </div>

            {/* Config Editor Form */}
            <form
              onSubmit={handleSaveConfig}
              className="rounded-xl border border-white/10 bg-[#12161D] p-5 sm:p-6 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-lg font-bold text-[#F3EFE6]">
                  Configuración en Vivo del Torneo y Métodos de Cobro
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewEdition(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9A441]/40 bg-[#D9A441]/10 px-3.5 py-2 text-xs font-semibold text-[#F5C563] hover:bg-[#D9A441]/20 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Archivar y Abrir Nueva Edición
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[#9BA3B0] mb-1">Nombre del Torneo</label>
                  <input
                    type="text"
                    value={cfgDraft.name}
                    onChange={(e) => setCfgDraft({ ...cfgDraft, name: e.target.value })}
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm text-[#F3EFE6]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9BA3B0] mb-1">Edición</label>
                  <input
                    type="text"
                    value={cfgDraft.edition}
                    onChange={(e) => setCfgDraft({ ...cfgDraft, edition: e.target.value })}
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm text-[#F3EFE6]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9BA3B0] mb-1">División / Rango MMR</label>
                  <input
                    type="text"
                    value={cfgDraft.divisionLabel}
                    onChange={(e) => setCfgDraft({ ...cfgDraft, divisionLabel: e.target.value })}
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm text-[#F3EFE6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-[#9BA3B0] mb-1">Cupos Equipos</label>
                  <select
                    value={cfgDraft.maxTeams}
                    onChange={(e) => setCfgDraft({ ...cfgDraft, maxTeams: Number(e.target.value) })}
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm text-[#F3EFE6]"
                  >
                    {[8, 16, 32, 64].map((n) => (
                      <option key={n} value={n}>
                        {n} Equipos
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#9BA3B0] mb-1">Ticket Equipo ($)</label>
                  <input
                    type="number"
                    value={cfgDraft.teamTicketPrice}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, teamTicketPrice: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm font-mono text-[#F3EFE6]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9BA3B0] mb-1">Free Agent ($)</label>
                  <input
                    type="number"
                    value={cfgDraft.freeAgentTicketPrice}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, freeAgentTicketPrice: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm font-mono text-[#F3EFE6]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9BA3B0] mb-1">Supporter ($)</label>
                  <input
                    type="number"
                    value={cfgDraft.supporterTicketPrice}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, supporterTicketPrice: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm font-mono text-[#F3EFE6]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9BA3B0] mb-1">Prize Pool ($)</label>
                  <input
                    type="number"
                    value={cfgDraft.prizePoolGuaranteed}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, prizePoolGuaranteed: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm font-mono text-[#F3EFE6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                <div>
                  <label className="block text-xs text-[#9BA3B0] mb-1">Número Yape / Plin</label>
                  <input
                    type="text"
                    value={cfgDraft.paymentConfig.yapePlinNumber}
                    onChange={(e) =>
                      setCfgDraft({
                        ...cfgDraft,
                        paymentConfig: {
                          ...cfgDraft.paymentConfig,
                          yapePlinNumber: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm font-mono text-[#F3EFE6]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9BA3B0] mb-1">Titular Yape / Plin</label>
                  <input
                    type="text"
                    value={cfgDraft.paymentConfig.yapePlinHolder}
                    onChange={(e) =>
                      setCfgDraft({
                        ...cfgDraft,
                        paymentConfig: {
                          ...cfgDraft.paymentConfig,
                          yapePlinHolder: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm text-[#F3EFE6]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9BA3B0] mb-1">Cuenta Bancaria / CCI</label>
                  <input
                    type="text"
                    value={cfgDraft.paymentConfig.bankAccount}
                    onChange={(e) =>
                      setCfgDraft({
                        ...cfgDraft,
                        paymentConfig: {
                          ...cfgDraft.paymentConfig,
                          bankAccount: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm font-mono text-[#F3EFE6]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9BA3B0] mb-1">PayPal / USDT TRC20</label>
                  <input
                    type="text"
                    value={cfgDraft.paymentConfig.paypalEmail}
                    onChange={(e) =>
                      setCfgDraft({
                        ...cfgDraft,
                        paymentConfig: {
                          ...cfgDraft.paymentConfig,
                          paypalEmail: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm font-mono text-[#F3EFE6]"
                  />
                </div>
              </div>

              {/* Promo Codes */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#9BA3B0]">
                  Códigos Promocionales (Creadores / Early Bird)
                </div>
                <div className="flex flex-wrap gap-2">
                  {(cfgDraft.promoCodes || []).map((pc, idx) => (
                    <div
                      key={pc.code}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-1.5 text-xs"
                    >
                      <span className="font-mono font-bold text-[#D9A441]">{pc.code}</span>
                      <span className="text-[#9BA3B0]">-{pc.discountPercent}%</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...(cfgDraft.promoCodes || [])];
                          next.splice(idx, 1);
                          setCfgDraft({ ...cfgDraft, promoCodes: next });
                        }}
                        className="text-[#9BA3B0] hover:text-red-400 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                    placeholder="NUEVOCODIGO"
                    className="rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-xs font-mono uppercase text-[#F3EFE6]"
                  />
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={newPromoPercent}
                    onChange={(e) => setNewPromoPercent(e.target.value)}
                    className="w-20 rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-xs font-mono text-[#F3EFE6]"
                  />
                  <button
                    type="button"
                    onClick={handleAddPromo}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-[#F3EFE6] hover:bg-white/10 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar cupón
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#F3EFE6] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfgDraft.registrationOpen}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, registrationOpen: e.target.checked })
                    }
                    className="accent-[#E23D28]"
                  />
                  Inscripciones abiertas al público
                </label>

                <button
                  type="submit"
                  className="rounded-lg bg-[#E23D28] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#F04A35] cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Receipt Lightbox */}
      {receiptPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setReceiptPreview(null)}
        >
          <div
            className="relative max-w-lg w-full rounded-xl border border-white/20 bg-[#12161D] p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setReceiptPreview(null)}
              className="absolute right-3 top-3 rounded-lg bg-black/70 p-2 text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={receiptPreview}
              alt="Comprobante de pago subido"
              className="w-full max-h-[75vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* New Edition Modal */}
      {showNewEdition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <form
            onSubmit={handleStartNewEdition}
            className="w-full max-w-md rounded-2xl border border-white/15 bg-[#12161D] p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#F3EFE6]">
                Lanzar Siguiente Edición
              </h3>
              <button
                type="button"
                onClick={() => setShowNewEdition(false)}
                className="text-[#9BA3B0] hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-[#9BA3B0]">
              Esto archivará los ingresos y campeón de la edición actual en el historial y abrirá un torneo limpio.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#9BA3B0] mb-1">Etiqueta de Edición</label>
                <input
                  type="text"
                  value={nextEdLabel}
                  onChange={(e) => setNextEdLabel(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm text-[#F3EFE6]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9BA3B0] mb-1">División / Rango</label>
                <input
                  type="text"
                  value={nextEdDivision}
                  onChange={(e) => setNextEdDivision(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm text-[#F3EFE6]"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-[#9BA3B0] mb-1">Cupos</label>
                  <input
                    type="number"
                    value={nextEdMaxTeams}
                    onChange={(e) => setNextEdMaxTeams(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm font-mono text-[#F3EFE6]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9BA3B0] mb-1">Ticket ($)</label>
                  <input
                    type="number"
                    value={nextEdPrice}
                    onChange={(e) => setNextEdPrice(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm font-mono text-[#F3EFE6]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9BA3B0] mb-1">Prize ($)</label>
                  <input
                    type="number"
                    value={nextEdPrize}
                    onChange={(e) => setNextEdPrize(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2 text-sm font-mono text-[#F3EFE6]"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewEdition(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-xs text-[#9BA3B0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#E23D28] px-4 py-2 text-xs font-semibold text-white hover:bg-[#F04A35] cursor-pointer"
              >
                Confirmar Nueva Edición
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
