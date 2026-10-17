import { bnNumber, formatDuration, SITE_NAME, SITE_TAGLINE } from './bangla.js';

export function formatTimer(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(value / 60);
  return bnNumber(`${minutes}:${String(value % 60).padStart(2, '0')}`);
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
  return `জীবন এলোমেলো? পাজল তো মিলল! 🧩\n“${result.title}” পাজলের ${bnNumber(result.total)} টুকরো মিলিয়েছি ${formatDuration(result.elapsedSeconds)} সময়ে।\nদলে ${bnNumber(humans)} জন খেলোয়াড়${bots ? ` আর ${bnNumber(bots)}টি সাহায্যকারী বট` : ''}।\nএবার আপনার পালা—আমাদের সময়কে হারাতে পারবেন?\n${SITE_TAGLINE}\n${SITE_NAME}`;
}
