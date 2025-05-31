import { writeFileSync } from "fs";
import puppeteer from "puppeteer";

const __dirname = import.meta.dirname;
const scrapedDir = `${__dirname}/../scraped`;

const seasons = [ // 
  "2024",
  //"2023", "2022", "2021", "2020",
  //"2019", "2018", "2017", "2016", "2015", "2014"
];

const scraper = (year, teamCode) => {
  const total = [...document.querySelectorAll(".right")].filter(e => e.textContent.trim().includes("名")).at(0).textContent.trim();

  const date = [year, ...total.match(/\d+/g).slice(1, 4).map(s => s.padStart(2, "0"))].join("-");

  const el2player = (el) => {
    const jaRegisteredName = el.textContent.trim().replace(/ /, "　");
    let playerId;
    if (jaRegisteredName === "牧野　翔矢") { // https://npb.jp/announcement/2019/reserved_l.html
      playerId = "71675138";
    } else {
      playerId = el.querySelector("a").href.match(/(\d+)/)[0];
    }
    return { playerId, jaRegisteredName };
  }

  const el2position = (el) => el.textContent.trim().replace("　", "");

  const fns = [
    el2position,
    el2player,
  ]

  const rows = [...document.querySelectorAll(".table_normal tbody tr")]
    .map((tr) => {
      return [...tr.querySelectorAll("th,td")]
        .map((el, i) => fns[i](el))
    })
    .map(([jaPosition, jaRegisteredName]) => {
      return { date, teamCode, jaPosition, ...jaRegisteredName };
    })
    ;

  return {
    url: location.href,
    title: document.title,
    total,
    rows,
  }

}

const browser = await puppeteer.launch({
  defaultViewport: {
    width: 1200,
    height: 1100,
  },
  headless: "new",
});

const teamCodes = `B,C,D,DB,E,F,G,H,L,M,S,T`.split(",");

const page = await browser.newPage();
for (const season of seasons) {
  if (Number(season) < 2019) {
    teamCodes[teamCodes.indexOf("B")] = "Bs";
  }
  const data = [];
  for (const teamCode of teamCodes) {
    const url = `https://npb.jp/announcement/${season}/reserved_${teamCode.toLowerCase()}.html`;
    await page.goto(url);
    await page.waitForSelector(".table_normal", { timeout: 12000 });
    console.log(url);
    const res = await page.evaluate(scraper, season, teamCode);
    data.push(res);
  }
  const output = JSON.stringify(data, null, 2);
  const outfile = `${scrapedDir}/npb${season}-reserved.json`;
  console.log(`output: ${outfile}`);
  writeFileSync(outfile, output, "utf8");
}
await browser.close();
