import { formatTimer } from './sharing.js';

function roundedBox(context, x, y, width, height, radius, fill) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
}

function fitText(context, text, maxWidth) {
  let value = String(text);
  if (context.measureText(value).width <= maxWidth) return value;
  while (value.length && context.measureText(`${value}…`).width > maxWidth)
    value = value.slice(0, -1);
  return `${value}…`;
}

// Render directly to canvas so the downloaded PNG needs no screenshot service.
export async function createResultCard(result) {
  const image = new Image();
  image.src = result.imageSrc;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');
  const background = context.createLinearGradient(0, 0, 1080, 1350);
  background.addColorStop(0, '#0c2431');
  background.addColorStop(0.65, '#102a2b');
  background.addColorStop(1, '#07171e');
  context.fillStyle = background;
  context.fillRect(0, 0, 1080, 1350);

  // Small, deterministic confetti marks also appear in the exported artwork.
  const colors = ['#6ee7b7', '#fcd76d', '#83c9df'];
  for (let index = 0; index < 36; index++) {
    const x = (index * 173 + 23) % 1080;
    const y = (index * 97 + 9) % 1330;
    context.save();
    context.translate(x, y);
    context.rotate(index * 1.3);
    context.globalAlpha = 0.25;
    roundedBox(context, 0, 0, 5, 13, 2, colors[index % 3]);
    context.restore();
  }

  context.textAlign = 'center';
  context.fillStyle = '#99b8bb';
  context.font = '700 23px sans-serif';
  context.fillText('MULTIPLAYER PUZZLE GAME', 540, 82);
  context.fillStyle = '#f6d783';
  context.font = '700 19px sans-serif';
  context.fillText('A LITTLE TEAMWORK. A BIG WIN.', 540, 145);
  context.fillStyle = '#f8faf6';
  context.font = '900 88px sans-serif';
  context.fillText('PIECE BY PIECE.', 540, 247);
  context.fillStyle = '#6ee7b7';
  context.fillText('WE DID IT.', 540, 338);

  roundedBox(context, 64, 385, 952, 466, 28, '#dceae1');
  context.save();
  context.beginPath();
  context.roundRect(76, 397, 928, 442, 18);
  context.clip();
  const scale = Math.min(928 / image.width, 442 / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  context.fillStyle = '#102a2b';
  context.fillRect(76, 397, 928, 442);
  context.drawImage(image, 76 + (928 - width) / 2, 397 + (442 - height) / 2, width, height);
  context.restore();
  roundedBox(context, 362, 813, 356, 62, 31, '#6ee7b7');
  context.fillStyle = '#092b26';
  context.font = '800 22px sans-serif';
  context.fillText('100% COMPLETE', 540, 853);
  context.font = '700 32px sans-serif';
  context.fillStyle = '#f8faf6';
  context.fillText(fitText(context, result.title, 900), 540, 935);

  const humans = result.players.filter((player) => !player.isBot).length;
  const bots = result.players.length - humans;
  const stats = [
    ['TIME', formatTimer(result.elapsedSeconds)],
    ['PIECES', result.total],
    ['PLAYERS', humans],
  ];
  stats.forEach(([label, value], index) => {
    const x = 64 + index * 324;
    roundedBox(context, x, 974, 304, 124, 18, '#ffffff0c');
    context.fillStyle = '#92b1b4';
    context.font = '700 17px sans-serif';
    context.fillText(label, x + 152, 1009);
    context.fillStyle = '#f8faf6';
    context.font = '800 42px sans-serif';
    context.fillText(String(value), x + 152, 1063);
  });

  context.fillStyle = '#a9c6c1';
  context.font = '500 21px sans-serif';
  const names = result.players
    .filter((player) => !player.isBot)
    .map((player) => player.name)
    .join(' + ');
  context.fillText(fitText(context, names || 'A puzzle well played', 920), 540, 1154);
  if (bots) {
    context.fillStyle = '#7e9c9f';
    context.font = '400 18px sans-serif';
    context.fillText(`With ${bots} bot helper${bots === 1 ? '' : 's'}`, 540, 1190);
  }
  context.fillStyle = '#f6d783';
  context.font = '700 25px sans-serif';
  context.fillText('GOOD FRIENDS. GREAT FINISH.', 540, 1260);
  context.fillStyle = '#7e9c9f';
  context.font = '400 18px sans-serif';
  context.fillText('Your turn. Can you beat our time?', 540, 1300);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not create the result card.'));
    }, 'image/png'),
  );
}
