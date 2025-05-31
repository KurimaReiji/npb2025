import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { getTeams, createFindTeam } from '../docs/js/npb-teams.js';

const __dirname = import.meta.dirname;
const findTeam = await createFindTeam(getTeams());

const dates = process.argv.slice(2);
dates
  .map((date) => `${__dirname}/../Games/daily/${date}.json`)
  .filter((infile) => existsSync(infile))
  .forEach((infile) => {
    const inputs = JSON.parse(readFileSync(infile, "utf-8"));
    const data = inputs
      .map((obj) => {
        const date = obj.date;
        const meta = {
          date,
          pathname: obj.pathname,
          venue: { boxscoreName: obj.venue.boxscoreName, jaBoxscoreName: obj.venue.jaBoxscoreName },
          teams: obj.teams
        };
        ["road", "home"].forEach((rh) => {
          const t = findTeam(meta.teams[rh].team);
          Object.assign(meta.teams[rh], {
            team: undefined,
            teamCode: t.teamCode,
            teamName: t.teamName,
            score: obj.boxscore.teamStats[rh].batting.runs
          });
        });
        const homeruns = [obj.homeruns.road, obj.homeruns.home].flat().map((hr) => Object.assign({}, hr, meta));
        return { homeruns, playByPlay: obj.playByPlay, playerdb: obj.players };
      })
      .map(({ homeruns, playByPlay, playerdb }) => {
        return homeruns.map((hr) => {
          const play = playByPlay.find((p) => p.jaResult?.text.includes("ホームラン") && p.batter.id === hr.batter.id && p.inning.inning === hr.inning && p.inning.halfInning === hr.halfInning); // never multi hr in a inning
          let isWalkOff;
          if (hr.halfInning === "bottom" && hr.inning > 8 && play.runs.road < (play.runs.home + hr.rbi)) {
            isWalkOff = "Y";
          }
          const batter = playerdb.find((p) => p.id === hr.batter.id);
          const pitcher = playerdb.find((p) => p.id === hr.pitcher.id);
          Object.assign(hr.batter, {
            id: undefined,
            playerId: batter.id,
            boxscoreName: batter.boxscoreName,
            batSide: batter.batSide,
            teamCode: batter.teamCode,
            primaryNumber: batter.primaryNumber,
            jaRegisteredName: batter.jaRegisteredName,
            fullLFMName: batter.fullLFMName,
          });
          Object.assign(hr.pitcher, {
            id: undefined,
            boxscoreName: pitcher.boxscoreName,
            pitchHand: pitcher.pitchHand,
            teamCode: pitcher.teamCode,
            primaryNumber: pitcher.primaryNumber,
            jaRegisteredName: pitcher.jaRegisteredName,
            fullLFMName: pitcher.fullLFMName,
          });
          return Object.assign({}, hr, {
            bop: play.pa[hr.halfInning] % 9 || 9,
            outs: play.outs,
            RoB: play.runners,
            count: play.count,
            runs: play.runs,
            jaText: play.jaResult.text,
            isLeadOff: play.pa[hr.halfInning] === 1 ? "Y" : undefined,
            isWalkOff,
            isPinchHit: play.isPinchHit,
          });
        });
      })
      .flat()
      .map((hr) => {
        const whereHit = get_where(hr.jaText);
        const url = `https://npb.jp${hr.pathname}playbyplay.html#com${hr.inning}-${hr.halfInning === "top" ? 1 : 2}`;
        delete hr.pathname;
        Object.assign(hr, { whereHit });
        return Object.assign(hr, { text: get_en_text(hr), url });
      })
      .map((hr) => {
        return Object.assign({
          id: "",
          date: "",
          batter: {},
          pitcher: {},
          number: -1,
          inning: -1,
          halfInning: "",
          outs: -1,
          "RoB": "",
          count: {},
          runs: {},
          bop: -1,
          rbi: -1,
          whereHit: "",
          venue: {},
          teams: {},
          jaText: "",
          text: "",
          url: "",
        }, hr);
      })
      ;

    const output = JSON.stringify(data, null, 2);
    const date = infile.match(/2025-\d+-\d+/)[0];
    const outfile = `./daily/${date}.json`;
    console.log(outfile);
    //console.log(output);
    writeFileSync(outfile, output);
  })
  ;

function get_where(jaText) {
  const dic = {
    "レフト": "7",
    "ライト": "9",
    "センター": "8",
    "左中間": "78",
    "右中間": "89",
    "NA": "NA",
  };
  const whereHit = jaText.match(/(レフト|ライト|センター|左中間|右中間)/)?.at(1) || "NA";
  return dic[whereHit];
}

function get_en_text(hr) {
  const dic = {
    "7": " to left field",
    "8": " to center field",
    "9": " to right field",
    "78": " to left center",
    "89": " to right center",
  };
  return `${hr.batter.boxscoreName || hr.batter.id} homers (${hr.number})${dic[hr.whereHit]}.`;
}

// key order
