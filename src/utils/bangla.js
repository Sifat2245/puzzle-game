export const SITE_NAME = 'মাল্টিপ্লেয়ার পাজল গেম';
export const SITE_TAGLINE = 'জীবনের পাজল না মিললেও গেমের পাজল মিলবে।';

export function bnNumber(value) {
  return String(value).replace(/[0-9]/g, (digit) => '০১২৩৪৫৬৭৮৯'[Number(digit)]);
}

export function formatDuration(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(value / 60);
  const remainder = value % 60;
  return minutes
    ? `${bnNumber(minutes)} মিনিট${remainder ? ` ${bnNumber(remainder)} সেকেন্ড` : ''}`
    : `${bnNumber(remainder)} সেকেন্ড`;
}

export function resultAchievement(result) {
  const humans = result.players.filter((player) => !player.isBot).length;
  if (humans > 1) return 'দল বেঁধে বাজিমাত!';
  if (result.players.some((player) => player.isBot)) return 'বন্ধু বট, পাজল ঝটপট!';
  return 'একাই একশো!';
}
