import { readFileSync } from 'fs';
import { getReadableNdJsonStream, createNdjsonWriter } from "../docs/js/ndjson-helpers.js";
import { findTeam } from '../docs/js/npb-teams.js';

const __dirname = import.meta.dirname;
const datadir = `${__dirname}/..`;

const dbfile = `${datadir}/Players/boxscoreNames.ndjson`;
const readable = await getReadableNdJsonStream(dbfile);
const appendToBoxscoreNames = await createNdjsonWriter(dbfile);

const playerDB = new Map();
for await (const cur of readable) {
  playerDB.set(cur.playerId, cur);
}

const lastUpdated = [...playerDB.values()].at(-1).date;

const dates = process.argv.slice(2);

dates
  .filter((date) => date.startsWith("2025-"))
  .filter((date) => date > lastUpdated)
  .forEach(updateBoxscoreNames)
  ;

function updateBoxscoreNames(date) {
  const [ja, en] = [
    `${datadir}/Games/daily/${date}.json`,
    `${datadir}/en-scraped/daily/${date}.json`
  ].map((infile) => JSON.parse(readFileSync(infile, "utf8")));

  const games = ja.map((game) => {
    const [road, home] = ["road", "home"].map((rh) => game.teams[rh].team)
      .map((team) => findTeam(team))
      ;
    try {
      const enGame = en.find((g) => findTeam(g.linescore.at(0).at(0)).teamName === road.teamName);
      if (!enGame) throw new Error(`No game found for ${road.teamName} on ${date}`);
      return { ja: game, en: enGame }
    } catch (error) {
      console.error(date, game.teams.road, en.map((g) => [g.linescore.at(0).at(0), g.linescore.at(1).at(0)]))
      throw error;
    }
  });

  const data = games
    .map(({ ja, en }) => {
      const boxscoreNames = en.boxscore.map((bbpp) => bbpp.flatMap((a) => a.at(0) === '' ? [] : [a.at(0).split(',').at(0)])).flat();
      const players = ["batting", "pitching"]
        .map((bp) => [ja.boxscore.playerStats["road"][bp], ja.boxscore.playerStats["home"][bp]])
        .flat()
        .flat()
        .map((o) => o.player)
        .map(({ id, jaBoxscoreName }, i) => {
          return {
            date: ja.date, playerId: id, jaBoxscoreName, boxscoreName: boxscoreNames.at(i)
          }
        })
        ;
      return players;
    })
    .flat();

  data.forEach((player) => {
    const d = playerDB.get(player.playerId);
    if (d === undefined) {
      console.log('season debut', player.jaBoxscoreName, player.boxscoreName);
    } else if (player.jaBoxscoreName !== d.jaBoxscoreName || player.boxscoreName !== d.boxscoreName) {
      console.log(`${player.jaBoxscoreName} => ${d.jaBoxscoreName}, ${player.boxscoreName} => ${d.boxscoreName}`);
    } else {
      return;
    }
    playerDB.set(player.playerId, player);
    appendToBoxscoreNames(player);
  });
}
