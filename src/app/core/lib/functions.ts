/**
 * Crea un id unico
 * @param a sufix
 * @returns Devuelve un id unico
 */
export function uniqid(a = ''): string {
  const c = Date.now() / 1000;
  let d = c.toString(16).split('.').join('');
  while (d.length < 14) {
    d += '0';
  }
  return a + d + Math.round(Math.random() * 100000000);
}
