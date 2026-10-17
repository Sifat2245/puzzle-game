import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRoomCode,
  getInitialRoom,
  isValidRoomCode,
  normalizeRoomCode,
  roomLink,
  roomPeerId,
} from '../src/utils/rooms.js';
import { formatTimer, resultCaption } from '../src/utils/sharing.js';

test('fresh visits get different readable room codes', () => {
  const codes = Array.from({ length: 100 }, createRoomCode);
  assert.equal(new Set(codes).size, codes.length);
  codes.forEach((code) => assert.match(code, /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/));
  assert.notEqual(getInitialRoom('').code, getInitialRoom('').code);
});

test('invite links and refreshes keep the room instead of randomizing it', () => {
  assert.deepEqual(getInitialRoom('?room=abcd-2345'), { code: 'ABCD-2345', invited: true });
  assert.deepEqual(getInitialRoom('?room=SUN-48'), { code: 'SUN-48', invited: true });
  assert.equal(getInitialRoom('?room=---').invited, false);
});

test('room codes are normalized and invalid codes are rejected', () => {
  assert.equal(normalizeRoomCode('  abcd-2345! '), 'ABCD-2345');
  for (const code of ['', '-', 'AB', '-ABCD', 'ABCD-', 'AB--CD'])
    assert.equal(isValidRoomCode(code), false);
  assert.equal(isValidRoomCode('ABCD-2345'), true);
});

test('share links use this app and preserve other query parameters', () => {
  const link = roomLink('ABCD-2345', 'https://example.com/puzzle/?theme=dark&room=OLD#board');
  assert.equal(link, 'https://example.com/puzzle/?theme=dark&room=ABCD-2345');
  assert.equal(getInitialRoom(new URL(link).search).code, 'ABCD-2345');
});

test('different room codes do not collapse onto the same WebRTC identifier', () => {
  assert.notEqual(roomPeerId('ABC-D'), roomPeerId('AB-CD'));
  assert.equal(roomPeerId('abcd-2345'), roomPeerId('ABCD-2345'));
});

test('results show the frozen time and distinguish bot helpers from people', () => {
  const caption = resultCaption({
    title: 'Beach Sunrise',
    total: 24,
    elapsedSeconds: 125,
    players: [
      { name: 'Sam', isBot: false },
      { name: 'Maya', isBot: true },
    ],
  });
  assert.match(caption, /24 pieces in 2:05/);
  assert.match(caption, /1 player \+ 1 bot helper/);
  assert.match(caption, /Multiplayer Puzzle Game/);
  assert.equal(formatTimer(3605), '60:05');
});
