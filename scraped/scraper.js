const scrapers = {
  "index.html": () => {
    const anchor2player = (anchor) => {
      return {
        id: anchor.href.match(/\d{6,}/)[0],
        jaBoxscoreName: anchor.textContent,
      };
    };

    const gameInfo = document.querySelector(".game_info").textContent.trim();

    const [date, place, title] = ["time", ".place", "h3"]
      .map(q => document.querySelector(`.game_tit ${q}`).textContent.trim());

    const linescore = ["top", "bottom"]
      .map(klass => document.querySelector(`tr.${klass}`))
      .map(tr => {
        return {
          team: tr.querySelector(".hide_sp").textContent,
          tds: [...tr.querySelectorAll("td")]
            .map(td => td.textContent.trim()),
        }
      });

    const umpires = document.querySelector(".referee_info").textContent.trim().replace(/\s+/g, " ");

    const decisions = [...document.querySelectorAll(".game_result_info table:nth-of-type(1) tr")]
      .map((tr) => [...tr.querySelectorAll("th,td")]
        .map((td) => {
          const anchor = td.querySelector("a");
          if (anchor) {
            return {
              players: [...td.querySelectorAll("a")].map(anchor2player),
              text: td.textContent.trim(),
            }
          }
          return td.textContent.trim();
        }))
      ;

    const battery = [...document.querySelectorAll(".game_result_info table:nth-of-type(2) tr")]
      .map((tr) => [...tr.querySelectorAll("th,td")]
        .map((td) => {
          const anchor = td.querySelector("a");
          if (anchor) {
            return {
              players: [...td.querySelectorAll("a")].map(anchor2player),
              text: td.textContent.trim(),
            }
          }
          return td.textContent.trim();
        }))
      ;

    const homeruns = [...document.querySelectorAll(".game_result_info table:nth-of-type(3) tr")]
      .map((tr) => [...tr.querySelectorAll("th,td")]
        .map((td) => {
          const anchor = td.querySelector("a");
          if (anchor) {
            return {
              players: [...td.querySelectorAll("a")].map(anchor2player),
              text: td.textContent.trim(),
            }
          }
          return td.textContent.trim();
        }))
      ;

    return {
      pathname: location.pathname,
      date, place, title, gameInfo, linescore,
      umpires, decisions, battery, homeruns,
    };
  },
  "playbyplay.html": () => {
    const anchor2player = (anchor) => {
      return {
        id: anchor.href.match(/\d{6,}/)[0],
        jaBoxscoreName: anchor.textContent,
      };
    };

    const h52obj = (h5) => {
      const [inning, topOrBottom] = h5.textContent.split(/回|（/);
      const dic = { "表": "top", "裏": "bottom" };
      return {
        inning: Number(inning),
        halfInning: dic[topOrBottom],
        text: h5.textContent,
      };
    };

    const td2players = (td) => [...td.querySelectorAll("a")].map(anchor2player);

    const td2obj = (td) => {
      return {
        players: td2players(td),
        text: td.textContent.trim(),
      }
    };

    const tr2obj = (tr) => {
      const tds = [...tr.querySelectorAll("td")].map(td2obj);
      if (tds.length === 0) return h52obj(tr);
      return tds;
    };

    const playByPlay = [...document.getElementById("progress").querySelectorAll("h5,tr")]
      .filter((tr) => !tr.querySelector("th"))
      .map(tr2obj)
      ;

    return {
      pathname: location.pathname,
      playByPlay,
    };
  },
  "box.html": () => {
    const anchor2player = (anchor) => {
      return {
        id: anchor.href.match(/\d{6,}/)[0],
        jaBoxscoreName: anchor.textContent,
      };
    };

    const td2obj = (td) => {
      const anchor = td.querySelector('a');
      if (anchor) return anchor2player(anchor);
      return {
        cls: [...td.classList],
        text: td.textContent.trim().replace(/\s+/g, ''),
      }
    }

    const teams = [...document.querySelectorAll("h4")].map(h4 => h4.textContent.trim());

    const tables = [...document.querySelectorAll('.table_score')]
      .map((tbl) => {
        return [...tbl.querySelectorAll('tr')]
          .filter(tr => !tr.closest('.table_inning'))
          .map(tr => [...tr.querySelectorAll("th,td")]
            .filter(td => !td.closest('.table_inning'))
            .map(td2obj))
      });

    return {
      pathname: location.pathname,
      road: { team: teams[0], batting: tables[0], pitching: tables[1] },
      home: { team: teams[1], batting: tables[2], pitching: tables[3] },
    }
  },
}

export {
  scrapers,
}