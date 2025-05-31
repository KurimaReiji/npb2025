import { getReadableNdJsonStream } from "./ndjson-helpers.js";

const dbfile = (() => {
  const relativePath = `../npb2025-homeruns.ndjson`;
  if (typeof window === 'undefined') {
    return `${import.meta.dirname}/${relativePath}`;
  } else {
    return new URL(relativePath, import.meta.url).href;
  }
})();

const homeRunReader = await getReadableNdJsonStream(dbfile);

async function groupByTeam() {
  const homeRunReader = await getReadableNdJsonStream(dbfile);
  const stats = {
    hr: 0, hra: 0
  };
  const data = {};
  for await (const cur of homeRunReader) {
    const battingTeam = cur.batter.teamCode;
    const pitchingTeam = cur.pitcher.teamCode;
    const db = data[battingTeam] || (data[battingTeam] = { ...stats });
    const dp = data[pitchingTeam] || (data[pitchingTeam] = { ...stats });
    db.hr += 1;
    dp.hra += 1;
  }
  return data;
}

export {
  homeRunReader,
  groupByTeam,
}