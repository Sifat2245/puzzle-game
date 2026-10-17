const { setup, launch, state, point, mouseDrag, loosePiece, assert } = require('./harness.cjs');
const { readFileSync } = require('node:fs');

async function waitState(page, predicate, timeout = 15000) {
  const until = Date.now() + timeout;
  let current;
  while (Date.now() < until) {
    current = await state(page);
    if (predicate(current)) return current;
    await page.waitForTimeout(100);
  }
  throw new Error('Gameplay condition failed: ' + JSON.stringify(current));
}

async function touchDrag(cdp, from, to, cancel = false) {
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ id: 1, x: from.x, y: from.y, radiusX: 8, radiusY: 8 }],
  });
  for (let index = 1; index <= 15; index++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        {
          id: 1,
          x: from.x + ((to.x - from.x) * index) / 15,
          y: from.y + ((to.y - from.y) * index) / 15,
          radiusX: 8,
          radiusY: 8,
        },
      ],
    });
    await new Promise((resolve) => setTimeout(resolve, 12));
  }
  await cdp.send('Input.dispatchTouchEvent', {
    type: cancel ? 'touchCancel' : 'touchEnd',
    touchPoints: [],
  });
}

(async () => {
  const h = await setup();
  try {
    const desktop = await h.context({ permissions: ['clipboard-read', 'clipboard-write'] });
    const host = await desktop.newPage();
    await launch(host, { bots: 0, pieces: 24, path: '/contact-us' });
    assert.equal(await host.locator('html').getAttribute('lang'), 'bn');
    assert.match(await host.title(), /মাল্টিপ্লেয়ার পাজল/);
    let s = await state(host);
    const initialPiece = loosePiece(s);
    const origin = point(s, initialPiece);
    await host.mouse.move(origin.x, origin.y);
    await host.mouse.down();
    await host.mouse.move(origin.x + 45, origin.y + 20, { steps: 10 });
    let during = await state(host);
    assert.equal(during.active, initialPiece.id);
    const drawCount = during.draws;
    await host.waitForTimeout(250);
    assert(
      (await state(host)).draws > drawCount + 100,
      'the canvas keeps rendering while a piece is held',
    );
    await host.mouse.up();
    assert.notEqual((await state(host)).pieces[initialPiece.id].x, initialPiece.x);
    console.log('PASS: real mouse dragging moves the piece and does not stop the renderer');
    const beforeWheel = await state(host);
    await host.mouse.move(
      beforeWheel.rect.width / 2,
      beforeWheel.rect.y + beforeWheel.rect.height / 2,
    );
    await host.mouse.wheel(0, -100);
    await host.waitForTimeout(100);
    assert((await state(host)).camZoom > beforeWheel.camZoom, 'the mouse wheel zooms the board');
    await host.getByTitle('সব টুকরো একসঙ্গে দেখুন', { exact: true }).click();

    s = await state(host);
    let pair;
    findPair: for (const a of [...s.drawOrder].reverse().map((id) => s.pieces[id]))
      for (const b of s.pieces) {
        if (Math.abs(a.r - b.r) + Math.abs(a.c - b.c) !== 1) continue;
        const candidate = {
          ...a,
          x: b.x + (a.c - b.c) * s.pieceW,
          y: b.y + (a.r - b.r) * s.pieceH,
        };
        const target = point(s, candidate);
        if (
          target.x > 25 &&
          target.x < s.rect.width - 25 &&
          target.y > s.rect.y + 25 &&
          target.y < s.rect.y + s.rect.height - 70
        ) {
          pair = { a, b, target };
          break findPair;
        }
      }
    assert(pair);
    await mouseDrag(host, pair.a.id, pair.target);
    s = await state(host);
    assert.equal(
      s.pieces[pair.a.id].groupId,
      s.pieces[pair.b.id].groupId,
      'matching neighbors connect without a hint',
    );
    await mouseDrag(host, pair.a.id, point(s, s.pieces[pair.a.id], true));
    s = await state(host);
    assert(
      s.pieces[pair.a.id].inPlace && s.pieces[pair.b.id].inPlace,
      'the connected group can be dragged into the frame',
    );
    console.log('PASS: matching pieces snap together and the assembled group moves as one');

    const guestContext = await h.context();
    await guestContext.addInitScript(() => {
      Object.defineProperty(navigator, 'canShare', {
        value: (data) => Boolean(data.files?.length),
        configurable: true,
      });
      Object.defineProperty(navigator, 'share', {
        value: async (data) => {
          window.sharedResult = {
            text: data.text,
            files: data.files?.map((file) => ({
              name: file.name,
              type: file.type,
              size: file.size,
            })),
          };
        },
        configurable: true,
      });
    });
    const guest = await guestContext.newPage();
    await guest.goto(host.url());
    await guest.getByText(/^রুমে যুক্ত আছেন: /).waitFor();
    await guest.getByRole('button', { name: 'পাজলে যোগ দিন', exact: true }).first().click();
    await guest.waitForFunction(() => window.__puzzleGame?.gameRef.current.pieces.length > 0);
    const free = loosePiece(await state(guest));
    const gs = await state(guest),
      from = point(gs, free),
      to = point(gs, free, true);
    await guest.mouse.move(from.x, from.y);
    await guest.mouse.down();
    await guest.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 10 });
    const held = await state(guest);
    assert.equal(
      held.active,
      free.id,
      `The intended piece must be held: ${JSON.stringify({ free, active: held.active, from, to, rect: held.rect })}`,
    );
    await guest.waitForTimeout(1300);
    const afterSnapshot = await state(guest);
    assert(
      Math.abs(afterSnapshot.pieces[free.id].x - held.pieces[free.id].x) < 0.1,
      'host snapshots do not pull a held piece away: ' +
        JSON.stringify({
          held: held.pieces[free.id],
          after: afterSnapshot.pieces[free.id],
          active: afterSnapshot.active,
          camBefore: [held.camX, held.camY, held.camZoom],
          camAfter: [afterSnapshot.camX, afterSnapshot.camY, afterSnapshot.camZoom],
        }),
    );
    await guest.mouse.move(to.x, to.y, { steps: 10 });
    await guest.mouse.up();
    await waitState(host, (s) => s.pieces[free.id].inPlace);
    console.log('PASS: a second player can drag and snap over WebRTC without snapshot snap-back');

    // Complete the entire game through real drags, never through a hint or direct state writes.
    for (let index = 0; index < 30; index++) {
      s = await state(host);
      if (s.completed) break;
      const piece = loosePiece(s);
      if (!piece) break;
      await mouseDrag(host, piece.id, point(s, piece, true));
    }
    assert((await state(host)).completed, JSON.stringify(await state(host)));
    await host.getByRole('dialog', { name: /পাজল তো মিলল/ }).waitFor();
    await host.getByRole('img', { name: /^জয়ের কার্ড/ }).waitFor();
    await host.screenshot({ path: '/tmp/puzzle-bangla-result-desktop.png' });
    const downloadPromise = host.waitForEvent('download');
    await host.getByRole('button', { name: 'ছবি নামান', exact: true }).click();
    const download = await downloadPromise;
    await download.saveAs('/tmp/puzzle-bangla-result.png');
    assert.equal(download.suggestedFilename(), 'পাজল-মিলেছে.png');
    const png = readFileSync('/tmp/puzzle-bangla-result.png');
    assert.equal(png.readUInt32BE(16), 1080);
    assert.equal(png.readUInt32BE(20), 1350);
    await host.getByRole('button', { name: 'ফলাফল কপি', exact: true }).click();
    const caption = await host.evaluate(() => navigator.clipboard.readText());
    assert(caption.includes('জীবনের পাজল না মিললেও গেমের পাজল মিলবে।'));
    assert(!caption.includes('room='));
    await guest.getByRole('img', { name: /^জয়ের কার্ড/ }).waitFor();
    await guest.getByRole('button', { name: 'এই জয় শেয়ার করুন', exact: true }).click();
    const shared = await guest.evaluate(() => window.sharedResult);
    assert.equal(shared.files[0].type, 'image/png');
    assert(shared.text.includes('পাজল তো মিলল!'));
    await host.setViewportSize({ width: 390, height: 844 });
    await host.screenshot({ path: '/tmp/puzzle-bangla-result-mobile.png' });
    console.log('PASS: Bengali fonts, result-card PNG, caption, and native image sharing');
    console.log('PASS: an entire puzzle can be finished using mouse drags');
    await desktop.close();
    await guestContext.close();

    const mobileContext = await h.context({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const mobile = await mobileContext.newPage();
    await mobile.addInitScript(() =>
      Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true }),
    );
    await launch(mobile, { bots: 0, pieces: 48 });
    s = await state(mobile);
    for (const piece of s.pieces) {
      const p = point(s, piece);
      assert(
        p.x >= 0 && p.x <= 390 && p.y >= s.rect.y && p.y <= s.rect.y + s.rect.height - 50,
        'all piece centers fit on the phone',
      );
    }
    const clipped = await mobile.evaluate(() =>
      [...document.querySelectorAll('.game-toolbar button')]
        .filter((el) => el.getClientRects().length)
        .some((el) => {
          const r = el.getBoundingClientRect();
          return r.left < 0 || r.right > innerWidth;
        }),
    );
    assert(!clipped, 'mobile toolbar buttons stay on screen');
    const cdp = await mobileContext.newCDPSession(mobile);
    const piece = loosePiece(s);
    await touchDrag(cdp, point(s, piece), point(s, piece, true));
    assert(
      (await state(mobile)).pieces[piece.id].inPlace,
      'a real touch drag snaps into the frame',
    );
    console.log(
      'PASS: mobile layout fits the pieces and touch dragging snaps correctly at 2× pixel density',
    );

    s = await state(mobile);
    const zoomBefore = s.camZoom;
    const center = { x: 195, y: s.rect.y + s.rect.height / 2 };
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { id: 1, x: center.x - 35, y: center.y },
        { id: 2, x: center.x + 35, y: center.y },
      ],
    });
    for (let i = 1; i <= 10; i++)
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          { id: 1, x: center.x - 35 - i * 5, y: center.y },
          { id: 2, x: center.x + 35 + i * 5, y: center.y },
        ],
      });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert((await state(mobile)).camZoom > zoomBefore * 1.5, 'two-finger pinch zooms the table');
    await mobile.getByTitle('সব টুকরো একসঙ্গে দেখুন', { exact: true }).tap();
    s = await state(mobile);
    const loose = loosePiece(s);
    const p = point(s, loose);
    await touchDrag(cdp, p, { x: p.x + 20, y: p.y + 15 }, true);
    const cancelled = await state(mobile);
    assert.equal(cancelled.active, undefined);
    assert(cancelled.pieces.every((p) => !p.lockedBy));
    await mobile.setViewportSize({ width: 844, height: 390 });
    await mobile.waitForTimeout(150);
    assert((await state(mobile)).rect.width === 844);
    await mobile.screenshot({ path: '/tmp/puzzle-playable-mobile-landscape.png' });
    await mobile.setViewportSize({ width: 390, height: 844 });
    await mobile.waitForTimeout(150);
    await mobile.screenshot({ path: '/tmp/puzzle-playable-mobile.png' });
    for (const width of [320, 390, 768, 1024, 1280, 1440, 1920]) {
      await mobile.setViewportSize({ width, height: 844 });
      await mobile.waitForTimeout(80);
      const clipped = await mobile.evaluate(() =>
        [...document.querySelectorAll('.game-toolbar button')]
          .filter((element) => element.getClientRects().length)
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.left < -1 || rect.right > innerWidth + 1;
          })
          .map((element) => element.title),
      );
      assert.deepEqual(clipped, [], 'toolbar controls are reachable at width ' + width);
    }
    console.log('PASS: pinch zoom, cancelled touches, rotation, and controls at 320–1920px');
    await mobileContext.close();

    const botsContext = await h.context();
    const botPage = await botsContext.newPage();
    await launch(botPage, { bots: 4, pieces: 24 });
    await waitState(
      botPage,
      (s) => s.progress.connected > 0 && s.bots.some((bot) => bot.score > 0),
      12000,
    );
    let botState = await state(botPage);
    const frames = botState.draws;
    await botPage.waitForTimeout(400);
    assert((await state(botPage)).draws > frames + 100);
    await waitState(botPage, (s) => s.completed, 60000);
    await botPage.getByRole('dialog', { name: /পাজল তো মিলল/ }).waitFor();
    console.log('PASS: bots visibly move pieces and solve a full puzzle without hints');
    await botPage.getByRole('button', { name: 'ফলাফল বন্ধ করুন', exact: true }).click();
    await botPage.getByTitle('শুরুর পাতায় যান বা পাজল বদলান', { exact: true }).click();
    await botPage.locator('#bot-count').focus();
    await botPage.locator('#bot-count').press('Home');
    for (const id of ['doraemon', 'shinchan', 'pokemon']) {
      await botPage.getByTestId(`puzzle-${id}`).click();
      await botPage.getByRole('button', { name: 'চলুন, মেলানো যাক!', exact: true }).click();
      await waitState(
        botPage,
        (current) => current.imageSrc === `/puzzles/${id}.png` && current.pieces.length > 0,
      );
      const current = await state(botPage);
      const piece = loosePiece(current);
      await mouseDrag(botPage, piece.id, point(current, piece, true));
      assert((await state(botPage)).pieces[piece.id].inPlace);
      await botPage.getByTitle('শুরুর পাতায় যান বা পাজল বদলান', { exact: true }).click();
    }
    await botPage.screenshot({ path: '/tmp/puzzle-bangla-home.png' });
    console.log('PASS: all four character puzzles load and support actual dragging');
    assert.deepEqual(h.errors, [], 'there are no browser runtime errors');
    console.log('PASS: no runtime errors during mouse, touch, multiplayer, or bot play');
  } finally {
    await h.close();
  }
})()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
