import { readFileSync } from 'node:fs';

const __dirname = import.meta.dirname;
const gameDay = '2025-06-13';//(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date()));
const curLeaders = JSON.parse(readFileSync(`./leaders/${gameDay}.json`, 'utf8'));

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
