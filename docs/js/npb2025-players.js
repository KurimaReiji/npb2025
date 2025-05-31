import { getReadableNdJsonStream } from "./ndjson-helpers.js";

async function createGetPlayers(dbfile) {
  return async function (date = "2025-12-01") {
    const readable = await getReadableNdJsonStream(dbfile);
    const players = {};
    for await (const cur of readable) {
      if (cur.date > date) break;
      players[cur.playerId] = { ...players[cur.playerId], ...cur };
    }

    return Object.values(players).filter(player => player.jaEvent === '支配下選手登録');
  }
}

const dbfile = (() => {
  const relativePath = `../npb2025-players.ndjson`;
  if (typeof window === 'undefined') {
    return `${import.meta.dirname}/${relativePath}`;
  } else {
    return new URL(relativePath, import.meta.url).href;
  }
})();
const getPlayers = await createGetPlayers(dbfile);

function createFindPlayerById(players) {
  return function (playerId) {
    const player = players.find((player) => player.playerId === playerId);
    if (!player) {
      throw new Error(`Player not found: ${playerId}`);
    }
    return player;
  }
}

export {
  createGetPlayers,
  createFindPlayerById,
  getPlayers,
}