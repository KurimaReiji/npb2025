import { writeFileSync } from 'node:fs';
import { getReadableNdJsonStream, } from "../docs/js/ndjson-helpers.js";
import { getBaseRunningReader } from '../docs/js/npb2025-baserunning.js';

const outfile = '../docs/npb2025-baserunning.json';
const movies = await getMovies();

const data = [];
for await (const cur of (await getBaseRunningReader())) {
  const eventId = cur.eventId;
  cur.movies = movies[eventId] ?? [];
  data.push(cur);
}

const json = JSON.stringify(data, null, 2);
writeFileSync(outfile, json, 'utf8');

async function getMovies() {
  const movieFile = './movies.ndjson';
  const movies = {};
  for await (const cur of (await getReadableNdJsonStream(movieFile))) {
    const { eventId, movie } = cur;
    const ary = movies[eventId] ?? [];
    if (ary.find(({ url }) => url === movie.url)) {
      console.log(ary)
    } else {
      ary.push(movie);
    }
    movies[eventId] = ary;
  }
  return movies;
}
