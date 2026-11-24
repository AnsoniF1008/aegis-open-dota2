import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  CreditCard,
  Loader2,
  Shield,
  Sparkles,
  Tag,
  Upload,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import type {
  FullRegistration,
  PaymentMethod,
  TicketType,
  TournamentConfig,
  TournamentPayload,
} from '../types';
import { TicketPassCard } from './TicketPassCard';

interface CheckoutModalProps {
  isOpen: boolean;
  initialType: TicketType;
  config: TournamentConfig;
  remainingSlots: number;
  onClose: () => void;
  onSuccess: (updatedTournament?: TournamentPayload) => void;
}

const DEFAULT_ROSTER = [
  { nickname: '', role: 'Pos 1 · Carry', steamId: '' },
  { nickname: '', role: 'Pos 2 · Mid', steamId: '' },
  { nickname: '', role: 'Pos 3 · Offlane', steamId: '' },
  { nickname: '', role: 'Pos 4 · Soft Support', steamId: '' },
  { nickname: '', role: 'Pos 5 · Hard Support', steamId: '' },
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  initialType,
  config,
  remainingSlots,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'form' | 'payment' | 'done'>('form');
  const [ticketType, setTicketType] = useState<TicketType>(initialType);

  // Team fields
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [avgMmr, setAvgMmr] = useState('4200');
  const [captainDiscord, setCaptainDiscord] = useState('');
  const [captainContact, setCaptainContact] = useState('');
  const [email, setEmail] = useState('');
  const [roster, setRoster] = useState(DEFAULT_ROSTER);
  const [subNick, setSubNick] = useState('');
  const [subSteam, setSubSteam] = useState('');

  // Free agent / Supporter fields
  const [nickname, setNickname] = useState('');
  const [steamId, setSteamId] = useState('');
  const [mmr, setMmr] = useState('3800');
  const [primaryRole, setPrimaryRole] = useState('Pos 1 · Carry');
  const [secondaryRole, setSecondaryRole] = useState('Pos 4 · Soft Support');

  // Payment fields
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('777');
  const [operationRef, setOperationRef] = useState('');
  const [receiptBase64, setReceiptBase64] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');

  // Promo
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
    finalAmount: number;
  } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdTicket, setCreatedTicket] = useState<FullRegistration | null>(null);
  const [copiedKey, setCopiedKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTicketType(initialType);
      setStep('form');
      setError('');
      setPromoError('');
      setAppliedPromo(null);
      setCreatedTicket(null);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const basePrice =
    ticketType === 'team'
      ? config.teamTicketPrice
      : ticketType === 'free_agent'
        ? config.freeAgentTicketPrice
        : config.supporterTicketPrice;

  const finalPrice = appliedPromo ? appliedPromo.finalAmount : basePrice;

  const handleCopyText = async (key: string, val: string) => {
    await navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1800);
  };

  const fillDemoTeam = () => {
    const num = Math.floor(Math.random() * 90 + 10);
    setTeamName(`Vanguard Radiance ${num}`);
    setTeamTag(`VR${num}`);
    setAvgMmr('4650');
    setCaptainDiscord(`capitan_vr${num}#1024`);
    setCaptainContact('+51 987 654 321');
    setEmail(`capitan${num}@aegisopen.example`);
    setRoster([
      { nickname: 'KaelCarry', role: 'Pos 1 · Carry', steamId: '140928311' },
      { nickname: 'SolMid', role: 'Pos 2 · Mid', steamId: '240928312' },
      { nickname: 'BruteOff', role: 'Pos 3 · Offlane', steamId: '340928313' },
      { nickname: 'Blink4', role: 'Pos 4 · Soft Support', steamId: '440928314' },
      { nickname: 'Ward5', role: 'Pos 5 · Hard Support', steamId: '540928315' },
    ]);
    setError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError('La imagen del comprobante debe pesar menos de 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptBase64(reader.result);
        setReceiptFileName(file.name);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const validateStepOne = () => {
    setError('');
    if (ticketType === 'team') {
      if (remainingSlots <= 0) {
        setError('Los cupos de equipos ya están completos en esta edición.');
        return false;
      }
      if (teamName.trim().length < 2 || teamTag.trim().length < 2) {
        setError('Ingresa el nombre del equipo y un Tag de 2 a 5 letras.');
        return false;
      }
      if (!captainDiscord.trim() || !email.trim()) {
        setError('Ingresa el Discord y correo del capitán para coordinar el lobby.');
        return false;
      }
      const validPlayers = roster.filter(
        (p) => p.nickname.trim().length >= 1 && p.steamId.trim().length >= 3
      );
      if (validPlayers.length < 5) {
        setError('Completa los 5 titulares con su Nickname y Steam/Friend ID.');
        return false;
      }
    } else if (ticketType === 'free_agent') {
      if (!nickname.trim() || !steamId.trim() || !captainDiscord.trim() || !email.trim()) {
        setError('Completa Nickname, Steam ID, Discord y correo para continuar.');
        return false;
      }
    } else {
      if (!nickname.trim() || !captainDiscord.trim() || !email.trim()) {
        setError('Ingresa tu Nickname, Discord y correo para continuar.');
        return false;
      }
    }
    return true;
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const res = await api.validatePromo(promoInput, ticketType);
      setAppliedPromo({
        code: res.code,
        discountPercent: res.discountPercent,
        finalAmount: res.finalAmount,
      });
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(err instanceof Error ? err.message : 'Código no válido.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleSubmitOrder = async (useStripeRedirect = false) => {
    setError('');
    if (paymentMethod !== 'card' && operationRef.trim().length < 3) {
      setError('Ingresa el número de operación o referencia de tu pago.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type: ticketType,
        paymentMethod,
        promoCode: appliedPromo?.code || '',
        cardLast4: cardNumber.replace(/\s+/g, '').slice(-4) || '4242',
        operationRef: operationRef.trim(),
        receiptImageBase64: receiptBase64,
        useStripeRedirect,
      };

      if (ticketType === 'team') {
        Object.assign(payload, {
          teamName: teamName.trim(),
          teamTag: teamTag.trim().toUpperCase(),
          region: config.region,
          avgMmr: Number(avgMmr) || 4000,
          captainDiscord: captainDiscord.trim(),
          captainContact: captainContact.trim(),
          email: email.trim(),
          roster,
          subPlayer: subNick.trim()
            ? { nickname: subNick.trim(), steamId: subSteam.trim() }
            : null,
        });
      } else if (ticketType === 'free_agent') {
        Object.assign(payload, {
          nickname: nickname.trim(),
          steamId: steamId.trim(),
          mmr: Number(mmr) || 3500,
          primaryRole,
          secondaryRole,
          region: config.region,
          discord: captainDiscord.trim(),
          contact: captainContact.trim(),
          email: email.trim(),
        });
      } else {
        Object.assign(payload, {
          nickname: nickname.trim(),
          discord: captainDiscord.trim(),
          email: email.trim(),
        });
      }

      const res = await api.createRegistration(payload);
      if (res.stripeCheckoutUrl) {
        window.location.href = res.stripeCheckoutUrl;
        return;
      }
      if (res.ticket) {
        setCreatedTicket(res.ticket);
        setStep('done');
        onSuccess(res.tournament);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la inscripción.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-[#12161D] shadow-2xl my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-[#161B24] rounded-t-2xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D9A441]">
              {config.name} · {config.edition}
            </p>
            <h2 id="checkout-modal-title" className="font-display text-lg sm:text-xl font-bold text-[#F3EFE6]">
              {step === 'done'
                ? 'Ticket Generado'
                : step === 'payment'
                  ? 'Confirmar Pago de Ticket'
                  : 'Registro y Venta de Ticket'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#9BA3B0] hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {step === 'form' && (
            <>
              {/* Ticket type switcher */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'team' as TicketType,
                    title: 'Equipo 5v5',
                    price: config.teamTicketPrice,
                    sub: `${remainingSlots} cupos libres`,
                    icon: Users,
                  },
                  {
                    id: 'free_agent' as TicketType,
                    title: 'Free Agent',
                    price: config.freeAgentTicketPrice,
                    sub: 'Jugador individual',
                    icon: User,
                  },
                  {
                    id: 'supporter' as TicketType,
                    title: 'Supporter VIP',
                    price: config.supporterTicketPrice,
                    sub: 'Sorteos y Discord VIP',
                    icon: Sparkles,
                  },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = ticketType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setTicketType(opt.id);
                        setAppliedPromo(null);
                        setError('');
                      }}
                      className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition cursor-pointer ${
                        active
                          ? 'border-[#E23D28] bg-[#E23D28]/10'
                          : 'border-white/10 bg-[#0B0D10]/70 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${active ? 'text-[#E23D28]' : 'text-[#9BA3B0]'}`} />
                        <div>
                          <div className="text-sm font-semibold text-[#F3EFE6]">{opt.title}</div>
                          <div className="text-xs text-[#9BA3B0]">{opt.sub}</div>
                        </div>
                      </div>
                      <div className="font-mono text-sm font-bold text-[#D9A441] tabular-nums">
                        ${opt.price}
                      </div>
                    </button>
                  );
                })}
              </div>

              {ticketType === 'team' ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#9BA3B0]">
                      Completa los datos del capitán y el roster de 5 titulares.
                    </span>
                    <button
                      type="button"
                      onClick={fillDemoTeam}
                      className="text-xs font-medium text-[#D9A441] hover:underline cursor-pointer"
                    >
                      Autocompletar equipo de prueba
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-[#9BA3B0] mb-1">
                        Nombre del Equipo *
                      </label>
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Ej. Lima Knights"
                        className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#9BA3B0] mb-1">
                        Tag (2–5) *
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={teamTag}
                        onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                        placeholder="LK"
                        className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm font-mono uppercase text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#9BA3B0] mb-1">
                        MMR Promedio
                      </label>
                      <input
                        type="number"
                        min={500}
                        max={14000}
                        value={avgMmr}
                        onChange={(e) => setAvgMmr(e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm font-mono text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#9BA3B0] mb-1">
                        Discord del Capitán *
                      </label>
                      <input
                        type="text"
                        value={captainDiscord}
                        onChange={(e) => setCaptainDiscord(e.target.value)}
                        placeholder="usuario#1234"
                        className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#9BA3B0] mb-1">
                        Correo para recibir ticket *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="capitan@correo.com"
                        className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#9BA3B0] mb-1">
                        WhatsApp del Capitán
                      </label>
                      <input
                        type="text"
                        value={captainContact}
                        onChange={(e) => setCaptainContact(e.target.value)}
                        placeholder="+51 999 000 123"
                        className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0B0D10]/70 px-3.5 py-2 text-xs">
                    <span className="text-[#9BA3B0]">Servidor único oficial de las partidas:</span>
                    <span className="font-semibold text-[#D9A441]">{config.region}</span>
                  </div>

                  {/* Roster */}
                  <div className="rounded-xl border border-white/10 bg-[#0B0D10]/70 p-3.5 space-y-2.5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#9BA3B0]">
                      Titulares (5 jugadores obligatorios)
                    </div>
                    {roster.map((player, idx) => (
                      <div key={player.role} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <span className="sm:col-span-3 text-xs font-medium text-[#D9A441]">
                          {player.role}
                        </span>
                        <input
                          type="text"
                          value={player.nickname}
                          onChange={(e) => {
                            const next = [...roster];
                            next[idx] = { ...next[idx], nickname: e.target.value };
                            setRoster(next);
                          }}
                          placeholder={`Nickname Pos ${idx + 1}`}
                          className="sm:col-span-5 rounded-lg border border-white/10 bg-[#12161D] px-3 py-2 text-xs text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                        />
                        <input
                          type="text"
                          value={player.steamId}
                          onChange={(e) => {
                            const next = [...roster];
                            next[idx] = { ...next[idx], steamId: e.target.value };
                            setRoster(next);
                          }}
                          placeholder="Friend ID Dota 2 (ej. 10492811)"
                          className="sm:col-span-4 rounded-lg border border-white/10 bg-[#12161D] px-3 py-2 text-xs font-mono text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                        />
                      </div>
                    ))}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-1 border-t border-white/5">
                      <span className="sm:col-span-3 text-xs text-[#9BA3B0]">Suplente (opcional)</span>
                      <input
                        type="text"
                        value={subNick}
                        onChange={(e) => setSubNick(e.target.value)}
                        placeholder="Nickname suplente"
                        className="sm:col-span-5 rounded-lg border border-white/10 bg-[#12161D] px-3 py-2 text-xs text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={subSteam}
                        onChange={(e) => setSubSteam(e.target.value)}
                        placeholder="Friend ID suplente"
                        className="sm:col-span-4 rounded-lg border border-white/10 bg-[#12161D] px-3 py-2 text-xs font-mono text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : ticketType === 'free_agent' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#9BA3B0] mb-1">
                      Nickname en Dota 2 *
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Ej. ShadowMid"
                      className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#9BA3B0] mb-1">
                      Dota 2 Friend ID / Steam ID *
                    </label>
                    <input
                      type="text"
                      value={steamId}
                      onChange={(e) => setSteamId(e.target.value)}
                      placeholder="Ej. 192837465"
                      className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm font-mono text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#9BA3B0] mb-1">Rol Principal</label>
                    <select
                      value={primaryRole}
                      onChange={(e) => setPrimaryRole(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                    >
                      {DEFAULT_ROSTER.map((r) => (
                        <option key={r.role} value={r.role}>
                          {r.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#9BA3B0] mb-1">Rol Secundario</label>
                    <select
                      value={secondaryRole}
                      onChange={(e) => setSecondaryRole(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                    >
                      {DEFAULT_ROSTER.map((r) => (
                        <option key={r.role} value={r.role}>
                          {r.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#9BA3B0] mb-1">MMR Actual</label>
                    <input
                      type="number"
                      min={100}
                      max={14000}
                      value={mmr}
                      onChange={(e) => setMmr(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm font-mono text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#9BA3B0] mb-1">Servidor Oficial</label>
                    <div className="w-full rounded-lg border border-white/15 bg-[#0B0D10]/70 px-3 py-2.5 text-sm font-medium text-[#D9A441]">
                      {config.region}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#9BA3B0] mb-1">Discord *</label>
                    <input
                      type="text"
                      value={captainDiscord}
                      onChange={(e) => setCaptainDiscord(e.target.value)}
                      placeholder="jugador#1234"
                      className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#9BA3B0] mb-1">Correo *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jugador@correo.com"
                      className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-[#D9A441]/25 bg-[#D9A441]/10 p-3.5 text-xs text-[#F3EFE6]">
                    El <strong>Pase Supporter VIP</strong> apoya el prize pool del torneo, te otorga rol exclusivo en Discord y acceso al sorteo de ítems durante la transmisión oficial gratuita en Twitch/Kick.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#9BA3B0] mb-1">Nickname *</label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Tu nick"
                        className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#9BA3B0] mb-1">Discord *</label>
                      <input
                        type="text"
                        value={captainDiscord}
                        onChange={(e) => setCaptainDiscord(e.target.value)}
                        placeholder="nick#0001"
                        className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#9BA3B0] mb-1">Correo *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        className="w-full rounded-lg border border-white/15 bg-[#0B0D10] px-3 py-2.5 text-sm text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-[#E23D28]/40 bg-[#E23D28]/15 px-3.5 py-2.5 text-xs text-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#E23D28]" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="text-sm text-[#9BA3B0]">
                  Total ticket:{' '}
                  <span className="font-mono font-bold text-[#F3EFE6] tabular-nums">
                    ${basePrice} {config.currency}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStepOne()) setStep('payment');
                  }}
                  className="inline-flex items-center justify-center rounded-lg bg-[#E23D28] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#F04A35] transition cursor-pointer"
                >
                  Continuar al Pago
                </button>
              </div>
            </>
          )}

          {step === 'payment' && (
            <>
              {/* Promo Code + Order Summary */}
              <div className="rounded-xl border border-white/10 bg-[#0B0D10] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#9BA3B0]">Resumen de compra</div>
                  <div className="font-display text-lg font-bold text-[#F3EFE6]">
                    {ticketType === 'team'
                      ? `${teamName} [${teamTag}] · Cupo 5v5`
                      : ticketType === 'free_agent'
                        ? `${nickname} · Free Agent`
                        : `${nickname} · Supporter VIP`}
                  </div>
                  {appliedPromo && (
                    <div className="text-xs text-[#4ADE80] mt-0.5">
                      Cupón {appliedPromo.code} aplicado ({appliedPromo.discountPercent}% desc.)
                    </div>
                  )}
                </div>

                <div className="text-left sm:text-right">
                  {appliedPromo && (
                    <div className="text-xs text-[#9BA3B0] line-through font-mono tabular-nums">
                      ${basePrice} USD
                    </div>
                  )}
                  <div className="font-mono text-2xl font-bold text-[#D9A441] tabular-nums">
                    ${finalPrice} USD
                  </div>
                </div>
              </div>

              {/* Promo Input */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Tag className="h-4 w-4 text-[#9BA3B0] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Código de descuento (ej. AEGIS10)"
                    className="w-full rounded-lg border border-white/15 bg-[#0B0D10] pl-9 pr-3 py-2 text-xs font-mono uppercase text-[#F3EFE6] focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoLoading}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-[#F3EFE6] hover:bg-white/10 transition cursor-pointer"
                >
                  {promoLoading ? 'Validando...' : 'Aplicar cupón'}
                </button>
                {promoError && <span className="w-full text-xs text-red-400">{promoError}</span>}
              </div>

              {/* Payment method tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'card' as PaymentMethod, label: 'Tarjeta / Stripe', icon: CreditCard },
                  { id: 'yape_plin' as PaymentMethod, label: 'Yape / Plin', icon: Wallet },
                  { id: 'bank_transfer' as PaymentMethod, label: 'Transferencia', icon: Shield },
                  { id: 'paypal' as PaymentMethod, label: 'PayPal / USDT', icon: Wallet },
                ].map((m) => {
                  const Icon = m.icon;
                  const active = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(m.id);
                        setError('');
                      }}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition cursor-pointer ${
                        active
                          ? 'border-[#D9A441] bg-[#D9A441]/15 text-[#F5C563]'
                          : 'border-white/10 bg-[#0B0D10]/70 text-[#9BA3B0] hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Payment details form */}
              {paymentMethod === 'card' ? (
                <div className="rounded-xl border border-white/10 bg-[#0B0D10]/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#F3EFE6]">
                      Pago inmediato con tarjeta (Confirmación automática)
                    </span>
                    <span className="rounded bg-[#2EA067]/15 px-2 py-0.5 text-[11px] font-medium text-[#4ADE80]">
                      {config.paymentConfig.stripeConfigured ? 'Stripe Live' : 'Sandbox Local'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-[#9BA3B0] mb-1">Número de tarjeta</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-[#12161D] px-3 py-2 text-sm font-mono text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-[#9BA3B0] mb-1">Exp</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full rounded-lg border border-white/15 bg-[#12161D] px-2.5 py-2 text-sm font-mono text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#9BA3B0] mb-1">CVC</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full rounded-lg border border-white/15 bg-[#12161D] px-2.5 py-2 text-sm font-mono text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#9BA3B0]">
                    En producción puedes activar Stripe Checkout colocando tu <code className="text-[#D9A441]">STRIPE_SECRET_KEY</code> en el archivo <code className="text-[#D9A441]">.env</code>. En modo prueba se confirma el ticket al instante.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-[#0B0D10]/80 p-4 space-y-3.5">
                  <div className="rounded-lg border border-[#D9A441]/25 bg-[#12161D] p-3 text-xs space-y-1.5">
                    {paymentMethod === 'yape_plin' && (
                      <>
                        <div className="text-[#9BA3B0]">Envía <strong className="text-[#D9A441]">${finalPrice} USD</strong> (o equivalente local) por Yape / Plin al número:</div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-bold text-[#F3EFE6]">
                            {config.paymentConfig.yapePlinNumber} · {config.paymentConfig.yapePlinHolder}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText('yape', config.paymentConfig.yapePlinNumber)}
                            className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-[11px] text-[#F3EFE6] hover:bg-white/10 cursor-pointer"
                          >
                            {copiedKey === 'yape' ? <Check className="h-3 w-3 text-[#4ADE80]" /> : <Copy className="h-3 w-3" />}
                            Copiar
                          </button>
                        </div>
                      </>
                    )}
                    {paymentMethod === 'bank_transfer' && (
                      <>
                        <div className="text-[#9BA3B0]">Transfiere <strong className="text-[#D9A441]">${finalPrice} USD</strong> a la cuenta oficial:</div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs sm:text-sm font-bold text-[#F3EFE6]">
                            {config.paymentConfig.bankAccount}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText('bank', config.paymentConfig.bankAccount)}
                            className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-[11px] text-[#F3EFE6] hover:bg-white/10 cursor-pointer shrink-0"
                          >
                            {copiedKey === 'bank' ? <Check className="h-3 w-3 text-[#4ADE80]" /> : <Copy className="h-3 w-3" />}
                            Copiar
                          </button>
                        </div>
                      </>
                    )}
                    {paymentMethod === 'paypal' && (
                      <div className="space-y-1.5">
                        <div className="text-[#9BA3B0]">Envía <strong className="text-[#D9A441]">${finalPrice} USD</strong> vía PayPal o USDT TRC20:</div>
                        <div className="font-mono text-xs text-[#F3EFE6]">PayPal: {config.paymentConfig.paypalEmail}</div>
                        <div className="font-mono text-xs text-[#F3EFE6] break-all">Crypto: {config.paymentConfig.cryptoAddress}</div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#9BA3B0] mb-1">
                        N.º de Operación / ID Transacción *
                      </label>
                      <input
                        type="text"
                        value={operationRef}
                        onChange={(e) => setOperationRef(e.target.value)}
                        placeholder="Ej. YAPE-993812"
                        className="w-full rounded-lg border border-white/15 bg-[#12161D] px-3 py-2 text-sm font-mono text-[#F3EFE6] focus:border-[#E23D28] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#9BA3B0] mb-1">
                        Comprobante (Captura opcional)
                      </label>
                      <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-[#12161D] px-3 py-2 text-xs text-[#9BA3B0] hover:border-[#D9A441] hover:text-white cursor-pointer transition">
                        <Upload className="h-4 w-4 text-[#D9A441]" />
                        <span className="truncate">{receiptFileName || 'Subir imagen (PNG/JPG)'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-[#E23D28]/40 bg-[#E23D28]/15 px-3.5 py-2.5 text-xs text-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#E23D28]" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="rounded-lg border border-white/15 px-4 py-2.5 text-xs font-semibold text-[#9BA3B0] hover:text-white cursor-pointer"
                >
                  Volver a datos
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  {paymentMethod === 'card' && config.paymentConfig.stripeConfigured && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmitOrder(true)}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#D9A441]/50 bg-[#D9A441]/15 px-4 py-2.5 text-sm font-semibold text-[#F5C563] hover:bg-[#D9A441]/25 transition cursor-pointer"
                    >
                      Pagar con Stripe
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSubmitOrder(false)}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#E23D28] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#F04A35] disabled:opacity-60 transition cursor-pointer"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {paymentMethod === 'card'
                      ? `Pagar $${finalPrice} USD ahora`
                      : `Enviar registro ($${finalPrice} USD)`}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 'done' && createdTicket && (
            <div className="space-y-4">
              <TicketPassCard
                ticket={createdTicket}
                tournamentName={config.name}
                edition={config.edition}
              />
              <p className="text-xs text-[#9BA3B0]">
                Guarda tu código <strong className="font-mono text-[#D9A441]">{createdTicket.ticketCode}</strong>. Puedes consultarlo en cualquier momento en la sección <strong>Mi Ticket</strong> para verificar aprobación y hacer check-in 30 minutos antes del inicio.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-[#E23D28] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#F04A35] transition cursor-pointer"
                >
                  Listo, volver al torneo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
