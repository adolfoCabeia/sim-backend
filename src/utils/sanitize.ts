import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitiza strings de entrada para prevenir XSS.
 * Remove scripts e conteúdo potencialmente perigoso mantendo tags seguras.
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

/**
 * Sanitiza input de texto simples.
 * Remove caracteres especiais perigosos.
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/[<>\"'`]/g, "")
    .substring(0, 500);
}

/**
 * Valida e sanitiza email.
 */
export function sanitizeEmail(input: string | null | undefined): string {
  if (!input) return "";
  const email = input.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Email inválido");
  }
  return email;
}

/**
 * Remove caracteres perigosos de URLs.
 */
export function sanitizeUrl(input: string | null | undefined): string {
  if (!input) return "";
  try {
    const url = new URL(input);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Protocolo inválido");
    }
    return url.toString();
  } catch {
    return "";
  }
}

/**
 * Sanitiza objeto recursivamente.
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    const value = sanitized[key];
    if (typeof value === "string") {
      sanitized[key] = sanitizeText(value) as any;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: unknown) =>
        typeof item === "string" ? sanitizeText(item) : item
      ) as any;
    }
  }
  return sanitized;
}