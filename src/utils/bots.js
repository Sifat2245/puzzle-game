export function advanceBots(game, dt, { pace = 'normal', onSnap }) {
  if (game.isCompleted || !game.pieces.length) return;
  const paceMultiplier = pace === 'fast' ? 1.75 : pace === 'relaxed' ? 0.58 : 1;

  game.bots.forEach((bot) => {
    if (bot.carryingPieceId !== null) {
      const piece = game.pieces[bot.carryingPieceId];
      if (!piece || piece.lockedBy !== bot.id) {
        bot.carryingPieceId = null;
        return;
      }
      const group = game.groups.get(piece.groupId);
      const dx = bot.destPieceX - piece.x;
      const dy = bot.destPieceY - piece.y;
      const distance = Math.hypot(dx, dy);
      const step = 260 * paceMultiplier * dt;
      const arrived = distance <= step + 2;
      const fraction = arrived ? 1 : step / distance;
      group?.forEach((id) => {
        const member = game.pieces[id];
        member.x += dx * fraction;
        member.y += dy * fraction;
        if (arrived) member.lockedBy = null;
      });
      bot.x = piece.x + game.pieceW / 2;
      bot.y = piece.y + game.pieceH / 2;
      if (arrived) {
        bot.carryingPieceId = null;
        bot.cooldown = (1.4 + Math.random() * 1.2) / paceMultiplier;
        onSnap(piece, bot);
      }
      return;
    }

    bot.cooldown -= dt;
    if (bot.cooldown > 0) return;
    // Work on whole groups too, so a partially assembled puzzle never stalls the bots.
    const candidates = [];
    game.groups.forEach((group) => {
      const members = Array.from(group, (id) => game.pieces[id]);
      if (members.some((piece) => piece.inPlace || piece.lockedBy)) return;
      if (members[0]) candidates.push(members[0]);
    });
    if (!candidates.length) {
      bot.cooldown = 0.5;
      return;
    }
    const piece = candidates[Math.floor(Math.random() * candidates.length)];
    game.groups.get(piece.groupId).forEach((id) => {
      Object.assign(game.pieces[id], {
        lockedBy: bot.id,
        lockedColor: bot.color,
        lockedName: bot.name,
      });
    });
    bot.carryingPieceId = piece.id;
    bot.destPieceX = piece.c * game.pieceW;
    bot.destPieceY = piece.r * game.pieceH;
  });
}
