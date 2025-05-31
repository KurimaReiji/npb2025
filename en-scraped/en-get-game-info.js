import { writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer';

const __dirname = import.meta.dirname;

const to_uniq = (acc, cur, idx, ary) => {
  if (idx == ary.length - 1) acc = [...new Set(ary)];
  return acc;
};

const get_linescore_urls = (dates) => {
  const season = dates[0].split("-")[0];

  const urls = [...document.querySelectorAll(`a[href^="/bis/eng/${season}/games/s"]`)]
    .filter(a => !a.textContent.includes("*"))
    .map(a => a.href)
    ;

  return dates.map(date => {
    const [year, month, day] = date.split("-");
    const str = `${year}${month}${day}`;
    return {
      date,
      urls: urls
        .filter(href => href.includes(str))
    }
  });
}

const scraper = () => {
  const url = location.href;
  const date = document.querySelector("#gmdivtitle h1").textContent.trim();
  const score = [...document.querySelectorAll("#gmdivscore table table")].map(tbl => ({ team: tbl.querySelector(".contentshdname").textContent.trim(), runs: Number(tbl.querySelector(".gmboxrun").textContent) }));
  const [venue, gameInfo] = [...document.querySelectorAll("#gmdivinfo td")].map(td => td.textContent.trim());
  const gameNumber = document.querySelector(".gmdivnumber").textContent.trim();
  const linescore = [...document.querySelectorAll("#gmdivresult tr:has(.gmscoreteam)")].map(tr => [...tr.querySelectorAll(".gmscoreteam,.gmscore")].map(td => td.textContent.trim()));
  const pitchers = [...document.querySelectorAll("#gmdivpit tr")].map(tr => [...tr.querySelectorAll("td")].map(td => td.textContent.trim()));
  const homeruns = [...document.querySelectorAll("#gmdivhr tr")].map(tr => [...tr.querySelectorAll("td")].map(td => td.textContent.trim()));
  const boxscore = [...document.querySelectorAll("#gmdivtbl table tr:nth-of-type(n+2) table")].map(tbl => [...tbl.querySelectorAll("tr")].map(tr => [...tr.querySelectorAll("th,td")].map(td => td.textContent.trim())));

  return {
    url,
    date,
    score,
    venue,
    gameInfo,
    gameNumber,
    linescore,
    pitchers,
    homeruns,
    boxscore,
  }
};

const dates = process.argv.slice(2);
if (dates.length > 0 && dates.every((d) => /^20\d\d-[012]\d-[0-3]\d$/.test(d))) {
  console.log(dates);
} else {
  console.error("Usage: node get_game_info_en.js YYYY-MM-DD");
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

const page = await browser.newPage();
for (const mm of months) {
  const targetURL = `https://npb.jp/bis/eng/${year}/calendar/index_${mm === "03" ? "04" : mm}.html`;
  console.log(`goto ${targetURL}`);
  await page.goto(targetURL);
  await page.waitForSelector(`.stvsteam`, { timeout: 6000 });
  const obj = await page.evaluate(get_linescore_urls, dates.filter((d) => d.includes(`-${mm}-`))); // [{date,urls},{date,urls}]
  console.log(obj);
  for (const { date, urls } of obj) {
    const outfile = `${__dirname}/daily/${date}.json`;
    const outputs = [];
    for (const target of urls) {
      await page.goto(`${target}`);
      await page.waitForSelector(`#gmdivtitle`, { timeout: 6000 });
      console.log(`${target}`);
      const data = await page.evaluate(scraper);
      outputs.push(data);
    }
    const output = JSON.stringify(outputs, null, 2);
    console.log(`output: ${outfile}`);
    writeFileSync(outfile, output, "utf8");
  }

}

await browser.close();
