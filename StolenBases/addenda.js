import { readFileSync, existsSync, writeFileSync } from 'node:fs';

const __dirname = import.meta.dirname;

const today = (new Date()).toISOString().slice(0, 10);
const arg = process.argv.slice(2);
const target = arg.length > 0 ? `${arg[0]}` : today;
const infile = `${__dirname}/daily/${target}.json`;
if (!existsSync(infile)) {
  process.exit();
}
const inputs = JSON.parse(readFileSync(infile, "utf-8"));
const data = inputs
  .map(({ jaText, text, pickoff, catcher, catchers }) => {
    if (catcher.id) {
      return {
        jaText, text, pickoff
      }
    }
    return {
      jaText, text, pickoff, catcher, catchers
    }
  })

const output = JSON.stringify(data, null, 2);
const outfile = `${__dirname}/addenda/${target}.json`;
if (!existsSync(outfile)) {
  writeFileSync(outfile, output);
}
//console.log(output);
