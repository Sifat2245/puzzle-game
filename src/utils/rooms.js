const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// getRandomValues also works when a phone opens the dev site over local HTTP.
export function createGameId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export function createRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const code = Array.from(bytes, (byte) => ROOM_ALPHABET[byte % ROOM_ALPHABET.length]).join('');
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function normalizeRoomCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 18);
}

export function isValidRoomCode(value) {
  return value.length >= 3 && value.length <= 18 && /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(value);
}

export function getInitialRoom(search = window.location.search) {
  const code = normalizeRoomCode(new URLSearchParams(search).get('room'));
  const invited = isValidRoomCode(code);
  return { code: invited ? code : createRoomCode(), invited };
}

export function roomLink(code, href = window.location.href) {
  const url = new URL(href);
  url.searchParams.set('room', normalizeRoomCode(code));
  url.hash = '';
  return url.toString();
}

export function roomPeerId(code) {
  return `multiplayer-puzzle-${normalizeRoomCode(code).toLowerCase()}-host`;
}
