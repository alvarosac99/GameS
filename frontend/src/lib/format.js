export function formatHoras(segundos) {
  if (segundos == null) return "N/A";
  return `${(segundos / 3600).toFixed(1)}h`;
}
