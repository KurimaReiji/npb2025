import { writeFileSync } from 'node:fs';
import { getBaseRunningReader } from '../docs/js/npb2025-baserunning.js';
import { findTeam } from '../docs/js/npb-teams.js';

const outfile = '../docs/npb2025-baserunning-summary.json';
const statsTemplate = { att: 0, sb: 0, cs: 0, ds: 0, ts: 0, pickoff: { pickoff: 0, sb: 0, cs: 0, ds: 0, ts: 0 } };
const data = {}
let updated = "";
const [endDate, startDate] = process.argv.slice(2);
if ([endDate, startDate].some((d) => d)) {
  console.error(startDate, endDate);
}

for await (const cur of (await getBaseRunningReader())) {
  if (cur.date < (startDate || '2025-03-28')) continue;
  if (cur.date > (endDate || '2025-10-24')) continue;
  const catcherStats = data[cur.catcher.id] || Object.assign(structuredClone(statsTemplate), { catcher: cur.catcher })
  const pitcherStats = data[cur.pitcher.id] || Object.assign(structuredClone(statsTemplate), { pitcher: cur.pitcher });
  const runnerStats = data[`runner-${cur.runner.id}`] || Object.assign(structuredClone(statsTemplate), { runner: cur.runner });
  const teamStats = data[`defence-${cur.catcher.teamCode}`] || structuredClone(statsTemplate);
  const teamRunnerStats = data[`offence-${cur.runner.teamCode}`] || structuredClone(statsTemplate);

  [catcherStats, pitcherStats, runnerStats, teamStats, teamRunnerStats].forEach((statsObj) => {
    updateStats(statsObj, cur);
  })

  data[cur.catcher.id] = catcherStats;
  data[cur.pitcher.id] = pitcherStats;
  data[`runner-${cur.runner.id}`] = runnerStats;
  data[`defence-${cur.catcher.teamCode}`] = teamStats;
  data[`offence-${cur.runner.teamCode}`] = teamRunnerStats;
  updated = cur.date;
}

function updateStats(statsObj, cur) {
  if (cur.countsAsStealAttempt) {
    statsObj.att += 1;
    if (cur.scoring === 'StolenBase') {
      statsObj.sb += 1;
    } else if (cur.scoring === 'CaughtStealing') {
      statsObj.cs += 1;
    }
    if (cur.isDoubleSteal) {
      statsObj.ds += 1;
    } else if (cur.isTripleSteal) {
      statsObj.ts += 1;
    }
  } else {
    if (cur.scoring === 'StolenBase') {
      statsObj.pickoff.sb += 1;
    } else if (cur.scoring === 'CaughtStealing') {
      statsObj.pickoff.cs += 1;
    } else if (cur.scoring === 'PickedOff') {
      statsObj.pickoff.pickoff += 1
    }
    if (cur.isDoubleSteal) {
      statsObj.pickoff.ds += 1;
    } else if (cur.isTripleSteal) {
      statsObj.pickoff.ts += 1;
    }
  }
}

const catchers = Object.values(data)
  .filter((o) => o.catcher)
  .map((o) => Object.assign({}, o, { ds: o.ds / 2, ts: o.ts / 3 }))
  .map((o) => Object.assign({}, o, { att: o.att - o.ds - o.ts, sb: o.sb - o.ds - 2 * o.ts }))
  .map((o) => Object.assign({}, o, { rate: calcRate(o.sb, o.cs) }))
  .sort((a, b) => b.cs - a.cs)
  .sort((a, b) => b.att - a.att)
  ;
const pitchers = Object.values(data)
  .filter((o) => o.pitcher)
  .map((o) => Object.assign({}, o, { ds: o.ds / 2, ts: o.ts / 3 }))
  .map((o) => Object.assign({}, o, { att: o.att - o.ds - o.ts, sb: o.sb - o.ds - 2 * o.ts }))
  .map((o) => Object.assign({}, o, { rate: calcRate(o.sb + o.pickoff.sb, o.cs + o.pickoff.cs) }))
  .sort((a, b) => b.cs + b.pickoff.cs - a.cs - a.pickoff.cs)
  .sort((a, b) => b.cs + b.pickoff.cs + b.sb + b.pickoff.sb - (a.cs + a.pickoff.cs + a.sb + a.pickoff.sb))
  ;
const runners = Object.values(data)
  .filter((o) => o.runner)
  .map((o) => Object.assign({}, o, { rate: calcRate(o.cs + o.pickoff.cs, o.sb + o.pickoff.sb) }))
  .sort((a, b) => b.sb + b.pickoff.sb - (a.sb + a.pickoff.sb))
  .sort((a, b) => b.cs + b.pickoff.cs + b.sb + b.pickoff.sb - (a.cs + a.pickoff.cs + a.sb + a.pickoff.sb))
  ;

const teamCodes = ["G", "T", "DB", "C", "S", "D", "H", "F", "M", "E", "B", "L"];
const teams = teamCodes
  .map((teamCode) => {
    const team = findTeam(teamCode);
    const d = data[`defence-${teamCode}`];
    Object.assign(d, { ds: d.ds / 2, ts: d.ts / 3 });
    Object.assign(d, { att: d.att - d.ds - 2 * d.ts });
    Object.assign(d, { rate: calcRate(d.sb + d.pickoff.sb - d.ds - 2 * d.ts, d.cs + d.pickoff.cs) });

    const o = data[`offence-${teamCode}`];
    Object.assign(o, { ds: o.ds / 2, ts: o.ts / 3 });
    Object.assign(o, { att: o.att - o.ds - 2 * o.ts });
    Object.assign(o, { rate: calcRate(o.cs + o.pickoff.cs, o.sb - o.ds - 2 * o.ts + o.pickoff.sb) })
    // E: att:69, sb:61, ds:1 => att:68, sb:60 => rate: 0.882
    return {
      teamCode,
      teamName: team.teamName,
      league: team.league,
      defence: d,
      offence: o,
    }
  });

const leagues = ['Central', 'Pacific']
  .map((league) => {
    return {
      league,
      defence: teams.filter((t) => t.league === league).reduce((acc, cur) => {
        acc.att += cur.defence.att;
        acc.sb += cur.defence.sb;
        acc.cs += cur.defence.cs;
        acc.ds += cur.defence.ds;
        acc.ts += cur.defence.ts;
        acc.pickoff.pickoff += cur.defence.pickoff.pickoff;
        acc.pickoff.sb += cur.defence.pickoff.sb;
        acc.pickoff.cs += cur.defence.pickoff.cs;
        acc.pickoff.ds += cur.defence.pickoff.ds;
        acc.pickoff.ts += cur.defence.pickoff.ts;
        return acc;
      }, structuredClone(statsTemplate)),
      offence: teams.filter((t) => t.league === league).reduce((acc, cur) => {
        acc.att += cur.offence.att;
        acc.sb += cur.offence.sb;
        acc.cs += cur.offence.cs;
        acc.ds += cur.offence.ds;
        acc.ts += cur.offence.ts;
        acc.pickoff.pickoff += cur.offence.pickoff.pickoff;
        acc.pickoff.sb += cur.offence.pickoff.sb;
        acc.pickoff.cs += cur.offence.pickoff.cs;
        acc.pickoff.ds += cur.offence.pickoff.ds;
        acc.pickoff.ts += cur.offence.pickoff.ts;
        return acc;
      }, structuredClone(statsTemplate)),
    }
  })
  .map((o) => {
    return {
      league: o.league,
      defence: Object.assign({}, o.defence, {
        rate: calcRate(o.defence.sb - o.defence.ds - 2 * o.defence.ts, o.defence.cs),
        teamRate: calcRate(o.defence.sb + o.defence.pickoff.sb - o.defence.ds - 2 * o.defence.ts, o.defence.cs + o.defence.pickoff.cs),
      }),
      offence: Object.assign({}, o.offence, {
        rate: calcRate(o.offence.cs + o.offence.pickoff.cs, o.offence.sb - o.offence.ds - 2 * o.offence.ts + o.offence.pickoff.sb - o.offence.pickoff.ds - 2 * o.offence.pickoff.ts),
      }),
    }
  });

const output = JSON.stringify(
  {
    updated,
    catchers,
    pitchers,
    runners,
    teams,
    leagues,
  },
  null,
  2
);

writeFileSync(outfile, output, 'utf8');

function calcRate(sb, cs) {
  if (sb + cs === 0) return '---';
  return (cs / (sb + cs)).toFixed(3).replace(/^0/, '');
}
