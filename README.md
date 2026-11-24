# Aegis Open — Plataforma de Torneo y Venta de Tickets Dota 2

Sitio web completo para gestionar, monetizar y escalar **Aegis Open**, comenzando con un torneo comunitario sencillo (16 equipos) y escalando a múltiples ediciones, ligas por MMR y 32–64 equipos.

## Qué incluye

- **Landing y Venta de Tickets (`/`):**
  - Compra de **Ticket de Equipo 5v5** (con roster de 5 titulares + suplente opcional).
  - Compra de **Ticket Individual / Free Agent** (para jugadores sin stack completo).
  - Compra de **Pase Supporter VIP** (sorteos/Discord VIP sin paywall de transmisión, cumpliendo la *Limited Game Tournament License* de Valve).
  - **Métodos de pago:** Tarjeta (confirmación automática en modo local o **Stripe Checkout** real configurando `.env`), **Yape / Plin**, **Transferencia Bancaria**, **PayPal** y **USDT TRC20** con subida de comprobante.
  - **Cupones de descuento:** Incluye `AEGIS10` (-10%) y `FOUNDER25` (-25%) editables en el panel.
  - **Ticket Digital + Consulta y Check-in (`Mi Ticket`):** Código único (`AEG-T-XXXX`), código QR visual y botón de Check-in previo a las partidas.
  - **Bracket Interactivo y Lista de Equipos en Vivo.**

- **Panel de Organizador y Escalamiento (`Organizador`):**
  - **PIN por defecto:** `aegis2026` (cámbialo creando `.env` con `ADMIN_PIN=...`).
  - **Finanzas en tiempo real:** Ingresos confirmados, pagos pendientes de verificación, prize pool comprometido y balance neto del organizador.
  - **Verificación de pagos:** Inspección visual de comprobantes subidos y aprobación/rechazo en 1 clic.
  - **Armador de Mix:** Selecciona 5 Free Agents confirmados y conviértelos en un equipo oficial del bracket.
  - **Gestor de Bracket:** Sorteo automático con BYEs, marcadores, horarios, nombres de lobby y avance automático de rondas.
  - **Simulador y Configuración de Escalamiento:** Edita precios, cupos (`8 / 16 / 32 / 64`), división MMR, cuentas de cobro, cupones y archiva ediciones pasadas para abrir nuevas temporadas.

## Cómo ejecutarlo localmente

```bash
# 1. Instalar dependencias (si aún no están instaladas)
npm install

# 2. (Opcional) Crear archivo de entorno para cambiar PIN o activar Stripe real
copy .env.example .env

# 3. Iniciar API + Web en desarrollo (http://localhost:5173)
npm run dev
```

Para correr en modo producción desde un solo puerto (`http://localhost:3001`):

```bash
npm run build
npm start
```

## Preparar para torneo real

1. Entra a **Organizador** con el PIN (`aegis2026`).
2. En **Pagos y Registros**, presiona **Limpiar datos demo** para borrar los 4 equipos de muestra.
3. En **Escalamiento y Precios**, actualiza tu número de **Yape / Plin**, cuenta bancaria o **PayPal / USDT**, la fecha real y precios.
4. Registra tu licencia gratuita en [Steam Game Tournament Licenses](https://store.steampowered.com/tourney/).
