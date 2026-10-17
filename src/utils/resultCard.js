import { formatTimer } from './sharing.js';
import { bnNumber, resultAchievement, SITE_NAME, SITE_TAGLINE } from './bangla.js';

function box(context, x, y, width, height, radius, fill) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
}

function fitText(context, text, maxWidth) {
  const segments =
    typeof Intl.Segmenter === 'function'
      ? Array.from(
          new Intl.Segmenter('bn', { granularity: 'grapheme' }).segment(String(text)),
          (item) => item.segment,
        )
      : Array.from(String(text));
  if (context.measureText(segments.join('')).width <= maxWidth) return segments.join('');
  while (segments.length && context.measureText(`${segments.join('')}…`).width > maxWidth)
    segments.pop();
  return `${segments.join('')}…`;
}

export async function createResultCard(result) {
  // Load the Bengali glyphs before drawing; otherwise an exported PNG can contain fallback boxes.
  await Promise.all(
    [400, 500, 600, 700].map((weight) =>
      document.fonts.load(`${weight} 32px "Hind Siliguri"`, `${SITE_TAGLINE} ০১২৩৪৫৬৭৮৯ Player`),
    ),
  );
  const image = new Image();
  image.src = result.imageSrc;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');
  const font = (size, weight = 600) => {
    context.font = `${weight} ${size}px "Hind Siliguri", sans-serif`;
  };
  context.fillStyle = '#faf4df';
  context.fillRect(0, 0, 1080, 1350);

  // A warm, playful poster with little confetti details around the finished puzzle.
  for (let row = 0; row < 34; row++) {
    for (let column = 0; column < 28; column++) {
      context.beginPath();
      context.arc(column * 40 + 14, row * 40 + 14, 1.3, 0, Math.PI * 2);
      context.fillStyle = '#c9bc9236';
      context.fill();
    }
  }
  context.beginPath();
  context.roundRect(28, 28, 1024, 1294, 34);
  context.strokeStyle = '#17483b';
  context.lineWidth = 3;
  context.stroke();
  for (let index = 0; index < 26; index++) {
    context.save();
    context.translate(((index * 173 + 48) % 1010) + 20, ((index * 97 + 142) % 1100) + 60);
    context.rotate(index * 1.3);
    box(context, 0, 0, 6, 15, 2, ['#38a28277', '#ed906577', '#d9ae3477'][index % 3]);
    context.restore();
  }

  context.textAlign = 'center';
  context.fillStyle = '#526459';
  font(26, 600);
  context.fillText(SITE_NAME, 540, 88);
  box(context, 285, 116, 510, 54, 27, '#f6d270');
  context.fillStyle = '#5f430d';
  font(28, 700);
  context.fillText(resultAchievement(result), 540, 153);
  context.fillStyle = '#2a3932';
  font(54, 500);
  context.fillText('জীবন এলোমেলো?', 540, 243);
  context.fillStyle = '#126b50';
  font(90, 700);
  context.fillText('পাজল তো মিলল!', 540, 335);

  box(context, 68, 375, 944, 458, 28, '#17483b');
  box(context, 78, 385, 924, 438, 20, '#ffffff');
  context.save();
  context.beginPath();
  context.roundRect(90, 397, 900, 414, 14);
  context.clip();
  const scale = Math.min(900 / image.width, 414 / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  context.drawImage(image, 90 + (900 - width) / 2, 397 + (414 - height) / 2, width, height);
  context.restore();
  box(context, 315, 799, 450, 56, 28, '#126b50');
  context.fillStyle = '#ffffff';
  font(29, 700);
  context.fillText('সব টুকরো একসঙ্গে!', 540, 839);
  context.fillStyle = '#263f33';
  font(38, 700);
  context.fillText(fitText(context, result.title, 900), 540, 914);

  const humans = result.players.filter((player) => !player.isBot);
  const bots = result.players.length - humans.length;
  const stats = [
    ['সময় লেগেছে', formatTimer(result.elapsedSeconds)],
    ['টুকরো', bnNumber(result.total)],
    ['খেলোয়াড়', bnNumber(humans.length)],
  ];
  stats.forEach(([label, value], index) => {
    const x = 70 + index * 323;
    box(context, x, 948, 294, 120, 20, '#e7eddc');
    context.fillStyle = '#66745d';
    font(23, 500);
    context.fillText(label, x + 147, 985);
    context.fillStyle = '#17483b';
    font(46, 700);
    context.fillText(value, x + 147, 1040);
  });

  context.fillStyle = '#455e4d';
  font(26, 600);
  context.fillText(
    fitText(context, humans.map((player) => player.name).join(' + ') || 'পাজলবাজ দল', 920),
    540,
    1120,
  );
  if (bots) {
    context.fillStyle = '#7e816a';
    font(23, 400);
    context.fillText(`সঙ্গে ছিল ${bnNumber(bots)}টি সাহায্যকারী বট`, 540, 1157);
  }
  context.fillStyle = '#6f674f';
  font(30, 500);
  context.fillText('জীবনের পাজল না মিললেও', 540, 1230);
  context.fillStyle = '#126b50';
  font(42, 700);
  context.fillText('গেমের পাজল মিলবে।', 540, 1283);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('ফলাফলের কার্ড তৈরি হয়নি।'));
    }, 'image/png'),
  );
}
