import { getTeams } from './npb-teams.js';

/**
 * compare function to sort by winning percentage
 * @param {object} a
 * @param {object} b
 * @returns
 */
const teams_by_wpct = (a, b) => {
  const [aWpct, bWpct] = [a, b].map((obj) => obj.wins / (obj.wins + obj.losses));
  if (aWpct > bWpct) return -1;
  if (aWpct < bWpct) return 1;
  if (a.wins > b.wins) return -1;
  if (a.wins < b.wins) return 1;
  return 0;
};

/**
 * returns truncated winning percentage. e.g. 0.333, 0.5, 0.667
 * @param {number} win
 * @param {number} loss
 * @returns {number}
 */
const winpct = (win, loss) => {
  const val = (1000 * win) / (win + loss);
  return Math.trunc(Math.round(val)) / 1000;
};

/**
 * calculate games behind from the leader
 * @param {number} win
 * @param {number} loss
 * @param {number} leaderWin
 * @param {number} leaderLoss
 * @returns {number}
 */
const games_behind = (win, loss, leaderWin, leaderLoss) => {
  if (win === leaderWin && loss === leaderLoss) return "";
  return ((leaderWin - win + (loss - leaderLoss)) * 0.5).toFixed(1);
};

class NdJsonStream extends TransformStream {
  constructor() {
    super({
      transform(chunk, controller) {
        const lines = `${this._remainder || ""}${chunk}`.split(/\r?\n/);
        this._remainder = lines.pop();
        JSON.parse(`[${lines.join(",")}]`).forEach((item) => {
          controller.enqueue(item);
        });
      }
    });
  }
}

/**
 * @typedef {{playerId: string, boxscoreName: string}} Player
 */
/**
 * Returns NPB Players
 * @param {string} date
 * @returns {Promise<Object>} Promise object represents the hash of players
 */
const get_players = async (date = "2024-03-29") => {
  const ndjson = "https://kurimareiji.github.io/npb2024/rosterHistory.ndjson";
  const response = await fetch(ndjson, { mode: 'cors' });
  const { body } = response;
  const readable = body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new NdJsonStream())
    ;
  const players = {};
  for await (const cur of readable) {
    if (cur.date > date) break;
    const player = players[cur.playerId] || Object.assign({}, { ...cur }, {
      date: undefined,
      jaEvent: undefined,
      jaEventDetails: undefined,
      newValue: undefined,
    },
    );

    Object.assign(player, { ...cur.newValue });
    players[player.playerId] = player;
  }
  return players;
}

async function get_venues(date = "2024-03-29") {
  const ndjson = "https://kurimareiji.github.io/npb2024/npb2024-venues.ndjson";
  const response = await fetch(ndjson, { mode: 'cors' });
  const { body } = response;
  const readable = body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new NdJsonStream())
    ;
  const venues = {};
  for await (const cur of readable) {
    if (cur.date > date) continue;
    const venue = venues[cur.venueId] || Object.assign({}, { ...cur }, {
      date: undefined,
      newValue: undefined,
    },
    );

    Object.assign(venue, { ...cur.newValue });
    venues[venue.venueId] = venue;
  }
  return Object.values(venues);
}

/**
 * reducer to uniq
 * @param {*} acc
 * @param {*} cur
 * @param {*} idx
 * @param {*} ary
 * @returns
 */
const to_uniq = (acc, cur, idx, ary) => {
  if (idx === ary.length - 1) acc = [...new Set(ary)];
  return acc;
};

const Pythagorean = (rs, ra, exp = 1.83) => {
  // The initial formula for pythagorean winning percentage was as follows: (runs scored ^ 2) / [(runs scored ^ 2) + (runs allowed ^ 2)]
  // Baseball-Reference.com, for instance, uses 1.83 as its exponent of choice 
  return rs ** exp / (rs ** exp + ra ** exp);
};

const get_xwl = (win, loss, rs, ra) => {
  const wpct = Pythagorean(Number(rs), Number(ra));
  const xWin = (Number(win) + Number(loss)) * wpct;
  const xLoss = (Number(win) + Number(loss)) * (1 - wpct);
  return {
    wins: Math.round(xWin),
    losses: Math.round(xLoss),
    luck: win - Math.round(xWin),
  };
};

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
        const isExtraInnings = game.isExtraInnings;
        const isWalkOff = game.isWalkOff;
        const hadComeback = game.hadComeback;

        const res = Object.assign({}, game, { winner, loser, isOneRunGame, isShutout, isDoubleDigitRuns, isExtraInnings, isWalkOff, hadComeback });
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
              isFirstRunScored: game.firstRun === game[rh].team,
              isFirstRunAllowed: game.firstRun === game[op].team,
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

async function generateStandings(readable, startDate = '2025-03-28', endDate = '2025-10-24') {
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
      { type: "extraInning", wins: 0, losses: 0, ties: 0 },
      { type: "walkoff", wins: 0, losses: 0 },
      { type: "comeback", wins: 0, losses: 0, ties: 0 },
      { type: "firstRunScored", wins: 0, losses: 0, ties: 0 },
      { type: "firstRunAllowed", wins: 0, losses: 0, ties: 0 },
    ],
  };

  const dataAry = getTeams()
    .map(({ teamName, league }) => Object.assign({}, { teamName, league }, {
      overall: structuredClone(items),
      home: structuredClone(items),
      road: structuredClone(items),
    }))
    .map((o) => [o.teamName, o])
    ;
  const data = Object.fromEntries(dataAry);

  for await (const cur of readable) {
    if (cur.date < startDate) continue;
    if (cur.date > endDate) continue;

    data[cur.target].lastUpdated = cur.date;

    ["gamesPlayed", "wins", "losses", "ties", "runsScored", "runsAllowed", "wlt"].forEach((wlt) => {
      data[cur.target].overall[wlt] += cur[wlt];
      if (cur.isHome) data[cur.target].home[wlt] += cur[wlt];
      if (cur.isRoad) data[cur.target].road[wlt] += cur[wlt];
    });

    [
      { criteria: cur.isOneRunGame, item: "oneRun", skipTies: true },
      { criteria: cur.isVsRHP, item: "right" },
      { criteria: cur.isVsLHP, item: "left" },
      { criteria: cur.isExtraInnings, item: "extraInning" },
      { criteria: cur.isWalkOff, item: "walkoff", skipTies: true },
      { criteria: cur.hadComeback, item: "comeback" },
      { criteria: cur.isFirstRunScored, item: "firstRunScored" },
      { criteria: cur.isFirstRunAllowed, item: "firstRunAllowed" },
    ].forEach(({ criteria, item, skipTies }) => {
      if (criteria) {
        ["wins", "losses", "ties"].forEach((wlt) => {
          if (wlt === "ties" && skipTies) return;
          data[cur.target].overall.splitRecords.find(sp => sp.type === item)[wlt] += cur[wlt];
          if (cur.isHome) data[cur.target].home.splitRecords.find(sp => sp.type === item)[wlt] += cur[wlt];
          if (cur.isRoad) data[cur.target].road.splitRecords.find(sp => sp.type === item)[wlt] += cur[wlt];
        });
      }
    });

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
      league: o.league,
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
        Object.assign(o[key], { lastTen: rest, streak });
      });
      return o;
    })
    ;

  const cl = npb.filter((o) => o.league === "Central")
    .sort(teams_by_wpct)
    .map((o, i, ary) => {
      o.overall.gamesBack = i === 0 ? "" : games_behind(o.overall.wins, o.overall.losses, ary[0].overall.wins, ary[0].overall.losses);
      return o;
    });
  const pl = npb.filter((o) => o.league === "Pacific")
    .sort(teams_by_wpct)
    .map((o, i, ary) => {
      o.overall.gamesBack = i === 0 ? "" : games_behind(o.overall.wins, o.overall.losses, ary[0].overall.wins, ary[0].overall.losses);
      return o;
    });

  const json = {
    "records": [
      {
        standingsType: "regular season",
        season: "2025",
        league: "Central League",
        lastUpdated: cl.map(o => o.lastUpdated).sort().at(-1),
        teamRecords: cl,
      },
      {
        standingsType: "regular season",
        season: "2025",
        league: "Pacific League",
        lastUpdated: pl.map(o => o.lastUpdated).sort().at(-1),
        teamRecords: pl,
      }
    ]
  };
  return json;
}

export {
  teams_by_wpct,
  winpct,
  games_behind,
  NdJsonStream,
  get_players,
  get_venues,
  to_uniq,
  get_xwl,
  AddWinner,
  SplitHomeRoad,
  generateStandings,
}