import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

function getUpcomingSaturdayISO() {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilSat = (6 - day + 7) % 7 || 7;
  const target = new Date(now.getTime() + daysUntilSat * 24 * 60 * 60 * 1000);
  target.setUTCHours(22, 0, 0, 0); // 17:00 UTC-5 (Peru/Colombia/Lima)
  return target.toISOString();
}

export function createDefaultConfig() {
  return {
    id: 'aegis-open-1',
    name: 'Aegis Open',
    edition: 'Edición #1',
    tagline: 'Torneo Comunitario 5v5 · Captains Mode',
    divisionLabel: 'División Abierta · Todos los rangos',
    dateISO: getUpcomingSaturdayISO(),
    region: 'Estados Unidos (US East)',
    format: 'Eliminación Directa · BO1 (Final BO3)',
    maxTeams: 16,
    teamTicketPrice: 20,
    freeAgentTicketPrice: 5,
    supporterTicketPrice: 8,
    currency: 'USD',
    prizePoolGuaranteed: 200,
    prizeSplit: [
      { place: '1.º Lugar', share: 0.7, label: 'Campeón Aegis' },
      { place: '2.º Lugar', share: 0.3, label: 'Subcampeón' },
    ],
    registrationOpen: true,
    streamUrl: 'https://twitch.tv/aegisopen',
    discordUrl: 'https://discord.gg/aegis-open',
    paymentConfig: {
      cardEnabled: true,
      transferEnabled: true,
      yapePlinNumber: '+51 999 000 123',
      yapePlinHolder: 'Aegis Open Esports (Configurar en Admin)',
      bankAccount: 'BCP / Interbank · CCI 002-194-000000000000-99',
      paypalEmail: 'pagos@aegisopen.example',
      cryptoAddress: 'USDT TRC20 · TDemoAegisOpenWallet001',
    },
    promoCodes: [
      { code: 'AEGIS10', discountPercent: 10, active: true },
      { code: 'FOUNDER25', discountPercent: 25, active: true },
    ],
  };
}

export function createDemoRecords() {
  const now = new Date().toISOString();
  return [
    {
      id: 'reg-demo-1',
      type: 'team',
      ticketCode: 'AEG-T-1042',
      status: 'confirmed',
      checkedIn: true,
      isDemo: true,
      createdAt: now,
      paidAt: now,
      paymentMethod: 'card',
      operationRef: 'CARD-4242',
      baseAmount: 20,
      discountPercent: 0,
      amountPaid: 20,
      promoCode: '',
      teamName: 'Dire Wolves',
      teamTag: 'DW',
      region: 'Estados Unidos (US East)',
      avgMmr: 5400,
      captainDiscord: 'fenrir_dota#0001',
      captainContact: '+51 987 111 222',
      email: 'fenrir@direwolves.example',
      roster: [
        { nickname: 'Fenrir', role: 'Pos 1 · Carry', steamId: '104928112' },
        { nickname: 'Vexx', role: 'Pos 2 · Mid', steamId: '109283741' },
        { nickname: 'Stonewall', role: 'Pos 3 · Offlane', steamId: '209481723' },
        { nickname: 'Lumen', role: 'Pos 4 · Soft Support', steamId: '301928374' },
        { nickname: 'Warden', role: 'Pos 5 · Hard Support', steamId: '401928311' },
      ],
      subPlayer: { nickname: 'AetherSub', steamId: '501928300' },
      receiptImageBase64: '',
    },
    {
      id: 'reg-demo-2',
      type: 'team',
      ticketCode: 'AEG-T-2189',
      status: 'confirmed',
      checkedIn: true,
      isDemo: true,
      createdAt: now,
      paidAt: now,
      paymentMethod: 'yape_plin',
      operationRef: 'YAPE-889120',
      baseAmount: 20,
      discountPercent: 10,
      amountPaid: 18,
      promoCode: 'AEGIS10',
      teamName: 'Andes Five',
      teamTag: 'AND5',
      region: 'Estados Unidos (US East)',
      avgMmr: 4850,
      captainDiscord: 'intikun#4410',
      captainContact: '+51 944 555 888',
      email: 'inti@andesfive.example',
      roster: [
        { nickname: 'IntiKun', role: 'Pos 1 · Carry', steamId: '112233445' },
        { nickname: 'QoriMid', role: 'Pos 2 · Mid', steamId: '223344556' },
        { nickname: 'Tambo', role: 'Pos 3 · Offlane', steamId: '334455667' },
        { nickname: 'Puma4', role: 'Pos 4 · Soft Support', steamId: '445566778' },
        { nickname: 'Condor', role: 'Pos 5 · Hard Support', steamId: '556677889' },
      ],
      subPlayer: null,
      receiptImageBase64: '',
    },
    {
      id: 'reg-demo-3',
      type: 'team',
      ticketCode: 'AEG-T-3310',
      status: 'confirmed',
      checkedIn: false,
      isDemo: true,
      createdAt: now,
      paidAt: now,
      paymentMethod: 'card',
      operationRef: 'CARD-8811',
      baseAmount: 20,
      discountPercent: 0,
      amountPaid: 20,
      promoCode: '',
      teamName: 'Roshan Busters',
      teamTag: 'ROSH',
      region: 'Estados Unidos (US East)',
      avgMmr: 5120,
      captainDiscord: 'aegis_kuro#9012',
      captainContact: '+57 310 222 3344',
      email: 'kuro@roshanbusters.example',
      roster: [
        { nickname: 'Kuro', role: 'Pos 1 · Carry', steamId: '667788990' },
        { nickname: 'Valkyr', role: 'Pos 2 · Mid', steamId: '778899001' },
        { nickname: 'Brute', role: 'Pos 3 · Offlane', steamId: '889900112' },
        { nickname: 'Mirage', role: 'Pos 4 · Soft Support', steamId: '990011223' },
        { nickname: 'Oracle5', role: 'Pos 5 · Hard Support', steamId: '101112131' },
      ],
      subPlayer: null,
      receiptImageBase64: '',
    },
    {
      id: 'reg-demo-4',
      type: 'team',
      ticketCode: 'AEG-T-4495',
      status: 'pending_verification',
      checkedIn: false,
      isDemo: true,
      createdAt: now,
      paidAt: '',
      paymentMethod: 'yape_plin',
      operationRef: 'PLIN-402918',
      baseAmount: 20,
      discountPercent: 0,
      amountPaid: 20,
      promoCode: '',
      teamName: 'Crimson Tide',
      teamTag: 'CTD',
      region: 'Estados Unidos (US East)',
      avgMmr: 4300,
      captainDiscord: 'sombra_cl#7721',
      captainContact: '+56 9 8811 2233',
      email: 'sombra@crimsontide.example',
      roster: [
        { nickname: 'Sombra', role: 'Pos 1 · Carry', steamId: '212223242' },
        { nickname: 'Nox', role: 'Pos 2 · Mid', steamId: '313233343' },
        { nickname: 'Titan', role: 'Pos 3 · Offlane', steamId: '414243444' },
        { nickname: 'Bane4', role: 'Pos 4 · Soft Support', steamId: '515253545' },
        { nickname: 'Dazzle5', role: 'Pos 5 · Hard Support', steamId: '616263646' },
      ],
      subPlayer: null,
      receiptImageBase64: '',
    },
    {
      id: 'reg-demo-fa-1',
      type: 'free_agent',
      ticketCode: 'AEG-F-7102',
      status: 'confirmed',
      checkedIn: true,
      isDemo: true,
      createdAt: now,
      paidAt: now,
      paymentMethod: 'card',
      operationRef: 'CARD-4242',
      baseAmount: 5,
      discountPercent: 0,
      amountPaid: 5,
      promoCode: '',
      nickname: 'KaelV',
      steamId: '718293041',
      mmr: 4600,
      primaryRole: 'Pos 2 · Mid',
      secondaryRole: 'Pos 1 · Carry',
      region: 'Estados Unidos (US East)',
      discord: 'kaelv_mid#2110',
      contact: '+51 912 345 678',
      email: 'kaelv@player.example',
      receiptImageBase64: '',
    },
    {
      id: 'reg-demo-fa-2',
      type: 'free_agent',
      ticketCode: 'AEG-F-7108',
      status: 'confirmed',
      checkedIn: false,
      isDemo: true,
      createdAt: now,
      paidAt: now,
      paymentMethod: 'yape_plin',
      operationRef: 'YAPE-301992',
      baseAmount: 5,
      discountPercent: 0,
      amountPaid: 5,
      promoCode: '',
      nickname: 'SupportDiff',
      steamId: '819203941',
      mmr: 4400,
      primaryRole: 'Pos 5 · Hard Support',
      secondaryRole: 'Pos 4 · Soft Support',
      region: 'Estados Unidos (US East)',
      discord: 'supportdiff#5501',
      contact: '+51 981 222 900',
      email: 'supportdiff@player.example',
      receiptImageBase64: '',
    },
    {
      id: 'reg-demo-sup-1',
      type: 'supporter',
      ticketCode: 'AEG-S-9011',
      status: 'confirmed',
      checkedIn: true,
      isDemo: true,
      createdAt: now,
      paidAt: now,
      paymentMethod: 'card',
      operationRef: 'CARD-1010',
      baseAmount: 8,
      discountPercent: 0,
      amountPaid: 8,
      promoCode: '',
      nickname: 'MidasFan',
      discord: 'midasfan#0042',
      email: 'midasfan@supporter.example',
      receiptImageBase64: '',
    },
  ];
}

export function createInitialStore() {
  return {
    config: createDefaultConfig(),
    registrations: createDemoRecords(),
    bracket: [],
    pastEditions: [],
  };
}

let writeQueue = Promise.resolve();

export async function readStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      config: { ...createDefaultConfig(), ...(parsed.config || {}) },
      registrations: Array.isArray(parsed.registrations) ? parsed.registrations : [],
      bracket: Array.isArray(parsed.bracket) ? parsed.bracket : [],
      pastEditions: Array.isArray(parsed.pastEditions) ? parsed.pastEditions : [],
    };
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      const initial = createInitialStore();
      await writeStore(initial);
      return initial;
    }
    throw err;
  }
}

export async function writeStore(data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  writeQueue = writeQueue.then(async () => {
    const tmpPath = `${STORE_PATH}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmpPath, STORE_PATH);
  });
  return writeQueue;
}
