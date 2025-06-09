import { writeFileSync } from "fs";
import puppeteer from 'puppeteer';

const __dirname = import.meta.dirname;

const scraper = () => {
  function elToPlayer(el) {
    const jaRegisteredName = el.textContent.trim().replace(/ /, "　");
    const playerId = el.querySelector("a")?.href.match(/(\d+)/)[0] || "TBD";
    return { playerId, jaRegisteredName };
  }

  const elToPosition = (el) => el.textContent.trim().replace("　", "");

  const elToNumber = (el) => el.textContent.trim();

  const [year, teamCode] = location.href.match(/\/(20\d\d)\/.*_(\S+).html/)
    .slice(1, 3)
    .map((str, i) => {
      if (i === 0) return str;
      return str === "bs" ? "Bs" : str.toUpperCase();
    });

  const total = [...document.querySelectorAll(".right")].filter(e => e.textContent.trim().endsWith("名")).at(0).textContent.trim();

  const elToDate = (el) => el.textContent.trim().split("/").map(s => s.padStart(2, "0")).join("-");

  const slashedToDate = (slashed) => slashed.split("/").map(n => n.padStart(2, "0")).join("-");

  function notesToObj(tr) {
    return [...tr.querySelectorAll("th,td")]
      .slice(1)
      .map((td, i) => {
        const text = td.textContent;
        if (text.startsWith("20")) return { date: slashedToDate(td.textContent) };
        if (i === 1 && text.endsWith("手")) return { jaPrimaryPosition: elToPosition(td) };
        if (td.querySelector("a")) return { player: elToPlayer(td) };
        return td.textContent;
      })
      .reduce((acc, cur) => {
        if (typeof cur === "object") {
          if (acc.player) {
            acc.text.unshift(acc.player.jaRegisteredName);
            acc.text.push(cur.player.jaRegisteredName);
          } else {
            Object.assign(acc, cur);
          }
        }
        if (typeof cur === "string") acc.text.push(cur);
        return acc;
      }, { text: [] })
      ;
  }

  const fns = [
    elToDate,
    elToPosition,
    elToNumber,
    elToPlayer
  ];

  const rows = [...document.querySelectorAll(".table_normal tbody tr")]
    .map((tr) => {
      return [...tr.querySelectorAll("th,td")]
        .map((el, i) => fns[i](el))
        ;
    })
    .map(([date, jaPrimaryPosition, primaryNumber, jaRegisteredName]) => {
      return {
        mmdd: date,
        teamCode,
        jaPrimaryPosition,
        primaryNumber,
        ...jaRegisteredName
      };
    })
    ;

  const notes = [...document.querySelectorAll(".att_box p, .att_box tr")]
    .reduce((acc, cur) => {
      if (cur.tagName === "P") acc.push([cur]);
      if (cur.tagName === "TR") acc.at(-1).push(cur);
      return acc;
    }, [])
    .map(([par, ...trs]) => {
      return trs
        .map(notesToObj)
        .map(({ date, jaPrimaryPosition, player, text }) => {
          return { date, jaPrimaryPosition, ...player, desc: text.join(" ") }
        })
        .map((o) => Object.assign({ item: par.textContent }, o))
        ;
    })
    .flat()
    ;

  return {
    url: location.href,
    year,
    teamCode,
    title: document.title,
    total,
    rows,
    notes,
  }
};

const season = process.argv.slice(2).at(0) || "2025";
const teamCodes = Number(season) < 2019 ? `bs c d db e f g h l m s t`.split(" ") : `b c d db e f g h l m s t`.split(" ");

const browser = await puppeteer.launch({
  defaultViewport: {
    width: 1200,
    height: 1100,
  },
  headless: "new",
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();
await page.setRequestInterception(true);

page.on('request', (request) => {
  if (request.resourceType() === 'image') {
    request.abort();
  } else {
    request.continue();
  }
});

const data = [];
for (const teamCode of teamCodes) {
  const url = `https://npb.jp/announcement/${season}/registered_${teamCode}.html`;
  await page.goto(url);
  await page.waitForSelector(`.table_normal`, { timeout: 9000 })
  console.log(url);
  const res = await page.evaluate(scraper);
  data.push(res);
};
await browser.close();

const output = JSON.stringify(data, null, 2);
const outfile = `${__dirname}/../scraped/npb${season}-registered.json`;
console.log(`output: ${outfile}`);
writeFileSync(outfile, output, "utf8");
