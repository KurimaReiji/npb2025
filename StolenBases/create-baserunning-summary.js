import { writeFileSync } from 'node:fs';
import { getBaseRunningReader } from '../docs/js/npb2025-baserunning.js';
import { findTeam } from '../docs/js/npb-teams.js';

const outfile = '../docs/npb2025-baserunning-summary.json';
const statsTemplate = { att: 0, sb: 0, cs: 0, ds: 0, pickoff: { pickoff: 0, sb: 0, cs: 0 } };
const data = {}
let updated = "";

for await (const cur of (await getBaseRunningReader())) {
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
      //statsObj.att -= .5;
      //statsObj.sb -= .5;
      statsObj.ds += 1;
    }
  } else {
    if (cur.scoring === 'StolenBase') {
      statsObj.pickoff.sb += 1;
    } else if (cur.scoring === 'CaughtStealing') {
      statsObj.pickoff.cs += 1;
    } else if (cur.scoring === 'PickedOff') {
      statsObj.pickoff.pickoff += 1
    }
  }
}

const catchers = Object.values(data)
  .filter((o) => o.catcher).sort((a, b) => b.att - a.att)
  .map((o) => Object.assign(o, { ds: .5 * o.ds }, { att: o.att - o.ds, sb: o.sb - o.ds }))
  .map((o) => Object.assign(o, { rate: calcRate(o.sb, o.cs) }))
  ;
const pitchers = Object.values(data)
  .filter((o) => o.pitcher).sort((a, b) => b.att - a.att)
  .map((o) => Object.assign(o, { ds: .5 * o.ds }, { att: o.att - o.ds, sb: o.sb - o.ds }))
  .map((o) => Object.assign(o, { rate: calcRate(o.sb + o.pickoff.sb, o.cs + o.pickoff.cs) }))
  ;
const runners = Object.values(data)
  .filter((o) => o.runner).sort((a, b) => b.att - a.att)
  .map((o) => Object.assign(o, { rate: calcRate(o.cs + o.pickoff.cs, o.sb + o.pickoff.sb) }))
  ;

const teams = ["G", "T", "DB", "C", "S", "D", "H", "F", "M", "E", "B", "L"]
  .map((teamCode) => {
    const teamName = findTeam(teamCode).teamName;
    const d = data[`defence-${teamCode}`];
    const defence = Object.assign(d, { rate: calcRate(d.sb + d.pickoff.sb, d.cs + d.pickoff.cs) });
    const o = data[`offence-${teamCode}`];
    const offence = Object.assign({}, o, { ds: .5 * o.ds }, { rate: calcRate(o.cs + o.pickoff.cs, o.sb - .5 * o.ds + o.pickoff.sb) });
    // E: att:69, sb:61, ds:1 => att:68, sb:60 => rate: 0.882
    return {
      teamCode,
      teamName,
      defence,
      offence,
    }
  });

const output = JSON.stringify(
  {
    updated,
    catchers,
    pitchers,
    runners,
    teams,
  },
  null,
  2
);

writeFileSync(outfile, output, 'utf8');

function calcRate(sb, cs) {
  if (sb + cs === 0) return '---';
  return (cs / (sb + cs)).toFixed(3).replace(/^0/, '');
}
