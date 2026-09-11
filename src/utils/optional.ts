export function omitUndefined<T extends Record<string, unknown>>(
  obj: T
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  const resultado: Record<string, unknown> = {};
  for (const chave of Object.keys(obj)) {
    const valor = obj[chave];
    if (valor !== undefined) {
      resultado[chave] = valor;
    }
  }
  return resultado as { [K in keyof T]?: Exclude<T[K], undefined> };
}

export function undefinedToNull<T>(value: T | undefined): T | null {
  return value ?? null;
}