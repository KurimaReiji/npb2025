import { writeFileSync } from "fs";
import puppeteer from "puppeteer";

const __dirname = import.meta.dirname;

const seasons = [ // 
  "2025",
  //"2024",
  //"2023", "2022", "2021", "2020", "2019",
  //"2018", "2017", "2016", "2015", "2014",
];

const scraper = () => {
  const el2player = (el) => {
    const jaRegisteredName = el.textContent.trim().replace(/ /, "　");
    const playerId = el.querySelector("a").href.match(/(\d+)/)[0];
    return { playerId, jaRegisteredName };
  }

  const el2teamCode = (el) => el.querySelector("a")?.href.match(/d_(\S+).html/)[1].toUpperCase();

  const el2position = (el) => el.textContent.trim().replace("　", "");

  const el2number = (el) => el.textContent.trim();

  const el2date = (el) => el.textContent.trim().split("/").map(s => s.padStart(2, "0")).join("-");

  const fns = [
    el2date,
    el2teamCode,
    el2player,
    el2position,
    el2number,
    el2number,
  ];

  const notes = [...document.querySelectorAll(".att_box")]
    .filter(el => !el.innerHTML.includes("野球協約"))
    .map((el) => el.textContent.trim().split("\n").map(s => s.trim()))
    .flat()
    ;

  const rows = [...document.querySelectorAll(".table_normal tbody tr")]
    .map((tr) => {
      return [...tr.querySelectorAll("th,td")]
        .map((el, i) => fns[i](el))

    })
    .map(([date, teamCode, player, jaPosition, primaryNumber, note]) => {
      return { date, teamCode, ...player, jaPosition, primaryNumber, note };
    })
    ;

  return {
    url: location.href,
    title: document.title,
    rows,
    notes,
  }

};

const browser = await puppeteer.launch({
  defaultViewport: {
    width: 1200,
    height: 1100,
  },
  headless: "new",
});

const page = await browser.newPage();
for (const season of seasons) {
  const url = `https://npb.jp/announcement/${season}/pn_released.html`;
  await page.goto(url);
  await page.waitForSelector(".table_normal", { timeout: 12000 });
  console.log(url);
  const data = await page.evaluate(scraper);

  const output = JSON.stringify(data, null, 2);
  const outfile = `${__dirname}/../scraped/npb${season}-released.json`;
  console.log(`output: ${outfile}`);
  writeFileSync(outfile, output, "utf8");
}
await browser.close();
