import { getTeams, findTeam } from '../docs/js/npb-teams.js';
import { teams_by_wpct, winpct, games_behind, get_xwl } from "../js/utils.js";
import { writeFileSync } from 'fs';
import { getReadableNdJsonStream } from "../docs/js/ndjson-helpers.js";

const __dirname = import.meta.dirname;
const datadir = `${__dirname}/..`;

const dbfile = `${datadir}/docs/npb2025-results.ndjson`;

class AddWinner extends TransformStream {
  constructor() {
    super({
      transform(game, controller) {
        const sign = Math.sign(game.road.runs - game.home.runs);
        const winner = [game.home.team, "Tied", game.road.team][sign + 1];
        const loser = [game.road.team, "Tied", game.home.team][sign + 1];

        const isOneRunGame = Math.abs(game.home.runs - game.road.runs) === 1;
        const isShutout = game.home.runs === 0 || game.road.runs === 0;
        const isDoubleDigitRuns = game.home.runs > 9 || game.road.runs > 9;

        const res = Object.assign({}, game, { winner, loser, isOneRunGame, isShutout, isDoubleDigitRuns });
        controller.enqueue(res);
      }
    })
  }
}

class SplitHomeRoad extends TransformStream {
  constructor() {
    super({
      transform(game, controller) {
        ["road", "home"]
          .map((rh) => {
            const op = rh === "home" ? "road" : "home";
            return Object.assign({}, game, {
              target: game[rh].team,
              opponent: game[op].team,
              runsScored: game[rh].runs,
              runsAllowed: game[op].runs,
              isVsRHP: game[op].starter === "R",
              isVsLHP: game[op].starter === "L",
              gamesPlayed: 1,
              wins: game.winner === game[rh].team ? 1 : 0,
              losses: game.loser === game[rh].team ? 1 : 0,
              ties: game.winner === "Tied" ? 1 : 0,
              isHome: game[rh].team === game.home.team,
              isRoad: game[rh].team === game.road.team,
              wlt: game.winner === game[rh].team ? "W" : game.loser === game[rh].team ? "L" : "T",
            })
          })
          .forEach((res) => {
            controller.enqueue(res);
          })
      }
    })
  }
}

const readable = (await getReadableNdJsonStream(dbfile))
  .pipeThrough(new AddWinner())
  .pipeThrough(new SplitHomeRoad())
  ;

const items = {
  gamesPlayed: 0, wins: 0, losses: 0, ties: 0,
  runsScored: 0, runsAllowed: 0, runDifferential: "",
  wlt: "", streak: "",
  splitRecords: [
    { type: "left", wins: 0, losses: 0, ties: 0 },
    { type: "right", wins: 0, losses: 0, ties: 0 },
    { type: "oneRun", wins: 0, losses: 0 },
    { type: "shutout", pitching: 0, batting: 0, ties: 0 },
    { type: "doubleDigitRuns", scored: 0, allowed: 0 },
  ],
};

const dataAry = getTeams()
  .map(({ teamName }) => Object.assign({}, { teamName }, {
    overall: structuredClone(items),
    home: structuredClone(items),
    road: structuredClone(items),
  }))
  .map((o) => [o.teamName, o])
  ;
const data = Object.fromEntries(dataAry);

for await (const cur of readable) {
  //console.log(cur);
  data[cur.target].lastUpdated = cur.date;
  ["gamesPlayed", "wins", "losses", "ties", "runsScored", "runsAllowed", "wlt"].forEach((wlt) => {
    data[cur.target].overall[wlt] += cur[wlt];
    if (cur.isHome) data[cur.target].home[wlt] += cur[wlt];
    if (cur.isRoad) data[cur.target].road[wlt] += cur[wlt];
  });
  if (cur.isOneRunGame) {
    ["wins", "losses"].forEach((wl) => {
      const item = "oneRun";
      data[cur.target].overall.splitRecords.find(sp => sp.type === item)[wl] += cur[wl];
      if (cur.isHome) data[cur.target].home.splitRecords.find(sp => sp.type === item)[wl] += cur[wl];
      if (cur.isRoad) data[cur.target].road.splitRecords.find(sp => sp.type === item)[wl] += cur[wl];
    });
  }
  if (cur.isVsRHP) {
    ["wins", "losses", "ties"].forEach((wl) => {
      const item = "right";
      data[cur.target].overall.splitRecords.find(sp => sp.type === item)[wl] += cur[wl];
      if (cur.isHome) data[cur.target].home.splitRecords.find(sp => sp.type === item)[wl] += cur[wl];
      if (cur.isRoad) data[cur.target].road.splitRecords.find(sp => sp.type === item)[wl] += cur[wl];
    });
  }
  if (cur.isVsLHP) {
    ["wins", "losses", "ties"].forEach((wl) => {
      const item = "left";
      data[cur.target].overall.splitRecords.find(sp => sp.type === item)[wl] += cur[wl];
      if (cur.isHome) data[cur.target].home.splitRecords.find(sp => sp.type === item)[wl] += cur[wl];
      if (cur.isRoad) data[cur.target].road.splitRecords.find(sp => sp.type === item)[wl] += cur[wl];
    });
  }
  if (cur.isShutout) {
    const pitching = cur.runsAllowed === 0 ? 1 : 0;
    const batting = cur.runsScored === 0 ? 1 : 0;
    const ties = cur.runsAllowed === 0 && cur.runsScored === 0 ? 1 : 0;
    const item = "shutout";
    data[cur.target].overall.splitRecords.find(sp => sp.type === item).pitching += pitching;
    data[cur.target].overall.splitRecords.find(sp => sp.type === item).batting += batting;
    data[cur.target].overall.splitRecords.find(sp => sp.type === item).ties += ties;
    if (cur.isHome) {
      data[cur.target].home.splitRecords.find(sp => sp.type === item).pitching += pitching;
      data[cur.target].home.splitRecords.find(sp => sp.type === item).batting += batting;
      data[cur.target].home.splitRecords.find(sp => sp.type === item).ties += ties;
    }
    if (cur.isRoad) {
      data[cur.target].road.splitRecords.find(sp => sp.type === item).pitching += pitching;
      data[cur.target].road.splitRecords.find(sp => sp.type === item).batting += batting;
      data[cur.target].road.splitRecords.find(sp => sp.type === item).ties += ties;
    }
  }
  if (cur.isDoubleDigitRuns) {
    const scored = cur.runsScored > 9 ? 1 : 0;
    const allowed = cur.runsAllowed > 9 ? 1 : 0;
    const item = "doubleDigitRuns";
    data[cur.target].overall.splitRecords.find(sp => sp.type === item).scored += scored;
    data[cur.target].overall.splitRecords.find(sp => sp.type === item).allowed += allowed;
    if (cur.isHome) {
      data[cur.target].home.splitRecords.find(sp => sp.type === item).scored += scored;
      data[cur.target].home.splitRecords.find(sp => sp.type === item).allowed += allowed;
    }
    if (cur.isRoad) {
      data[cur.target].road.splitRecords.find(sp => sp.type === item).scored += scored;
      data[cur.target].road.splitRecords.find(sp => sp.type === item).allowed += allowed;
    }
  }
}

const npb = Object.values(data)
  .map((o) => Object.assign({
    teamName: o.teamName,
    wins: o.overall.wins,
    losses: o.overall.losses,
    ties: o.overall.ties,
    pct: winpct(o.overall.wins, o.overall.losses).toFixed(3).replace(/^0/, "")
  }, o))
  .map((o) => {
    ["overall", "home", "road"].forEach((key) => {
      o[key].runDifferential = o[key].runsScored - o[key].runsAllowed;
      o[key].splitRecords.push({
        type: "xWinLoss",
        ...get_xwl(o[key].wins, o[key].losses, o[key].runsScored, o[key].runsAllowed)
      });
      const { streak, ...rest } = last10(o[key].wlt)
      Object.assign(o[key], { last10: rest, streak });
    });
    return o;
  })
  ;

const cl = npb.filter((o) => findTeam(o.teamName).league === "Central")
  .sort(teams_by_wpct)
  .map((o, i, ary) => {
    o.overall.gamesBack = i === 0 ? "" : games_behind(o.overall.wins, o.overall.losses, ary[0].overall.wins, ary[0].overall.losses);
    return o;
  });
const pl = npb.filter((o) => findTeam(o.teamName).league === "Pacific")
  .sort(teams_by_wpct)
  .map((o, i, ary) => {
    o.overall.gamesBack = i === 0 ? "" : games_behind(o.overall.wins, o.overall.losses, ary[0].overall.wins, ary[0].overall.losses);
    return o;
  });

const json = {
  "records": [
    {
      standingsType: "regular season",
      season: "2024",
      league: "Central League",
      lastUpdated: cl.map(o => o.lastUpdated).sort().at(-1),
      teamRecords: cl,
    },
    {
      standingsType: "regular season",
      season: "2024",
      league: "Pacific League",
      lastUpdated: pl.map(o => o.lastUpdated).sort().at(-1),
      teamRecords: pl,
    }
  ]
}


const output = JSON.stringify(json, null, 2);
const outfile = `${datadir}/docs/standings.json`;
writeFileSync(outfile, output, "utf8");
console.info(`outfile: ${outfile}`);

function last10(wlt) {
  const streak = `${wlt.replace(/T/g, "").at(-1)}${wlt.replace(/T/g, "").match(/W+$|L+$/)[0].length}`;
  const last10 = wlt.slice(-10);
  const rec = last10.split("")
    .reduce((a, c) => { a[c] += 1; return a; }, { W: 0, L: 0, T: 0 });
  return {
    wins: rec.W,
    losses: rec.L,
    ties: rec.T,
    streak,
  }
}

