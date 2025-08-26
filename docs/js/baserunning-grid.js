import data from '../npb2025-baserunning.json' with { type: "json" };

const playerKeys = ['runner', 'batter', 'pitcher', 'catcher'];

const dialogStateObserver = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.attributeName === 'open') {
      const dialog = mutation.target;
      if (dialog.hasAttribute('open')) {
        document.body.classList.add('fixed');
      } else {
        document.body.classList.remove('fixed');
      }
    }
  }
});

function createBackdropClickHandler(dialog) {
  return function (e) {
    const rect = dialog.getBoundingClientRect();
    const isOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;

    if (isOutside) {
      dialog.close();
    }
  };
}

class BaserunningGrid extends HTMLElement {
  static get observedAttributes() {
    return [];
  }

  constructor() {
    super();

    this.render();
  }

  render() {
    const css = `
    <style>
    :host {
      display: block;
      font-family: 'Noto Sans', sans-serif;
      --mono: 'Noto Sans Mono', sans-serif;
      --col-padding: .25em;
      height: 100%;
    }

    #container {
      --bg-color: var(--npb-blue);
      background: var(--bg-color);
      max-height: 100%;
      overflow-y: auto;
    }

    a {
      display: block;
      text-align: center;
      text-decoration: none;
      color: currentColor;
    }

    table {
      overflow-x: auto;
      border-collapse: collapse;
      table-layout: fixed;
    }

    thead {
      position: sticky;
      top: var(--header-top, 0);
      background: var(--bg-color, white);
      z-index: 1;
    }

    th:nth-of-type(1),
    td:nth-of-type(1) {
      padding-inline-start: var(--col-padding);
    }

    th:nth-last-of-type(1),
    td:nth-last-of-type(1) {
      padding-inline-end: var(--col-padding);
    }

    thead tr {
      background: #ddd;
    }
    
    .odd {
      background: #eee;
    }

    td {
      white-space: nowrap;
    }

    [data-item="date"],
    [data-item="runner"],
    [data-item="batter"],
    [data-item="pitcher"],
    [data-item="catcher"],
    [data-item="venue"]{
      text-align: left;
    }

    td[data-item="result"]{
      text-align: right;
      font-family: var(--mono);
      padding-inline-end: .5em;
    }

    [data-item="RoB"],
    [data-item="inning"],
    [data-item="outs"]{
      text-align: right;
      font-family: var(--mono);
    }

    [data-item="RoB"],
    [data-item="inning"] {
      padding-inline: .25em;
    }

    [data-item="runnerTeam"],
    [data-item="pitcherTeam"],
    [data-item="catcherTeam"],
    [data-item="base"],
    td[data-item="outs"]{
      text-align: center;
    }

    [data-item="runnerTeam"],
    [data-item="pitcherTeam"] {
      width: 2em;
    }

    th[data-item="runner"] {
      width: var(--runner-width, auto);
    }

    th[data-item="batter"] {
      width: var(--batter-width, auto);
    }

    th[data-item="pitcher"] {
      width: var(--pitcher-width, auto);
    }

    th[data-item="catcher"] {
      width: var(--catcher-width, auto);
    }

    td[data-item="movies"] {
      display: flex;
      justify-content: flex-end;

      & a {
        display: inline-block;
        width: 2em;
        padding-inline-end: .25em;
        background: lightgray;
        color: currentColor;
        clip-path: polygon(10% 20%, 70% 20%, 70% 35%, 90% 25%, 90% 75%, 70% 65%, 70% 80%, 10% 80%);
      }
    }

    td:not([data-item="movies"]):hover {
      cursor: pointer;
      background: #eee;
    }

    button#open-dialog {
      font-weight: bold;
    }

    .hide {
      display: none;
    }

    #addMovie::backdrop {
      background: rgba(0, 0, 0, .7);
    }

    #links ul {
      padding-inline: 0;
      display: grid;
      row-gap: .5em;
      list-style: none;

      li {
        max-width: min(18em, 80vw);
        &:nth-of-type(odd) {
          background: #ececec;
        }

        a {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
    </style>`;
    const html = `
  <div id="container">
    <table>
      <thead>
        <tr>
          <th data-item="date">Date</th>
          <th data-item="runnerTeam"></th>
          <th data-item="runner">Runner</th>
          <th data-item="batter">Batter</th>
          <th data-item="pitcherTeam"></th>
          <th data-item="pitcher">Pitcher</th>
          <th data-item="catcher">Catcher</th>
          <th data-item="base">Base</th>
          <th data-item="result">Result</th>
          <th data-item="inning">Inn</th>
          <th data-item="outs">Outs</th>
          <th data-item="RoB">RoB</th>
          <th data-item="venue">Venue</th>
          <th data-item="movies">Movies</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <template id="row">
      <tr>
        <td data-item="date"></td>
        <td data-item="runnerTeam"></t>
        <td data-item="runner">Runner</td>
        <td data-item="batter"></td>
        <td data-item="pitcherTeam"></td>
        <td data-item="pitcher"></td>
        <td data-item="catcher"></td>
        <td data-item="base">Base</td>
        <td data-item="result">Result</td>
        <td data-item="inning"></td>
        <td data-item="outs"></td>
        <td data-item="RoB"></td>
        <td data-item="venue"></td>
        <td data-item="movies">Movies</td>
      </tr>
    </template>
    <template id="addButton">
      <button type="button" data-dialog="addMovie">+</button>
    </template>
  </div>
  <dialog id="addMovie">
    <div id="links"></div>
    <form method="dialog">
      <p>Add Movie URL</p>
      <input type="url" name="movieUrl" required>
      <button type="submit">Add</button>
      <button type="reset">Cancel</button>
    </form>
  </dialog>
    `;
    const self = this;
    const shadow = self.attachShadow({ mode: "open" });
    shadow.innerHTML = `${css}${html}`;
    dialogStateObserver.observe(shadow.querySelector("dialog"), { attributes: true });

    self.criteria = new Set();

    mergeLocalData(data);

    const trs = data.reverse().map((cur) => createRow(cur, self.shadowRoot));
    self.shadowRoot.querySelector('#container tbody').replaceChildren(...trs);

    playerKeys.forEach((pos) => {
      const elm = self.shadowRoot.querySelector(`thead [data-item="${pos}"]`);
      elm.style.setProperty(`--${pos}-width`, `${elm.offsetWidth}px`);
    });

    self.shadowRoot.querySelector('#container table').addEventListener('click', (e) => {
      const elm = e.target;
      if (elm.tagName === 'TD') {
        self.dispatchEvent(new CustomEvent('xFilter', { detail: elm }));
      }
    });

    self.addEventListener('xFilter', (e) => {
      console.log(e);
      const td = e.detail;
      console.log(td.textContent, td.dataset.item);
      const criterion = { item: td.dataset.item, value: td.textContent };
      if (playerKeys.includes(td.dataset.item)) {
        criterion.playerId = td.dataset.playerId;
      }
      const json = JSON.stringify(criterion);
      if (self.criteria.has(json)) {
        self.criteria.delete(json);
      } else {
        self.criteria.add(json);
      }
      self.shadowRoot.querySelectorAll('tbody tr').forEach((tr) => {
        const matchesAllFilters = [...self.criteria]
          .map((c) => JSON.parse(c))
          .every(({ item, value, playerId }) => {
            if (playerId) {
              return tr.querySelector(`td[data-item="${item}"]`).dataset.playerId === playerId;
            }
            return tr.querySelector(`td[data-item="${item}"]`).textContent === value;
          });
        if (matchesAllFilters) {
          tr.classList.remove('hide');
        } else {
          tr.classList.add('hide');
        }
      })
    })
  }

  attributeChangedCallback(name, oldValue, newValue) { }

  connectedCallback() { }
}

if (!customElements.get("baserunning-grid")) {
  customElements.define("baserunning-grid", BaserunningGrid);
}

function mergeLocalData(data) {
  const movies = JSON.parse(localStorage.getItem('movies') || '[]');
  movies.forEach((movieObj) => {
    const cur = data.find((d) => d.eventId === movieObj.eventId);
    cur.movies.forEach((c) => {
      if (isEquivalentMovie({ eventId: cur.eventId, movie: { url: c.url } }, movieObj)) {
        movieObj.isPublic = true;
        debugger
      }
    });
    cur.movies.push(movieObj.movie);
  });
  const toSave = movies.filter((o) => !o.isPublic)
  localStorage.setItem('movies', JSON.stringify(toSave));
}

function createRow(cur, root) {
  const tr = root.querySelector('#row').content.cloneNode(true);
  const addButton = root.querySelector('#addButton').content.firstElementChild.cloneNode(true);
  addButton.addEventListener('click', ({ currentTarget }) => {
    const row = currentTarget.closest('tr');
    const dialog = root.querySelector('#addMovie');
    dialog.addEventListener('click', createBackdropClickHandler(dialog));
    dialog.dataset.eventId = cur.eventId;
    if (cur.movies.length > 0) {
      const ul = document.createElement('ul');
      const lis = cur.movies.map((m) => {
        const li = document.createElement('li');
        debugger
        const anchor = createAnchor(m.url, m.title ?? m.url);
        li.replaceChildren(anchor);
        return li;
      });
      ul.replaceChildren(...lis);
      dialog.querySelector('#links').replaceChildren(ul);
    }
    dialog.showModal();
    dialog.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const movieUrl = e.target.movieUrl.value;
      if (movieUrl) {
        const data = { eventId: cur.eventId, movie: { url: movieUrl } };
        const movies = JSON.parse(localStorage.getItem('movies')) || [];
        movies.push(data);
        localStorage.setItem('movies', JSON.stringify(movies));

        postMovieData(data);

        cur.movies.push({ url: movieUrl });
        row.querySelector('td[data-item="movies"]').replaceChildren(...moviesToTd(cur), currentTarget);
        e.target.movieUrl.value = '';
        dialog.close();
      }
    };
    dialog.querySelector('form').onreset = () => dialog.close();
  });

  [...tr.querySelectorAll('td[data-item]')].forEach((td) => {
    const item = td.dataset.item;
    if (playerKeys.includes(td.dataset.item)) {
      td.dataset.playerId = cur[item].id;
    }
    if (item.endsWith('rTeam')) {
      td.textContent = cur[item.replace('Team', '')].teamCode || '-';
    } else if (item === 'date') {
      td.textContent = cur.date.split('-').slice(-2).join('');
      td.dataset.eventId = cur.eventId;
    } else if (item === 'inning') {
      td.textContent = [cur.halfInning.at(0), String(cur.inning).padStart(2)].join('');
    } else if (item === 'result') {
      td.textContent = [cur.countsAsStealAttempt ? '' : '*', abbr(cur.scoring)].join('') || '-';
    } else if (['runner', 'batter', 'pitcher', 'catcher', 'venue'].includes(item)) {
      td.textContent = cur[item].boxscoreName || '-';
    } else if (item === 'movies') {
      td.replaceChildren(...moviesToTd(cur), addButton);
    } else {
      td.textContent = cur[item] ?? '-';
    }
  });
  return tr;
}

function abbr(str) {
  return { 'StolenBase': 'SB', 'CaughtStealing': 'CS', 'PickedOff': 'PO' }[str];
}

function createAnchor(url, text) {
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('target', '_blank');
  a.textContent = text ?? url;
  return a;
}

function urlToAnchor(movieObj) {
  const a = createAnchor(movieObj.url, 1);
  return [a];
}

function multiMovies(movies) {
  const a = document.createElement('a');
  a.href = '#';
  a.textContent = movies.length;
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const dialog = e.currentTarget.closest('td').querySelector('button[data-dialog="addMovie"]');
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  return [a];
}

function moviesToTd(cur) {
  if (cur.movies.length > 1) {
    console.log(cur.eventId);
    return multiMovies(cur.movies);
  } else if (cur.movies.length === 1) {
    return urlToAnchor(cur.movies.at(0));
  } else {
    return [];
  }
}

function postMovieData(data) {
  const targetUrl = 'https://kurimable.sakura.ne.jp/logger/movies.php';
  data.uuid = localStorage.getItem('id') ?? self.crypto.randomUUID();
  localStorage.setItem('id', data.uuid);
  fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(console.log);
}

function isEquivalentMovie(obj1, obj2) {
  return obj1.eventId === obj2.eventId && obj1.movie.url === obj2.movie.url;
}


