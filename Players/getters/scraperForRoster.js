(() => {
  function el2player(el) {
    const name = el.textContent.trim().replace(/\s+/, " ");
    const playerId = el.querySelector("a").href.match(/(\d+)/)[0];
    return { playerId, name };
  }

  function tr2obj(tr) {
    return [...tr.querySelectorAll('th,td')].map((td, i) => i == 1 ? el2player(td) : td.textContent.trim())
      .reduce((acc, cur, i) => {
        const key = ['primaryNumber', 'Player', 'birthDate', 'height', 'weight', 'pitchHand', 'batSide', 'notes'].at(i);
        acc[key] = cur;
        if (key === 'Player') {
          acc.playerId = cur.playerId;
          acc.jaRegisteredName = cur.name;
          delete acc.Player;
        }
        if (key === 'birthDate') acc['birthDate'] = cur.replace(/\./g, '-');
        return acc;
      }, {})
  }

  function tr2manager(tr) {
    return [...tr.querySelectorAll('th,td')].map((td) => td.textContent.trim())
      .filter((str) => str.length > 0)
      .reduce((acc, cur, i) => {
        const key = ['primaryNumber', 'jaRegisteredName', 'birthDate'].at(i);
        acc[key] = cur;
        if (key === 'birthDate') acc['birthDate'] = cur.replace(/\./g, '-');
        return acc;
      }, {})
  }

  const tables = [...document.querySelectorAll('.rosterlisttbl')]
    .map((tbl) => [...tbl.querySelectorAll('tr')])
    ;

  let primaryPosition = '';
  const primaryPositions = {
    "監督": "Manager",
    "投手": "Pitcher",
    "捕手": "Catcher",
    "内野手": "Infielder",
    "外野手": "Outfielder",
  };
  const roster = [];
  const developmentalSquad = [];

  for (const tr of tables.at(0)) {
    if (tr.classList.contains('rosterMainHead')) {
      const pos = [...tr.querySelectorAll('th,td')].at(1).textContent.trim();
      primaryPosition = primaryPositions[pos];
    } else if (primaryPosition === 'Manager') {
      roster.push(Object.assign({}, { primaryPosition }, tr2manager(tr)));
    } else {
      roster.push(Object.assign({}, { primaryPosition }, tr2obj(tr)));
    }
  }

  for (const tr of tables.at(1)) {
    if (tr.classList.contains('rosterMainHead')) {
      const pos = [...tr.querySelectorAll('th,td')].at(1).textContent.trim();
      primaryPosition = primaryPositions[pos];
    } else {
      developmentalSquad.push(Object.assign({}, { primaryPosition }, tr2obj(tr)));
    }
  }

  return {
    url: location.href,
    title: document.title,
    lastUpdated: document.querySelector(".rosterUpdate").textContent.trim(),
    roster,
    developmentalSquad,
  }
})();