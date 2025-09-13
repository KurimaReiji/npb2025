import { writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer';
import { scrapers } from "./scraper.js";

const __dirname = import.meta.dirname;

const to_uniq = (acc, cur, idx, ary) => {
  if (idx == ary.length - 1) acc = [...new Set(ary)];
  return acc;
};

const get_linescore_urls = (dates) => {
  const anchors = [...document.querySelectorAll('a')]
    .filter((a) => /scores\/[12]/.test(a.href))
    .filter((a) => !a.textContent.includes("中止"))
    .filter((a) => !a.textContent.includes("ノーゲーム"))
    .filter((a) => !a.href.includes("wl"))
    .filter((a) => !a.href.includes("cl"))
    ;

  return dates.map(date => {
    const [year, month, day] = date.split("-");
    const str = `${year}/${month}${day}`;
    const urls = anchors.filter((a) => a.href.includes(str));
    const inProgress = urls
      .filter((a) => !/試合終了/.test(a.textContent))
      .filter((a) => /回|\d\d.\d\d/.test(a.textContent));
    return {
      date,
      urls: urls.filter((a) => !inProgress.includes(a)).map((a) => a.href),
      inProgress: false//inProgress.length > 0
    }
  });
}

const dates = process.argv.slice(2);
if (dates.length > 0 && dates.every((d) => /^20\d\d-[012]\d-[0-3]\d$/.test(d))) {
  console.log(dates);
} else {
  console.error("Usage: node get-game-info.js YYYY-MM-DD");
  process.exit(1);
}

const browser = await puppeteer.launch({
  defaultViewport: {
    width: 1200,
    height: 1100,
  },
  headless: "new",
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const year = dates[0].slice(0, 4);
const months = dates.map(d => d.split("-")[1]).reduce(to_uniq, []);
const targets = ["index.html", "playbyplay.html", "box.html"];

const page = await browser.newPage();
await page.setRequestInterception(true);

page.on('request', (request) => {
  if (request.resourceType() === 'image') {
    request.abort();
  } else {
    request.continue();
  }
});

for (const mm of months) {
  const targetURL = `https://npb.jp/games/${year}/schedule_${mm}_detail.html`;
  console.log(`goto ${targetURL}`);
  await page.goto(targetURL);
  await page.waitForSelector(`.team1`, { timeout: 6000 });
  const obj = await page.evaluate(get_linescore_urls, dates); // [{date,urls},{date,urls}]
  console.log(obj);

  for (const { date, urls, inProgress } of obj) {
    if (inProgress) {
      console.log("in progress");
      continue;
    }
    const outfile = `${__dirname}/daily/${date}.json`;
    const outputs = [];
    for (const url of urls) {
      const data = {};
      for (const target of targets) {
        await page.goto(`${url}${target}`);
        await page.waitForSelector(`.game_info`, { timeout: 6000 });
        console.log(`${url}${target}`);
        data[target] = await page.evaluate(scrapers[target]);
      }
      outputs.push(data);
    }
    const output = JSON.stringify(outputs, null, 2);
    console.log(`output: ${outfile}`);
    writeFileSync(outfile, output, "utf8");
  }

}

await browser.close();
