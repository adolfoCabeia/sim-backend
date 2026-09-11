type UnidadeTempo = "s" | "m" | "h" | "d";

const MULTIPLICADORES_MS: Record<UnidadeTempo, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Formato de expiração inválido: ${expiry}`);
  const [, value, unit] = match;

  if (!value || !unit) {
    throw new Error(`Formato de expiração inválido: ${expiry}`);
  }

  return Number(value) * MULTIPLICADORES_MS[unit as UnidadeTempo];
}

export function parseExpiryToSeconds(expiry: string): number {
  return Math.floor(parseExpiryToMs(expiry) / 1000);
}