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
      return {
        date: game.date,
        venue: game.venue.boxscoreName,
        road: { team: findTeam(game.teams.road.team).teamName, runs: game.teamStats.road.runs, starter: starters.at(0) },
        home: { team: findTeam(game.teams.home.team).teamName, runs: game.teamStats.home.runs, starter: starters.at(1) },
      }
    })
    .forEach((game) => {
      appendToResults(game);
    })
    ;
}
