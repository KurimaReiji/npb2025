import { existsSync, readFileSync } from 'fs';
import { getReadableNdJsonStream, createNdjsonWriter } from "../docs/js/ndjson-helpers.js";
import { findTeam } from '../docs/js/npb-teams.js';

const __dirname = import.meta.dirname;
const datadir = `${__dirname}/..`;

const dbfile = `${datadir}/docs/npb2025-results.ndjson`;
const readable = await getReadableNdJsonStream(dbfile);
const appendToResults = await createNdjsonWriter(dbfile);

const results = new Set();
for await (const cur of readable) {
  results.add(cur);
}

const lastUpdated = [...results.values()].at(-1)?.date || '2025-02-01';

const dates = process.argv.slice(2);

dates
  .filter((date) => date.startsWith("2025-"))
  .filter((date) => date > lastUpdated)
  .forEach(updateResults)
  ;

function updateResults(date) {
  const infile = `${datadir}/Games/daily/${date}.json`;
  if (!existsSync(infile)) return;
  const inputs = JSON.parse(readFileSync(infile, "utf8"));

  const games = inputs
    .map((game) => {
      const starters = ["road", "home"]
        .map((rh) => game.battery.pitchers[rh].at(0).id)
        .map((id) => game.players.find((p) => p.id === id))
        .map((pitcher) => pitcher.pitchHand)
        ;
      const road = { team: findTeam(game.teams.road.team).teamName, runs: game.teamStats.road.runs, starter: starters.at(0) };
      const home = { team: findTeam(game.teams.home.team).teamName, runs: game.teamStats.home.runs, starter: starters.at(1) };

      const runBalance = getRunBalance(game.innings);
      const firstRun = [home.team, null, road.team].at(1 + Math.sign(runBalance.filter((n) => n !== 0).at(0)));
      const isWalkOff = runBalance.at(-1) < 0 && runBalance.at(-2) >= 0;
      const isExtraInnings = runBalance.length > 18;
      return {
        date: game.date,
        venue: game.venue.boxscoreName,
        road,
        home,
        firstRun,
        isWalkOff,
        isExtraInnings,
        hadComback: hadComback(runBalance),
      }
    })
    .forEach((game) => {
      appendToResults(game);
    })
    ;
}

function getRunBalance(innings) {
  const balance = [];
  let currentBalance = 0;

  innings.forEach((inn) => {
    currentBalance += inn.road.runs;
    balance.push(currentBalance);

    currentBalance -= inn.home.runs;
    balance.push(currentBalance);
  });
  return balance;
}

function hadComback(runBalance) {
  const [min, max] = [Math.min(...runBalance), Math.max(...runBalance)];
  return min * max < 0;
}