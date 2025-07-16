import fs from 'node:fs';
import path from 'node:path';
import { getReadableNdJsonStream } from "../docs/js/ndjson-helpers.js";
import { AddWinner, SplitHomeRoad, generateStandings } from "../docs/js/utils.js";

const __dirname = import.meta.dirname;
const datadir = path.resolve(__dirname, '..');
const dbfile = path.join(datadir, 'docs', 'npb2025-results.ndjson');

const readable = (await getReadableNdJsonStream(dbfile))
  .pipeThrough(new AddWinner())
  .pipeThrough(new SplitHomeRoad())
  ;

const json = await generateStandings(readable);

const output = JSON.stringify(json, null, 2);
const outfile = `${datadir}/docs/standings.json`;
fs.writeFileSync(outfile, output, "utf8");
console.info(`outfile: ${outfile}`);
