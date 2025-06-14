import { getReadableNdJsonStream } from "./ndjson-helpers.js";

const dbfile = (() => {
  const relativePath = `../npb2025-baserunning.ndjson`;
  if (typeof window === 'undefined') {
    return `${import.meta.dirname}/${relativePath}`;
  } else {
    return new URL(relativePath, import.meta.url).href;
  }
})();

const baseRunningReader = await getReadableNdJsonStream(dbfile);

async function getBaseRunningReader() {
  return await getReadableNdJsonStream(dbfile);
}

async function groupByTeam() {
  const baseRunningReader = await getReadableNdJsonStream(dbfile);
  const stats = {
    sb: 0, cs: 0, ds: 0, pickoff: 0, sba: 0, csb: 0, dsa: 0, pickedoff: 0,
  };
  const data = { lastUpdated: '' };
  for await (const cur of baseRunningReader) {
    const battingTeam = cur.batter.teamCode;
    const pitchingTeam = cur.pitcher.teamCode;
    const db = data[battingTeam] || (data[battingTeam] = { ...stats });
    const dp = data[pitchingTeam] || (data[pitchingTeam] = { ...stats });
    if (cur.scoring === 'StolenBase') {
      db.sb += 1;
      dp.sba += 1;
      if (cur.isDoubleSteal === "Y") {
        db.ds += .5;
        dp.dsa += .5;
      }
    } else if (cur.scoring === 'CaughtStealing') {
      db.cs += 1;
      dp.csb += 1;
    } else if (cur.scoring === 'PickedOff') {
      db.pickedoff += 1;
      dp.pickoff += 1;
    }
    data.lastUpdated = cur.date;
  }
  return data;
}

function cspct(sb, cs, ds) {
  return cs / (sb + cs - ds);
}

function sbpct(sb, cs, ds) {
  return (sb - ds) / (sb + cs - ds);
}

export {
  getBaseRunningReader,
  baseRunningReader,
  groupByTeam,
  cspct,
  sbpct,
}