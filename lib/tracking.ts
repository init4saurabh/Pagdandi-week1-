export function clampVisibleSeconds(elapsedSeconds: number, visibleSeconds: number) {
  return Math.max(0, Math.min(Math.round(elapsedSeconds), Math.round(visibleSeconds)));
}

export function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (minutes === 0) return `${seconds} sec`;
  return seconds ? `${minutes} min ${seconds} sec` : `${minutes} min`;
}
