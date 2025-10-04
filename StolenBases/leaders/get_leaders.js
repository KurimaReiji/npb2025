import { writeFileSync } from "fs";
import puppeteer from 'puppeteer';

const scraper = () => {
  const headings = [...document.querySelectorAll("h3.bis-heading, h4, h5")].map(h => h.textContent.trim());
  const updated = document.querySelector("p.right").textContent.trim().split(/[年月日]/).slice(0, 3).map(s => s.padStart(2, "0")).join("-");
  const tbl = document.querySelector("table:has(.ststats)") || undefined;
  const rows = tbl ?
    [...tbl.querySelectorAll("tr.ststats")].map(tr => [...tr.querySelectorAll("td")]).map(tds => tds.slice(1).map(td => td.textContent.trim())) :
    [];
  return {
    headings,
    updated: updated.includes("2025") ? updated : "Final",
    rows: rows.map(s => {
      const [player, team] = s[0].match(/(.*)\((.)/).slice(1, 3);
      return {
        player,
        team,
        value: s[1],
      }
    })
  };
};

const browser = await puppeteer.launch({
  defaultViewport: {
    width: 1200,
    height: 1100,
  },
  headless: "new",
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const targets = [
  "https://npb.jp/bis/2025/stats/lf_csp2_c.html",
  "https://npb.jp/bis/2025/stats/lf_csp2_p.html"
];

const page = await browser.newPage();

const outputs = [];

for (const target of targets) {
  await page.goto(target);
  await page.waitForSelector('h3.bis-heading', { timeout: 10000 });
  const data = await page.evaluate(scraper);
  outputs.push(data);
}
const date = outputs.map((o) => o.updated).sort().at(0);
const outfile = `./${date}.json`;
console.log(`output: ${outfile}`);
const output = JSON.stringify(outputs, null, 2);
writeFileSync(outfile, output, "utf8");

await browser.close();
