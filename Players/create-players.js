import { readFileSync, writeFileSync } from 'node:fs';
import { getReadableNdJsonStream } from "../docs/js/ndjson-helpers.js";

const __dirname = import.meta.dirname;
const scrapedDir = `${__dirname}/scraped`;
const season = process.argv.slice(2).at(0) || "2025";
const outfile = `${season}-flattend.json`;
const ndjsonfile = `${__dirname}/../docs/npb${season}-players.ndjson`;

const startDate = `${Number(season) - 1}-12-01`;

const registered = load_registered(season);
const reserved = load_reserved(season);
const released = load_released(season);
const retired = load_retired(season);
const boxscoreNames = await load_boxscoreNames();

const data = [registered, reserved, released, retired, boxscoreNames]
  .flat()
  .filter((o) => o.date >= startDate)
  .sort((a, b) => {
    if (a.date > b.date) return 1;
    if (a.date < b.date) return -1;
    return 0;
  })
  ;
const output = JSON.stringify(data, null, 2);
//writeFileSync(outfile, output, "utf8");

const ndjson = data.map((o) => JSON.stringify(o)).join("\n");
writeFileSync(ndjsonfile, ndjson, "utf8");

function mmddToDate(mmdd, year) {
  const date = [
    (mmdd.startsWith("12") ? Number(year) - 1 : year),
    ...mmdd.split("/").map((n) => n.padStart(2, "0"))
  ].join("-");
  return date;
}

async function load_boxscoreNames() {
  const dbfile = `${__dirname}/boxscoreNames.ndjson`;
  const readable = await getReadableNdJsonStream(dbfile);

  const history = new Set();
  for await (const cur of readable) {
    history.add(cur);
  }
  return [...history];
}

function load_roster(season) {
  const infile = `${scrapedDir}/npb${season}-roster.json`;
  const inputs = JSON.parse(readFileSync(infile, 'utf8'));

  return inputs
    .map((input) => {
      const data = input.roster
        .map(({ playerId, birthDate, height, weight, pitchHand, batSide }) => {
          return {
            playerId, birthDate, height, weight,
            pitchHand: { "右": "R", "左": "L" }[pitchHand],
            batSide: { "右": "R", "左": "L", "左右": "S" }[batSide]
          }
        });
      return data;
    })
    .flat()
    .filter(({ playerId }) => playerId)
    .concat([{ "playerId": "11815117", "birthDate": "1981-02-21", "height": "179", "weight": "81", "pitchHand": "L", "batSide": "L" }])
    ;
}

function load_en_roster(season) {
  const infile = `${scrapedDir}/npb${season}-en-roster.json`;
  const inputs = JSON.parse(readFileSync(infile, 'utf8'));

  return inputs
    .map((input) => {
      const data = input.roster
        .map(({ playerId, fullLFMName }) => {
          return {
            playerId, fullLFMName
          }
        });
      return data;
    })
    .flat()
    .filter(({ playerId }) => playerId)
    .concat([{ "playerId": "11815117", "fullLFMName": "Wada, Tsuyoshi" }])
    ;
}

function load_registered(season) {
  const props = load_roster(season);
  const fullLFMNames = load_en_roster(season);

  const infile = `${scrapedDir}/npb${season}-registered.json`;
  const inputs = JSON.parse(readFileSync(infile, 'utf8'));

  return inputs
    .map((input) => {
      const year = Number(input.year);
      const teamCode = input.teamCode;
      const jaEvent = "支配下選手登録";
      const data = input.rows
        .map(({ mmdd, teamCode, jaPrimaryPosition, primaryNumber, playerId, jaRegisteredName }) => {
          return {
            date: mmddToDate(mmdd, year),
            jaEvent,
            teamCode,
            playerId,
            jaRegisteredName: jaRegisteredName.replace(/ /g, "　"),
            primaryNumber,
            jaPrimaryPosition,
          };
        })
        .flatMap((o) => {
          let result = [o];
          const notes = input.notes.filter((n) => o.playerId === n.playerId);
          notes.forEach((note, idx) => {
            const { item, date, jaPrimaryPosition, playerId, jaRegisteredName, desc } = note;
            const [jaEvent, jaEventDetails] = item.match(/【([^（）】]*)（?([^）】]*)/)?.slice(1);

            if (item.includes("コーチ登録")) { // 【コーチ登録】【コーチ登録抹消】
            } else if (["【任意引退選手】", "【自由契約選手】", "【出場停止選手】", "【制限選手】"].includes(item)) {
              result.push(
                {
                  date,
                  jaEvent,
                  teamCode,
                  playerId,
                  jaRegisteredName,
                  jaPrimaryPosition,
                });
            } else if (item.includes("守備位置変更、背番号変更")) {
              const [oldValue, newValue] = desc.split("→").map(s => s.trim().replace(/　/, "").split(/\s/));
              Object.assign(o, { primaryNumber: oldValue.at(1), jaPrimaryPosition: oldValue.at(0) });
              result.push(
                {
                  date,
                  jaEvent: "守備位置変更",
                  jaEventDetails: [oldValue.at(0), newValue.at(0)].join(" → "),
                  teamCode,
                  playerId,
                  jaRegisteredName,
                  jaPrimaryPosition: newValue.at(0),
                }
              );
              result.push(
                {
                  date,
                  jaEvent: "背番号変更",
                  jaEventDetails: [oldValue.at(1), newValue.at(1)].join(" → "),
                  teamCode,
                  playerId,
                  jaRegisteredName,
                  primaryNumber: newValue.at(1),
                }
              );
            } else if (item.includes("守備位置変更")) {
              const [oldValue, newValue] = desc.split("→").map(s => s.trim().replace(/　/, ""));
              if (idx === 0) {
                Object.assign(o, { jaPrimaryPosition: oldValue });
              }
              result.push({
                date,
                jaEvent,
                jaEventDetails: desc,
                teamCode,
                playerId,
                jaRegisteredName,
                jaPrimaryPosition: newValue,
              });
            } else if (item.includes("投打変更")) {
              const dic = { "右": "R", "左": "L", "両": "S" };
              const [oldValue, newValue] = desc.split("→").map(s => s.trim());
              const [pitchHand, batSide] = newValue.split("").filter(s => '右左両'.split('').includes(s));
              result.push(
                {
                  date,
                  jaEvent,
                  jaEventDetails: desc,
                  teamCode,
                  playerId,
                  jaRegisteredName,
                  pitchHand: dic[pitchHand],
                  batSide: dic[batSide],
                }
              );
            } else if (["【登録名変更】", "【改名】"].includes(item)) {
              const [oldValue, newValue] = desc.split("→").map(s => s.trim());
              Object.assign(o, { jaRegisteredName: oldValue });
              result.push(
                {
                  date,
                  jaEvent,
                  jaEventDetails: desc,
                  teamCode,
                  playerId,
                  jaRegisteredName: newValue.replace(/（.*）/, ""),
                }
              );
            } else if (item.includes("背番号変更")) {
              const [oldValue, newValue] = desc.split("→").map(s => s.trim());
              Object.assign(o, { primaryNumber: oldValue });
              result.push(
                {
                  date,
                  jaEvent,
                  jaEventDetails: desc,
                  teamCode,
                  playerId,
                  jaRegisteredName,
                  primaryNumber: newValue,
                }
              );
            } else if (item.includes("登録抹消")) {
              result.push(
                {
                  date,
                  jaEvent,
                  jaEventDetails,
                  teamCode,
                  playerId,
                  jaRegisteredName,
                  jaPrimaryPosition,
                }
              );
            } else if (item.includes("支配下選手登録（")) {
              result = [Object.assign(o, { jaEventDetails, jaPrimaryPosition })]
            } else {
              result = [o, note];
            }
          });
          return result;
        })
        ;
      return data;
    })
    .flat()
    .sort((a, b) => {
      if (a.date > b.date) return 1;
      if (a.date < b.date) return -1;
      const [aa, bb] = [a, b].map((c) => [
        1,
        c.jaEventDetails ? 1 : 0,
        ["支配下選手登録抹消", "支配下選手登録"].indexOf(c.jaEvent),
      ].join(""));
      return aa - bb;
    })
    .map((o) => {
      if (!o.jaRegisteredName) console.log(o);
      o.jaRegisteredName = o.jaRegisteredName.replace(/ /g, "　");
      return o;
    })
    .filter(({ jaEvent }) => !["自由契約選手", "任意引退選手"].includes(jaEvent))
    .map((o) => {
      const fullLFMName = fullLFMNames.find((p) => p.playerId === o.playerId)?.fullLFMName;
      const prop = props.find((p) => p.playerId === o.playerId);
      if (!fullLFMName) console.log(o.jaEvent, o.jaRegisteredName);
      if (!prop) console.dir(o);
      return Object.assign({}, o, prop, { fullLFMName });
    })
    ;
}

function load_reserved(season) {
  const infile = `${scrapedDir}/npb${Number(season) - 1}-reserved.json`;
  const inputs = JSON.parse(readFileSync(infile, 'utf8'));

  return inputs
    .map((input) => {
      const data = input.rows
        .map(({ date, teamCode, jaPosition, primaryNumber, playerId, jaRegisteredName }) => {
          return {
            date,
            jaEvent: "契約保留選手",
            teamCode,
            playerId,
            jaRegisteredName,
            primaryNumber,
            jaPrimaryPosition: jaPosition,
          }
        });
      return data;
    })
    .flat()
    ;
}

function load_released(season) {
  const infile = `${scrapedDir}/npb${Number(season)}-released.json`;
  const inputs = JSON.parse(readFileSync(infile, 'utf8'));

  const notes = inputs.notes;
  return inputs.rows
    .map(({ date, teamCode, jaPosition, primaryNumber, playerId, jaRegisteredName, note }) => {
      return {
        date,
        jaEvent: "自由契約選手",
        teamCode,
        playerId,
        jaRegisteredName,
        primaryNumber,
        jaPrimaryPosition: jaPosition,
        note: note.replace(/（/, "").replace(/）/, "")
      }
    })
    .map((o) => {
      if (o.note.includes("※")) {
        const num = o.note.match(/(※\d+)/).at(1);
        const note = notes.find((n) => n.includes(num)).replace(/(※\d+)/, "");
        o.note = o.note.replace(num, note);
      }
      return o;
    })
    ;
}

function load_retired(season) {
  const infile = `${scrapedDir}/npb${season}-retired.json`;
  const inputs = JSON.parse(readFileSync(infile, 'utf8'));

  return inputs.rows
    .map(({ date, teamCode, jaPosition, primaryNumber, playerId, jaRegisteredName }) => {
      return {
        date,
        jaEvent: "任意引退選手",
        teamCode,
        playerId,
        jaRegisteredName,
        primaryNumber,
        jaPrimaryPosition: jaPosition,
      }
    })
    ;
}
