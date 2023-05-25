export function round(number: number, decimals = 3) {
  const d = Math.pow(10, decimals);
  return (Math.round((number + Number.EPSILON) * d) / d).toFixed(decimals);
}
