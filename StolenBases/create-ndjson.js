import { readFileSync, writeFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';

const __dirname = import.meta.dirname;

const files = await readdir(`${__dirname}/daily`);
const addenda = await readdir(`${__dirname}/addenda`);

const season = '2025';
const counter = {};

const ndjson = files
  .filter((fname) => fname.endsWith(".json"))
  .map((fname) => JSON.parse(readFileSync(`daily/${fname}`, "utf-8")))
  .filter((ary) => ary.length > 0)
  .map(merge)
  .flat()
  .map(addEventId)
  .map((obj) => JSON.stringify(obj))
  .join("\n");

writeFileSync(`${__dirname}/../docs/npb2025-baserunning.ndjson`, ndjson + "\n");

function merge(ary) {
  const addendum = addenda.find((fname) => fname === `${ary[0].date}.json`);
  if (addendum) {
    JSON.parse(readFileSync(`addenda/${addendum}`, "utf-8")).forEach((a, i) => {
      if (a.jaText === ary[i].jaText) {
        Object.assign(ary[i], a, { catchers: undefined });
      } else {
        console.log(a.jaText);
        console.log(ary[i].jaText);
      }
    })
  }
  return ary
}

function addEventId(obj) {
  const runnerId = obj.runner.id;
  const num = 1 + counter[runnerId] || 1;
  counter[runnerId] = num;
  obj.eventId = `${runnerId}-${season}-${String(num).padStart(3, '0')}`;
  return obj;
}