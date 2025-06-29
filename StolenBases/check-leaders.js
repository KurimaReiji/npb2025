import { readFileSync } from 'node:fs';

const __dirname = import.meta.dirname;
const arg = process.argv.slice(2);
const gameDay = arg.length > 0 ? arg[0] : (new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date()));
const curLeaders = JSON.parse(readFileSync(`${__dirname}/leaders/${gameDay}.json`, 'utf8'));

const catchers = JSON.parse(readFileSync(`${__dirname}/../docs/npb2025-baserunning-summary.json`, 'utf8')).catchers;

const leaders = curLeaders
  .map((o) => o.rows)
  .flat()
  .map(({ player, value }) => ({ jaRegisteredName: player, value }))
  .map(({ jaRegisteredName, value }) => {
    const c = catchers.find((o) => o.catcher.jaRegisteredName === jaRegisteredName);
    return { jaRegisteredName, value, rate: c.rate }
  })
  .filter(({ value, rate }) => value !== rate)
  ;
if (leaders.length !== 0) {
  console.log(leaders);
}
