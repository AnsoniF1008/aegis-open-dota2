import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { createDefaultConfig, createDemoRecords, readStore, writeStore } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT || 3001);
const ADMIN_PIN = process.env.ADMIN_PIN || 'aegis2026';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

function generateTicketCode(type) {
  const prefix = type === 'team' ? 'AEG-T' : type === 'free_agent' ? 'AEG-F' : 'AEG-S';
  const suffix = crypto.randomInt(1000, 9999);
  return `${prefix}-${suffix}`;
}

function sanitizeRegistrationPublic(reg) {
  if (reg.type === 'team') {
    return {
      id: reg.id,
      type: reg.type,
      ticketCode: reg.ticketCode,
      status: reg.status,
      checkedIn: Boolean(reg.checkedIn),
      isDemo: Boolean(reg.isDemo),
      createdAt: reg.createdAt,
      teamName: reg.teamName,
      teamTag: reg.teamTag,
      region: reg.region,
      avgMmr: reg.avgMmr,
      roster: Array.isArray(reg.roster)
        ? reg.roster.map((p) => ({ nickname: p.nickname, role: p.role }))
        : [],
    };
  }
  if (reg.type === 'free_agent') {
    return {
      id: reg.id,
      type: reg.type,
      ticketCode: reg.ticketCode,
      status: reg.status,
      checkedIn: Boolean(reg.checkedIn),
      isDemo: Boolean(reg.isDemo),
      createdAt: reg.createdAt,
      nickname: reg.nickname,
      mmr: reg.mmr,
      primaryRole: reg.primaryRole,
      secondaryRole: reg.secondaryRole,
      region: reg.region,
    };
  }
  return {
    id: reg.id,
    type: reg.type,
    ticketCode: reg.ticketCode,
    status: reg.status,
    isDemo: Boolean(reg.isDemo),
    createdAt: reg.createdAt,
    nickname: reg.nickname,
  };
}

function resolvePromoDiscount(config, rawCode) {
  const clean = String(rawCode || '').trim().toUpperCase();
  if (!clean) return { code: '', discountPercent: 0, valid: false };
  const match = (config.promoCodes || []).find(
    (p) => p.active && String(p.code).trim().toUpperCase() === clean
  );
  if (!match) return { code: clean, discountPercent: 0, valid: false };
  return {
    code: clean,
    discountPercent: Math.min(90, Math.max(1, Number(match.discountPercent) || 0)),
    valid: true,
  };
}

function getBaseAmount(config, type) {
  if (type === 'team') return Number(config.teamTicketPrice) || 20;
  if (type === 'free_agent') return Number(config.freeAgentTicketPrice) || 5;
  if (type === 'supporter') return Number(config.supporterTicketPrice) || 8;
  return 0;
}

function buildPublicPayload(store) {
  const { config, registrations, bracket, pastEditions } = store;
  const activeRegs = registrations.filter((r) => r.status !== 'rejected');
  const confirmedTeams = activeRegs.filter((r) => r.type === 'team' && r.status === 'confirmed');
  const pendingTeams = activeRegs.filter((r) => r.type === 'team' && r.status === 'pending_verification');
  const confirmedFreeAgents = activeRegs.filter(
    (r) => r.type === 'free_agent' && r.status === 'confirmed'
  );
  const confirmedSupporters = activeRegs.filter(
    (r) => r.type === 'supporter' && r.status === 'confirmed'
  );

  const usedSlots = confirmedTeams.length + pendingTeams.length;
  const remainingSlots = Math.max(0, Number(config.maxTeams) - usedSlots);

  const publicConfig = {
    ...config,
    paymentConfig: {
      ...config.paymentConfig,
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    },
    promoCodes: undefined,
  };

  return {
    config: publicConfig,
    stats: {
      confirmedTeamsCount: confirmedTeams.length,
      pendingTeamsCount: pendingTeams.length,
      usedSlots,
      remainingSlots,
      freeAgentsCount: confirmedFreeAgents.length,
      supportersCount: confirmedSupporters.length,
    },
    teams: activeRegs.filter((r) => r.type === 'team').map(sanitizeRegistrationPublic),
    freeAgents: activeRegs.filter((r) => r.type === 'free_agent').map(sanitizeRegistrationPublic),
    bracket,
    pastEditions: pastEditions || [],
  };
}

function nextPowerOfTwo(n) {
  let p = 4;
  while (p < n) p *= 2;
  return p;
}

function generateSingleElimBracket(confirmedTeams) {
  if (confirmedTeams.length < 2) return [];
  const shuffled = [...confirmedTeams].sort(() => Math.random() - 0.5);
  const size = nextPowerOfTwo(shuffled.length);
  const totalRounds = Math.log2(size);
  const matches = [];

  const getRoundName = (roundIndex) => {
    const remainingRounds = totalRounds - roundIndex;
    if (remainingRounds === 1) return 'Gran Final';
    if (remainingRounds === 2) return 'Semifinales';
    if (remainingRounds === 3) return 'Cuartos de Final';
    if (remainingRounds === 4) return 'Octavos de Final';
    return `Ronda ${roundIndex + 1}`;
  };

  // Round 1 matches
  const round1Count = size / 2;
  for (let i = 0; i < round1Count; i += 1) {
    const teamA = shuffled[i * 2] || null;
    const teamB = shuffled[i * 2 + 1] || null;
    const isBye = Boolean(teamA && !teamB) || Boolean(!teamA && teamB);
    const autoWinner = teamA && !teamB ? teamA.id : !teamA && teamB ? teamB.id : null;

    matches.push({
      id: `R1-M${i + 1}`,
      round: 1,
      roundName: getRoundName(0),
      matchIndex: i,
      bestOf: totalRounds === 1 ? 3 : 1,
      teamA: teamA
        ? { id: teamA.id, teamName: teamA.teamName, teamTag: teamA.teamTag }
        : null,
      teamB: teamB
        ? { id: teamB.id, teamName: teamB.teamName, teamTag: teamB.teamTag }
        : null,
      scoreA: 0,
      scoreB: 0,
      winnerId: autoWinner,
      isBye,
      scheduledTime: 'Por definir',
      lobbyName: `AEGIS-${100 + i}`,
    });
  }

  // Subsequent rounds
  for (let r = 2; r <= totalRounds; r += 1) {
    const count = size / 2 ** r;
    for (let i = 0; i < count; i += 1) {
      matches.push({
        id: `R${r}-M${i + 1}`,
        round: r,
        roundName: getRoundName(r - 1),
        matchIndex: i,
        bestOf: r === totalRounds ? 3 : 1,
        teamA: null,
        teamB: null,
        scoreA: 0,
        scoreB: 0,
        winnerId: null,
        isBye: false,
        scheduledTime: 'Por definir',
        lobbyName: `AEGIS-${r * 100 + i}`,
      });
    }
  }

  // Propagate R1 BYE winners into R2
  for (const m of matches.filter((x) => x.round === 1 && x.winnerId)) {
    propagateWinner(matches, m);
  }

  return matches;
}

function propagateWinner(matches, sourceMatch) {
  if (!sourceMatch.winnerId) return;
  const winnerObj =
    sourceMatch.teamA?.id === sourceMatch.winnerId
      ? sourceMatch.teamA
      : sourceMatch.teamB?.id === sourceMatch.winnerId
        ? sourceMatch.teamB
        : null;
  if (!winnerObj) return;

  const nextRound = sourceMatch.round + 1;
  const nextIndex = Math.floor(sourceMatch.matchIndex / 2);
  const nextMatch = matches.find((m) => m.round === nextRound && m.matchIndex === nextIndex);
  if (!nextMatch) return;

  if (sourceMatch.matchIndex % 2 === 0) {
    nextMatch.teamA = { ...winnerObj };
  } else {
    nextMatch.teamB = { ...winnerObj };
  }
}

function requireAdmin(req, res, next) {
  const pin = req.headers['x-admin-pin'];
  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ error: 'PIN de organizador incorrecto o no autorizado.' });
  }
  return next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/api/tournament', async (_req, res) => {
  try {
    const store = await readStore();
    res.json(buildPublicPayload(store));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo cargar la información del torneo.' });
  }
});

app.post('/api/promo/validate', async (req, res) => {
  try {
    const { code, type } = req.body || {};
    const store = await readStore();
    const baseAmount = getBaseAmount(store.config, type);
    const promo = resolvePromoDiscount(store.config, code);
    if (!promo.valid) {
      return res.status(404).json({ valid: false, error: 'Código promocional inválido o inactivo.' });
    }
    const discountAmount = Number(((baseAmount * promo.discountPercent) / 100).toFixed(2));
    const finalAmount = Math.max(0, Number((baseAmount - discountAmount).toFixed(2)));
    return res.json({
      valid: true,
      code: promo.code,
      discountPercent: promo.discountPercent,
      baseAmount,
      discountAmount,
      finalAmount,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error validando el código promocional.' });
  }
});

app.post('/api/registrations', async (req, res) => {
  try {
    const body = req.body || {};
    const { type, paymentMethod, promoCode } = body;

    if (!['team', 'free_agent', 'supporter'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de ticket inválido.' });
    }

    const store = await readStore();
    const { config, registrations } = store;

    if (!config.registrationOpen) {
      return res.status(403).json({ error: 'Las inscripciones para esta edición están cerradas.' });
    }

    const activeTeams = registrations.filter(
      (r) => r.type === 'team' && r.status !== 'rejected'
    ).length;

    if (type === 'team' && activeTeams >= Number(config.maxTeams)) {
      return res.status(409).json({ error: 'Los cupos para equipos están agotados en esta edición.' });
    }

    const validPaymentMethods = ['card', 'yape_plin', 'bank_transfer', 'paypal', 'crypto_usdt'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Método de pago inválido.' });
    }

    const baseAmount = getBaseAmount(config, type);
    const promo = resolvePromoDiscount(config, promoCode);
    const discountPercent = promo.valid ? promo.discountPercent : 0;
    const amountPaid = Math.max(
      0,
      Number((baseAmount * (1 - discountPercent / 100)).toFixed(2))
    );

    const receiptImageBase64 = String(body.receiptImageBase64 || '');
    if (receiptImageBase64.length > 4 * 1024 * 1024) {
      return res.status(400).json({ error: 'El comprobante excede el tamaño máximo permitido (3 MB).' });
    }

    let specificData = {};

    if (type === 'team') {
      const teamName = String(body.teamName || '').trim();
      const teamTag = String(body.teamTag || '').trim().toUpperCase();
      const region = store.config.region || 'Estados Unidos (US East)';
      const avgMmr = Number(body.avgMmr) || 3500;
      const captainDiscord = String(body.captainDiscord || '').trim();
      const captainContact = String(body.captainContact || '').trim();
      const email = String(body.email || '').trim();
      const roster = Array.isArray(body.roster) ? body.roster : [];

      if (teamName.length < 2 || teamTag.length < 2 || teamTag.length > 5) {
        return res.status(400).json({
          error: 'Ingresa un nombre de equipo válido y un Tag de 2 a 5 caracteres.',
        });
      }
      if (!captainDiscord || !email) {
        return res.status(400).json({
          error: 'El Discord y correo del capitán son obligatorios para coordinar el lobby.',
        });
      }
      const cleanRoster = roster
        .slice(0, 5)
        .map((p, idx) => ({
          nickname: String(p?.nickname || '').trim(),
          role: String(p?.role || `Pos ${idx + 1}`).trim(),
          steamId: String(p?.steamId || '').trim(),
        }))
        .filter((p) => p.nickname.length >= 1 && p.steamId.length >= 3);

      if (cleanRoster.length < 5) {
        return res.status(400).json({
          error: 'Debes completar los 5 jugadores titulares con Nickname y Steam/Friend ID.',
        });
      }

      const duplicateName = registrations.some(
        (r) =>
          r.type === 'team' &&
          r.status !== 'rejected' &&
          r.teamName.toLowerCase() === teamName.toLowerCase()
      );
      if (duplicateName) {
        return res.status(409).json({ error: `El equipo "${teamName}" ya está registrado.` });
      }

      specificData = {
        teamName,
        teamTag,
        region,
        avgMmr,
        captainDiscord,
        captainContact,
        email,
        roster: cleanRoster,
        subPlayer: body.subPlayer?.nickname
          ? {
              nickname: String(body.subPlayer.nickname).trim(),
              steamId: String(body.subPlayer.steamId || '').trim(),
            }
          : null,
      };
    } else if (type === 'free_agent') {
      const nickname = String(body.nickname || '').trim();
      const steamId = String(body.steamId || '').trim();
      const mmr = Number(body.mmr) || 3000;
      const primaryRole = String(body.primaryRole || 'Pos 1 · Carry').trim();
      const secondaryRole = String(body.secondaryRole || 'Pos 4 · Soft Support').trim();
      const region = store.config.region || 'Estados Unidos (US East)';
      const discord = String(body.discord || '').trim();
      const contact = String(body.contact || '').trim();
      const email = String(body.email || '').trim();

      if (!nickname || !steamId || !discord || !email) {
        return res.status(400).json({
          error: 'Completa Nickname, Steam ID, Discord y correo para emitir tu ticket.',
        });
      }

      specificData = {
        nickname,
        steamId,
        mmr,
        primaryRole,
        secondaryRole,
        region,
        discord,
        contact,
        email,
      };
    } else {
      const nickname = String(body.nickname || '').trim();
      const discord = String(body.discord || '').trim();
      const email = String(body.email || '').trim();
      if (!nickname || !discord || !email) {
        return res.status(400).json({
          error: 'Ingresa tu Nickname, Discord y correo para enviar tu pase Supporter.',
        });
      }
      specificData = { nickname, discord, email };
    }

    const isInstantCard = paymentMethod === 'card';
    const operationRef = isInstantCard
      ? `CARD-${String(body.cardLast4 || '4242').slice(-4)}`
      : String(body.operationRef || '').trim();

    if (!isInstantCard && operationRef.length < 3) {
      return res.status(400).json({
        error: 'Ingresa el número de operación o referencia de pago para validarlo.',
      });
    }

    // Optional live Stripe Checkout integration if STRIPE_SECRET_KEY is provided
    if (isInstantCard && process.env.STRIPE_SECRET_KEY && body.useStripeRedirect) {
      const params = new URLSearchParams();
      params.append('mode', 'payment');
      params.append(
        'success_url',
        `${process.env.PUBLIC_URL || 'http://localhost:5173'}?checkout=success`
      );
      params.append(
        'cancel_url',
        `${process.env.PUBLIC_URL || 'http://localhost:5173'}?checkout=cancelled`
      );
      params.append('line_items[0][price_data][currency]', config.currency.toLowerCase());
      params.append('line_items[0][price_data][unit_amount]', String(Math.round(amountPaid * 100)));
      params.append(
        'line_items[0][price_data][product_data][name]',
        `${config.name} (${config.edition}) - ${type.toUpperCase()}`
      );
      params.append('line_items[0][quantity]', '1');

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      const stripeData = await stripeRes.json();
      if (!stripeRes.ok) {
        return res.status(502).json({
          error: stripeData?.error?.message || 'Error conectando con Stripe Checkout.',
        });
      }
      return res.status(200).json({ stripeCheckoutUrl: stripeData.url });
    }

    const now = new Date().toISOString();
    const ticketCode = generateTicketCode(type);
    const status = isInstantCard ? 'confirmed' : 'pending_verification';

    const newRecord = {
      id: `reg-${crypto.randomUUID().slice(0, 8)}`,
      type,
      ticketCode,
      status,
      checkedIn: false,
      isDemo: false,
      createdAt: now,
      paidAt: isInstantCard ? now : '',
      paymentMethod,
      operationRef,
      baseAmount,
      discountPercent,
      amountPaid,
      promoCode: promo.valid ? promo.code : '',
      receiptImageBase64,
      ...specificData,
    };

    store.registrations.unshift(newRecord);
    await writeStore(store);

    return res.status(201).json({
      ticket: newRecord,
      tournament: buildPublicPayload(store),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'No se pudo procesar el registro.' });
  }
});

app.get('/api/tickets/lookup', async (req, res) => {
  try {
    const query = String(req.query.query || '').trim().toLowerCase();
    if (!query || query.length < 3) {
      return res.status(400).json({ error: 'Ingresa tu código de ticket, Discord o correo.' });
    }
    const store = await readStore();
    const found = store.registrations.find(
      (r) =>
        r.ticketCode.toLowerCase() === query ||
        (r.email && r.email.toLowerCase() === query) ||
        (r.captainDiscord && r.captainDiscord.toLowerCase() === query) ||
        (r.discord && r.discord.toLowerCase() === query)
    );

    if (!found) {
      return res.status(404).json({ error: 'No encontramos un ticket con esos datos.' });
    }

    const nextMatch = store.bracket.find(
      (m) =>
        !m.winnerId &&
        (m.teamA?.id === found.id || m.teamB?.id === found.id)
    );

    return res.json({
      ticket: {
        id: found.id,
        type: found.type,
        ticketCode: found.ticketCode,
        status: found.status,
        checkedIn: Boolean(found.checkedIn),
        createdAt: found.createdAt,
        paidAt: found.paidAt,
        paymentMethod: found.paymentMethod,
        operationRef: found.operationRef,
        amountPaid: found.amountPaid,
        teamName: found.teamName,
        teamTag: found.teamTag,
        nickname: found.nickname,
        region: found.region,
        roster: found.roster,
      },
      nextMatch: nextMatch || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error consultando el ticket.' });
  }
});

app.post('/api/tickets/:ticketCode/checkin', async (req, res) => {
  try {
    const code = String(req.params.ticketCode || '').trim().toUpperCase();
    const store = await readStore();
    const record = store.registrations.find((r) => r.ticketCode.toUpperCase() === code);
    if (!record) {
      return res.status(404).json({ error: 'Ticket no encontrado.' });
    }
    if (record.status !== 'confirmed') {
      return res.status(400).json({
        error: 'Tu pago aún está en verificación. Una vez confirmado podrás hacer check-in.',
      });
    }
    record.checkedIn = true;
    await writeStore(store);
    return res.json({ ok: true, checkedIn: true, ticketCode: record.ticketCode });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error realizando check-in.' });
  }
});

// ---------------- ADMIN ENDPOINTS ----------------

app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body || {};
  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ error: 'PIN incorrecto.' });
  }
  return res.json({ ok: true });
});

app.get('/api/admin/overview', requireAdmin, async (_req, res) => {
  try {
    const store = await readStore();
    const { config, registrations, bracket, pastEditions } = store;

    const confirmed = registrations.filter((r) => r.status === 'confirmed');
    const pending = registrations.filter((r) => r.status === 'pending_verification');

    const grossConfirmedUSD = confirmed.reduce((acc, r) => acc + (Number(r.amountPaid) || 0), 0);
    const pendingUSD = pending.reduce((acc, r) => acc + (Number(r.amountPaid) || 0), 0);
    const prizePoolUSD = Number(config.prizePoolGuaranteed) || 0;
    const organizerNetUSD = Number((grossConfirmedUSD - prizePoolUSD).toFixed(2));

    res.json({
      config,
      registrations,
      bracket,
      pastEditions: pastEditions || [],
      finance: {
        grossConfirmedUSD: Number(grossConfirmedUSD.toFixed(2)),
        pendingUSD: Number(pendingUSD.toFixed(2)),
        prizePoolUSD,
        organizerNetUSD,
        confirmedCount: confirmed.length,
        pendingCount: pending.length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error cargando el panel administrativo.' });
  }
});

app.patch('/api/admin/registrations/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['confirmed', 'pending_verification', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido.' });
    }
    const store = await readStore();
    const record = store.registrations.find((r) => r.id === id);
    if (!record) return res.status(404).json({ error: 'Registro no encontrado.' });

    if (status === 'confirmed' && record.type === 'team' && record.status !== 'confirmed') {
      const confirmedTeams = store.registrations.filter(
        (r) => r.type === 'team' && r.status === 'confirmed'
      ).length;
      if (confirmedTeams >= Number(store.config.maxTeams)) {
        return res.status(409).json({
          error: 'No hay cupos libres. Aumenta maxTeams en Escalamiento antes de confirmar.',
        });
      }
    }

    record.status = status;
    if (status === 'confirmed' && !record.paidAt) {
      record.paidAt = new Date().toISOString();
    }
    await writeStore(store);
    return res.json({ ok: true, record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error actualizando el estado.' });
  }
});

app.delete('/api/admin/registrations/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const store = await readStore();
    store.registrations = store.registrations.filter((r) => r.id !== id);
    await writeStore(store);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error eliminando registro.' });
  }
});

app.post('/api/admin/free-agents/merge', requireAdmin, async (req, res) => {
  try {
    const { agentIds, teamName, teamTag } = req.body || {};
    if (!Array.isArray(agentIds) || agentIds.length !== 5) {
      return res.status(400).json({ error: 'Selecciona exactamente 5 Free Agents confirmados.' });
    }
    const store = await readStore();
    const agents = store.registrations.filter(
      (r) => agentIds.includes(r.id) && r.type === 'free_agent' && r.status === 'confirmed'
    );
    if (agents.length !== 5) {
      return res.status(400).json({ error: 'Todos los jugadores deben ser Free Agents confirmados.' });
    }
    const confirmedTeams = store.registrations.filter(
      (r) => r.type === 'team' && r.status === 'confirmed'
    ).length;
    if (confirmedTeams >= Number(store.config.maxTeams)) {
      return res.status(409).json({ error: 'Sin cupos de equipo disponibles.' });
    }

    const avgMmr = Math.round(agents.reduce((s, a) => s + (Number(a.mmr) || 3500), 0) / 5);
    const totalPaid = Number(agents.reduce((s, a) => s + (Number(a.amountPaid) || 0), 0).toFixed(2));
    const cleanTag = String(teamTag || 'MIX').trim().toUpperCase().slice(0, 5);
    const now = new Date().toISOString();

    const mergedTeam = {
      id: `reg-mix-${crypto.randomUUID().slice(0, 6)}`,
      type: 'team',
      ticketCode: generateTicketCode('team'),
      status: 'confirmed',
      checkedIn: false,
      isDemo: false,
      createdAt: now,
      paidAt: now,
      paymentMethod: 'free_agent_mix',
      operationRef: `MIX-${agents.map((a) => a.ticketCode.slice(-4)).join('/')}`,
      baseAmount: totalPaid,
      discountPercent: 0,
      amountPaid: totalPaid,
      promoCode: '',
      teamName: String(teamName || `Aegis Mix #${Math.floor(Math.random() * 90 + 10)}`).trim(),
      teamTag: cleanTag,
      region: store.config.region || 'Estados Unidos (US East)',
      avgMmr,
      captainDiscord: agents[0].discord,
      captainContact: agents[0].contact || '',
      email: agents[0].email,
      roster: agents.map((a, idx) => ({
        nickname: a.nickname,
        role: a.primaryRole || `Pos ${idx + 1}`,
        steamId: a.steamId,
      })),
      subPlayer: null,
      receiptImageBase64: '',
    };

    // Remove individual free-agent records (value preserved in mergedTeam) to prevent double-counting revenue
    store.registrations = store.registrations.filter((r) => !agentIds.includes(r.id));
    store.registrations.unshift(mergedTeam);
    await writeStore(store);

    return res.status(201).json({ ok: true, team: mergedTeam });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error armando el equipo mix.' });
  }
});

app.put('/api/admin/config', requireAdmin, async (req, res) => {
  try {
    const store = await readStore();
    const incoming = req.body || {};
    store.config = {
      ...store.config,
      ...incoming,
      maxTeams: Math.max(4, Math.min(64, Number(incoming.maxTeams ?? store.config.maxTeams))),
      teamTicketPrice: Math.max(0, Number(incoming.teamTicketPrice ?? store.config.teamTicketPrice)),
      freeAgentTicketPrice: Math.max(
        0,
        Number(incoming.freeAgentTicketPrice ?? store.config.freeAgentTicketPrice)
      ),
      supporterTicketPrice: Math.max(
        0,
        Number(incoming.supporterTicketPrice ?? store.config.supporterTicketPrice)
      ),
      prizePoolGuaranteed: Math.max(
        0,
        Number(incoming.prizePoolGuaranteed ?? store.config.prizePoolGuaranteed)
      ),
      paymentConfig: {
        ...store.config.paymentConfig,
        ...(incoming.paymentConfig || {}),
      },
      promoCodes: Array.isArray(incoming.promoCodes)
        ? incoming.promoCodes
        : store.config.promoCodes,
    };
    await writeStore(store);
    return res.json({ ok: true, config: store.config });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error guardando configuración.' });
  }
});

app.post('/api/admin/bracket/generate', requireAdmin, async (_req, res) => {
  try {
    const store = await readStore();
    const confirmedTeams = store.registrations.filter(
      (r) => r.type === 'team' && r.status === 'confirmed'
    );
    if (confirmedTeams.length < 2) {
      return res.status(400).json({
        error: 'Necesitas al menos 2 equipos confirmados para generar el bracket.',
      });
    }
    store.bracket = generateSingleElimBracket(confirmedTeams);
    await writeStore(store);
    return res.json({ ok: true, bracket: store.bracket });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error generando el bracket.' });
  }
});

app.patch('/api/admin/bracket/match/:matchId', requireAdmin, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId, scoreA, scoreB, scheduledTime, lobbyName } = req.body || {};
    const store = await readStore();
    const match = store.bracket.find((m) => m.id === matchId);
    if (!match) return res.status(404).json({ error: 'Serie no encontrada.' });

    if (scoreA !== undefined) match.scoreA = Number(scoreA) || 0;
    if (scoreB !== undefined) match.scoreB = Number(scoreB) || 0;
    if (scheduledTime !== undefined) match.scheduledTime = String(scheduledTime);
    if (lobbyName !== undefined) match.lobbyName = String(lobbyName);

    if (winnerId !== undefined) {
      match.winnerId = winnerId || null;
      if (winnerId) propagateWinner(store.bracket, match);
    }

    await writeStore(store);
    return res.json({ ok: true, bracket: store.bracket });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error actualizando el cruce.' });
  }
});

app.post('/api/admin/demo/clear', requireAdmin, async (_req, res) => {
  try {
    const store = await readStore();
    store.registrations = store.registrations.filter((r) => !r.isDemo);
    store.bracket = [];
    await writeStore(store);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error limpiando datos demo.' });
  }
});

app.post('/api/admin/demo/seed', requireAdmin, async (_req, res) => {
  try {
    const store = await readStore();
    const existingIds = new Set(store.registrations.map((r) => r.id));
    for (const demo of createDemoRecords()) {
      if (!existingIds.has(demo.id)) {
        store.registrations.push(demo);
      }
    }
    await writeStore(store);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error restaurando datos demo.' });
  }
});

app.post('/api/admin/edition/new', requireAdmin, async (req, res) => {
  try {
    const { newEditionLabel, newMaxTeams, newTicketPrice, newPrizePool, newDivisionLabel } =
      req.body || {};
    const store = await readStore();

    const confirmed = store.registrations.filter((r) => r.status === 'confirmed');
    const grossUSD = confirmed.reduce((s, r) => s + (Number(r.amountPaid) || 0), 0);
    const finalMatch = [...store.bracket].sort((a, b) => b.round - a.round)[0];
    const championTeam =
      finalMatch?.winnerId && finalMatch.teamA?.id === finalMatch.winnerId
        ? finalMatch.teamA.teamName
        : finalMatch?.winnerId && finalMatch.teamB?.id === finalMatch.winnerId
          ? finalMatch.teamB.teamName
          : 'Por definir';

    store.pastEditions.unshift({
      edition: store.config.edition,
      teamsCount: confirmed.filter((r) => r.type === 'team').length,
      grossUSD: Number(grossUSD.toFixed(2)),
      prizePoolUSD: store.config.prizePoolGuaranteed,
      champion: championTeam,
      archivedAt: new Date().toISOString(),
    });

    const nextNum = (store.pastEditions.length || 0) + 1;
    const baseCfg = createDefaultConfig();
    store.config = {
      ...store.config,
      id: `aegis-open-${nextNum}`,
      edition: newEditionLabel || `Edición #${nextNum}`,
      divisionLabel: newDivisionLabel || store.config.divisionLabel,
      maxTeams: Number(newMaxTeams) || store.config.maxTeams,
      teamTicketPrice: Number(newTicketPrice) || store.config.teamTicketPrice,
      prizePoolGuaranteed: Number(newPrizePool) || store.config.prizePoolGuaranteed,
      dateISO: baseCfg.dateISO,
      registrationOpen: true,
    };
    store.registrations = [];
    store.bracket = [];

    await writeStore(store);
    return res.json({ ok: true, config: store.config });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error iniciando nueva edición.' });
  }
});

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Aegis Open API running on http://localhost:${PORT}`);
});
