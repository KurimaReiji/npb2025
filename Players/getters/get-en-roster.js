import { writeFileSync } from "fs";
import puppeteer from "puppeteer";

const __dirname = import.meta.dirname;
const scrapedDir = `${__dirname}/../scraped`;

const scraper = () => {
  function el2player(el) {
    const name = el.textContent.trim().replace(/\s+/, " ");
    const playerId = el.querySelector("a").href.match(/(\d+)/)[0];
    return { playerId, name };
  }

  function tr2obj(tr) {
    return [...tr.querySelectorAll('th,td')].map((td, i) => i == 1 ? el2player(td) : td.textContent.trim())
      .reduce((acc, cur, i) => {
        const key = ['primaryNumber', 'Player', 'birthDate', 'height', 'weight', 'pitchHand', 'batSide', 'notes'].at(i);
        acc[key] = cur;
        if (key === 'Player') {
          acc.playerId = cur.playerId;
          acc.fullLFMName = cur.name;
          delete acc.Player;
        }

        return acc;
      }, {})
  }

  function tr2manager(tr) {
    return [...tr.querySelectorAll('th,td')].map((td) => td.textContent.trim())
      .filter((str) => str.length > 0)
      .reduce((acc, cur, i) => {
        const key = ['primaryNumber', 'fullLFMName', 'birthDate'].at(i);
        acc[key] = cur;
        return acc;
      }, {})
  }

  const tables = [...document.querySelectorAll('.rosterlisttbl')]
    .map((tbl) => [...tbl.querySelectorAll('tr')])
    ;

  let primaryPosition = '';
  const primaryPositions = {
    "MANAGER": "Manager",
    "PITCHERS": "Pitcher",
    "CATCHERS": "Catcher",
    "INFIELDERS": "Infielder",
    "OUTFIELDERS": "Outfielder",
  };
  const roster = [];
  const developmentalSquad = [];

  for (const tr of tables.at(0)) {
    if (tr.classList.contains('rosterMainHead')) {
      const pos = [...tr.querySelectorAll('th,td')].at(1).textContent.trim();
      primaryPosition = primaryPositions[pos];
    } else if (primaryPosition === 'Manager') {
      roster.push(Object.assign({}, { primaryPosition }, tr2manager(tr)));
    } else {
      roster.push(Object.assign({}, { primaryPosition }, tr2obj(tr)));
    }
  }

  for (const tr of tables.at(1)) {
    if (tr.classList.contains('rosterMainHead')) {
      const pos = [...tr.querySelectorAll('th,td')].at(1).textContent.trim();
      primaryPosition = primaryPositions[pos];
    } else {
      developmentalSquad.push(Object.assign({}, { primaryPosition }, tr2obj(tr)));
    }
  }

  return {
    url: location.href,
    title: document.title,
    lastUpdated: document.querySelector(".rosterUpdate").textContent.trim(),
    roster,
    developmentalSquad,
  }
}

const browser = await puppeteer.launch({
  defaultViewport: {
    width: 1200,
    height: 1100,
  },
  headless: "new",
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const teamCodes = `B,C,D,DB,E,F,G,H,L,M,S,T`.split(",");

const page = await browser.newPage();

const season = 2025;
const data = [];
for (const teamCode of teamCodes) {
  const url = `https://npb.jp/bis/eng/teams/rst_${teamCode.toLowerCase()}.html`;
  await page.goto(url);
  await page.waitForSelector(".rosterPlayer", { timeout: 12000 });
  console.log(url);
  const res = await page.evaluate(scraper);
  data.push(Object.assign({}, { teamCode }, res));
}
const output = JSON.stringify(data, null, 2);
const outfile = `${scrapedDir}/npb${season}-en-roster.json`;
console.log(`output: ${outfile}`);
writeFileSync(outfile, output, "utf8");
await browser.close();
