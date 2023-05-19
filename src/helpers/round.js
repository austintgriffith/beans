export function round(number, decimals) {
  const d = Math.pow(10, decimals);
  return (Math.round((number + Number.EPSILON) * d) / d).toFixed(decimals);
}
