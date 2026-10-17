import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { bnNumber, formatDuration, resultAchievement, SITE_TAGLINE } from '../src/utils/bangla.js';
import { PUZZLE_CATALOG } from '../src/data/puzzles.js';

test('display numbers and durations use Bangla digits', () => {
  assert.equal(bnNumber('24/48 (50%)'), '২৪/৪৮ (৫০%)');
  assert.equal(formatDuration(5), '৫ সেকেন্ড');
  assert.equal(formatDuration(125), '২ মিনিট ৫ সেকেন্ড');
  assert.equal(formatDuration(120), '২ মিনিট');
  assert.match(SITE_TAGLINE, /জীবনের পাজল না মিললেও/);
});

test('the character catalog replaces the landscape puzzles with usable local images', () => {
  assert.deepEqual(
    PUZZLE_CATALOG.map((puzzle) => puzzle.id),
    ['spider-man', 'doraemon', 'shinchan', 'pokemon'],
  );
  for (const puzzle of PUZZLE_CATALOG) {
    assert.match(puzzle.title, /[\u0980-\u09ff]/);
    const file = new URL(`../public${puzzle.src}`, import.meta.url);
    assert(existsSync(file));
    const png = readFileSync(file);
    assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert(png.readUInt32BE(16) > 100 && png.readUInt32BE(20) > 100);
  }
});

test('result achievements reflect the actual team', () => {
  assert.equal(resultAchievement({ players: [{ isBot: false }] }), 'একাই একশো!');
  assert.equal(
    resultAchievement({ players: [{ isBot: false }, { isBot: true }] }),
    'বন্ধু বট, পাজল ঝটপট!',
  );
  assert.equal(
    resultAchievement({ players: [{ isBot: false }, { isBot: false }] }),
    'দল বেঁধে বাজিমাত!',
  );
});
