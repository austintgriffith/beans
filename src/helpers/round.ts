export function round(number: number, decimals = 3): number {
  const d = Math.pow(10, decimals);
  return Math.round((number + Number.EPSILON) * d) / d;
}
