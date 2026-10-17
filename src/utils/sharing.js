export function formatTimer(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(value / 60);
  return `${minutes}:${String(value % 60).padStart(2, '0')}`;
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      /* Try the selection fallback when clipboard access is unavailable. */
    }
  }
  const field = document.createElement('textarea');
  field.value = text;
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('Clipboard unavailable');
}

export function resultCaption(result) {
  const humans = result.players.filter((player) => !player.isBot).length;
  const bots = result.players.filter((player) => player.isBot).length;
  return `We did it! 🧩 ${result.title} — ${result.total} pieces in ${formatTimer(result.elapsedSeconds)}. ${humans} player${humans === 1 ? '' : 's'}${bots ? ` + ${bots} bot helper${bots === 1 ? '' : 's'}` : ''}. Can you beat our time?\nMultiplayer Puzzle Game`;
}
