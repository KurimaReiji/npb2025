import data from '../npb2025-baserunning-summary.json' with { type: "json" };

const teamCodes = ["G", "T", "DB", "C", "S", "D", "H", "F", "M", "E", "B", "L"];

const catcherTemplate = `
  <div class="container" data-team>
    <header>
      <div>選手</div>
      <div data-item-ja="企図数" data-item="ATT">企図数</div>
      <div data-item-ja="許盗塁" data-item="SB">許盗塁</div>
      <div data-item-ja="盗塁刺" data-item="CS">盗塁刺</div>
      <div data-item-ja="重盗" data-item="DS">重盗</div>
      <div data-item-ja="盗塁阻止率" data-item="CS%">盗塁阻止率</div>
    </header>
    <div class="rows"></div>
  </div>
`;

class NpbBaserunning extends HTMLElement {
  static get observedAttributes() {
    return ["lang", "league", "table", "focus"];
  }

  constructor() {
    super();

    const self = this;
    self.updatePending = false;
    self.currentAttributes = {};

    self.render();
  }

  render() {
    const npbcolors = new URL('../css/npb2025-colors.css', import.meta.url).href;
    const css = `
    <link rel="stylesheet" href="${npbcolors}">
    <style>
    :host {
      display: block;
      font-size: var(--npb-baserunning-font-size, min(4.0vw, 1.25rem));
      line-height: 1.5;
      --row-padding: .25rem;
      --col-padding: .25rem;
    }

    [data-team] {
      --team-color: hsl(var(--hue) var(--saturation) var(--lightness) / var(--alpha-value));
      --team-bgcolor: hsl(var(--hue) var(--saturation) var(--lightness) / var(--alpha-bg));
    }

    [data-team="B"] {
      --hue: var(--buffaloes-hue);
      --saturation: var(--buffaloes-saturation);
      --lightness: var(--buffaloes-lightness);
    }

    [data-team="H"] {
      --hue: var(--hawks-hue);
      --saturation: var(--hawks-saturation);
      --lightness: var(--hawks-lightness);
    }

    [data-team="L"] {
      --hue: var(--lions-hue);
      --saturation: var(--lions-saturation);
      --lightness: var(--lions-lightness);
    }

    [data-team="E"] {
      --hue: var(--eagles-hue);
      --saturation: var(--eagles-saturation);
      --lightness: var(--eagles-lightness);
    }

    [data-team="M"] {
      --hue: var(--marines-hue);
      --saturation: var(--marines-saturation);
      --lightness: var(--marines-lightness);
    }

    [data-team="F"] {
      --hue: var(--fighters-hue);
      --saturation: var(--fighters-saturation);
      --lightness: var(--fighters-lightness);
    }

    [data-team="S"] {
      --hue: var(--swallows-hue);
      --saturation: var(--swallows-saturation);
      --lightness: var(--swallows-lightness);
    }

    [data-team="DB"] {
      --hue: var(--baystars-hue);
      --saturation: var(--baystars-saturation);
      --lightness: var(--baystars-lightness);
    }

    [data-team="T"] {
      --hue: var(--tigers-hue);
      --saturation: var(--tigers-saturation);
      --lightness: var(--tigers-lightness);
    }

    [data-team="G"] {
      --hue: var(--giants-hue);
      --saturation: var(--giants-saturation);
      --lightness: var(--giants-lightness);
    }

    [data-team="C"] {
      --hue: var(--carp-hue);
      --saturation: var(--carp-saturation);
      --lightness: var(--carp-lightness);
    }

    [data-team="D"] {
      --hue: var(--dragons-hue);
      --saturation: var(--dragons-saturation);
      --lightness: var(--dragons-lightness);
    }
    
    :host-context([table="catcher"]),
    :host-context([table="pitcher"]),
    :host-context([table="runner"]) {
      --template-columns: 1fr repeat(5, max-content);
    }
    :host-context([table="pitcher"]),
    :host-context([table="runner"]) {
      --att-display: none;
    }

    :host-context([focus]) {
      --team-unfocus: none;
    }

    .grid {
      display: grid;
      grid-template-columns: var(--template-columns);
      width: fit-content;
      margin-inline: auto;
      row-gap: 1em;
    }

    .league {
      display: none;
      grid-template-columns: subgrid;
      grid-column: 1 / -1;
      width: min-content;
      box-sizing: content-box;
      padding: min(1vw, 5px);
    }

    .league:has(.container:not(.unfocused)) {
      display: grid;
    }

    .container {
      display: grid;
      grid-template-columns: subgrid;
      grid-column: span 6;
      overflow: auto;
      box-sizing: border-box;
      padding-inline: 0;
      background-color: var(--team-bgcolor);

      &.unfocused {
        display: none;
      }

      &:not(.container:last-of-type){
        margin-block-end: min(1vw, 8px);
      }
    }

    header {
      display: grid;
      grid-template-columns: subgrid;
      grid-column: 1 / -1;
      font-size: .8em;
      border-top: solid 6px var(--team-color);
      line-height: 1.5;
      word-break: keep-all;
      padding-inline: var(--row-padding, 3em);
      background-color: var(--team-bgcolor);

      &>div {
        padding-inline-start: var(--col-padding);
        padding-inline-end: var(--col-padding);
        text-align: center;

        &:nth-of-type(1) {
          text-align: left;
          padding-inline-start: 0;
        }

        &:nth-last-of-type(1) {
          padding-inline-end: 0;
        }
      }

      &>div:lang(en) {
        text-align: right;
        padding-inline-end: calc(3 * var(--col-padding));

        &:nth-of-type(1) {
          text-align: left;
        }

        &:nth-last-of-type(1) {
          padding-inline-end: calc(1 * var(--col-padding));
        }
      }

      [data-item-ja="盗塁"] {
        padding-inline: calc(3 * var(--col-padding));
      }
    }

    .container .rows>div {
      display: grid;
      grid-template-columns: subgrid;
      grid-column: 1 / -1;
    }

    div {
      box-sizing: border-box;
    }

    .row {
      padding-inline: var(--row-padding, 3em);
      
      &>div:nth-of-type(1) {
        padding-inline-start: 0;
        padding-inline-end: var(--col-padding, 0);
      }
      
      &>div:nth-of-type(n+2) {
        text-align: right;
        padding-inline-end: calc(3 * var(--col-padding));
        letter-spacing: .05em;
      }

      &>div:lang(en):nth-last-of-type(1) {
        padding-inline-end: calc(1 * var(--col-padding));
      }

      &:nth-of-type(1) {
        border-top: solid 1px var(--team-color);
      }

      &:has([data-item="Catchers"]),
      &:nth-last-of-type(1) {
        border-top: solid 1px var(--team-color);
        border-bottom: solid 2px var(--team-color);
        background-color: var(--team-bgcolor);
      }

      &:nth-last-of-type(1) {
        border-bottom: solid 3px var(--team-color);
      }
    }

    .player:lang(ja) {
      text-align-last: justify;

      &[data-item="Duplantier, Jon"],
      &[data-item="Wingenter, Trey"],
      &.narrow {
        letter-spacing: -.1em;
      }
    }

    .updated {
      text-align: right;
      grid-column: 1 / -1;
      font-size: .8em;
      padding-inline-end: var(--row-padding,0);
    }

    .rows,
    .contents {
      display: contents;
    }

    [data-item="ATT"]{
      display: var(--att-display, block);
    }

    .initials {
      display: inline-block;
      white-space: nowrap;
    }

    div:lang(ja):has(>.initials) {
      display: grid;
      grid-template-columns: auto 1fr;
    }
    </style>`;
    const html = `
  <div class="grid">
    <div class="league" data-league="Central">
      <div class="updated"></div>
      <div class="contents"></div>
    </div>
    <div class="league" data-league="Pacific">
      <div class="updated"></div>
      <div class="contents"></div>
    </div>
  </div>
  <template id="catcherTemplate">
  ${catcherTemplate}
  </template>
  <template id="pitcherTemplate">
  ${catcherTemplate}
  </template>
  <template id="runnerTemplate">
  ${catcherTemplate.replace(/阻止率/g, '成功率').replace('CS%', 'SB%').replace('許盗塁', '盗塁')}
  </template>
    `;
    const self = this;
    const shadow = self.attachShadow({ mode: "open" });
    shadow.innerHTML = `${css}${html}`;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.currentAttributes[name] = newValue;
    this.requestUpdate();
  }

  requestUpdate() {
    const self = this;
    if (self.updatePending) {
      return;
    }

    self.updatePending = true;

    Promise.resolve().then(() => {
      self.updatePending = false;
      self.performUpdate();
    });
  }

  performUpdate() {
    const self = this;
    const target = self.currentAttributes['table'] || 'none';
    const lang = self.currentAttributes['lang'] || document.documentElement.lang;
    const focusedTeams = self.currentAttributes['focus'] || '';
    updateTable(self, data, target, lang, focusedTeams);
  }

  connectedCallback() { }
}

function createRowElement(rowData, playerKey) {
  const playerInfo = rowData[playerKey] || {};
  const jaName = playerInfo.jaRegisteredName ? playerInfo.jaRegisteredName.replace("　", " ") : '';
  const enName = playerInfo.fullLFMName || '';

  const div = document.createElement("div");
  div.classList.add("row");

  const colKeys = ['name', 'att', 'sb', 'cs', 'ds', 'rate'];
  const cols = colKeys.map((key, i) => {
    const colDiv = document.createElement("div");

    const content = key === 'name' ? jaName : rowData[key];
    colDiv.textContent = content;

    const itemLabels = ['Player', 'ATT', 'SB', 'CS', 'DS', 'rate'];
    colDiv.dataset.item = itemLabels[i];

    if (i === 0) {
      colDiv.classList.add("player");
      colDiv.dataset.itemJa = jaName;
      colDiv.dataset.item = enName;
    }
    return colDiv;
  });

  div.replaceChildren(...cols);
  return div;
};

function updateTable(self, data, target = 'catcher', lang, focusedTeams) {
  const shadow = self.shadowRoot;
  const containerTemplate = shadow.getElementById(`${target}Template`).content;

  const targetConfig = {
    catcher: {
      players: data.catchers,
      playerKey: 'catcher',
      teamDataKey: 'defence',
      totalRowLabel: { ja: 'チーム合計', en: 'Team Total' },
      additionalRows: (team) => {
        const pickoffs = Object.values(team.defence.pickoff).reduce((a, c) => a + c, 0);
        return [
          {
            catcher: { jaRegisteredName: '捕手計', fullLFMName: 'Catchers' },
            att: '', sb: team.defence.sb, cs: team.defence.cs, ds: team.defence.ds, rate: (team.defence.cs / team.defence.att).toFixed(3).replace(/0/, ''),
          },
          {
            catcher: { jaRegisteredName: `牽制など (${pickoffs})`, fullLFMName: `Pickoffs (${pickoffs})` },
            att: '', sb: team.defence.pickoff.sb, cs: team.defence.pickoff.cs, ds: '', rate: '',
          },
        ];
      }
    },
    pitcher: {
      players: data.pitchers,
      playerKey: 'pitcher',
      teamDataKey: 'defence',
      totalRowLabel: { ja: 'チーム合計', en: 'Team Total' },
      additionalRows: () => [],
    },
    runner: {
      players: data.runners,
      playerKey: 'runner',
      teamDataKey: 'offence',
      totalRowLabel: { ja: 'チーム合計', en: 'Team Total' },
      additionalRows: () => [],
    }
  };

  const config = targetConfig[target];

  const containers = teamCodes.map((teamCode) => {
    const team = data.teams.find((o) => o.teamCode === teamCode);
    const container = containerTemplate.firstElementChild.cloneNode(true);
    container.dataset.team = teamCode;

    const playerStats = config.players
      .filter((cur) => cur[config.playerKey].teamCode === teamCode)
      .map((p) => {
        if (target !== 'catcher') {
          return Object.assign({}, p, {
            sb: p.sb + p.pickoff.sb,
            cs: p.cs + p.pickoff.cs,
            att: p.att + p.pickoff.sb + p.pickoff.cs
          });
        }
        return p;
      });

    const teamTotalRow = {
      [config.playerKey]: { jaRegisteredName: config.totalRowLabel.ja, fullLFMName: config.totalRowLabel.en },
      att: team[config.teamDataKey].sb + (team[config.teamDataKey].pickoff?.sb || 0) + team[config.teamDataKey].cs + (team[config.teamDataKey].pickoff?.cs || 0),
      sb: team[config.teamDataKey].sb + (team[config.teamDataKey].pickoff?.sb || 0),
      cs: team[config.teamDataKey].cs + (team[config.teamDataKey].pickoff?.cs || 0),
      ds: team[config.teamDataKey].ds,
      rate: team[config.teamDataKey].rate,
    };

    const rowsData = playerStats.concat(
      config.additionalRows(team),
      (target === 'xcatcher' ? [] : [teamTotalRow])
    );

    const rows = rowsData.map((rowData) => createRowElement(rowData, config.playerKey));

    container.querySelector('.rows').replaceChildren(...rows);
    container.querySelector('header>div:nth-of-type(1)').textContent = team.teamName;
    return container;
  });

  shadow.querySelector(`[data-league="Central"]>.contents`).replaceChildren(...containers.slice(0, 6));
  shadow.querySelector(`[data-league="Pacific"]>.contents`).replaceChildren(...containers.slice(6));
  shadow.querySelectorAll(".updated").forEach((el) => {
    el.textContent = ['2025-03-28', data.updated].join('/');
  });
  updateLang(lang, self.shadowRoot);
  updateFocused(focusedTeams, self.shadowRoot);
}

function updateLang(lang, root) {
  if (lang.toLowerCase() === 'ja') {
    [...root.querySelectorAll('header>div[data-item-ja],[data-item].player')].forEach(applyInitials);
  } else {
    [...root.querySelectorAll('header>div[data-item],[data-item].player')].forEach((div) => div.textContent = div.dataset.item);
  }
}

function updateFocused(teams, root) {
  const filtered = teams.split(",")
    .map((teamCode) => teamCode.trim().toUpperCase())
    .filter((teamCode) => teamCodes.includes(teamCode));
  if (filtered.length > 0) {
    [...root.querySelectorAll('.container')].forEach((elm) => elm.classList.add('unfocused'));
    filtered.forEach((team) => {
      root.querySelector(`.container[data-team="${team}"]`).classList.remove('unfocused');
    });
  }
}

function applyInitials(div) {
  div.textContent = div.dataset.itemJa
  const m = div.textContent.match(/([Ａ-Ｚ]．)(.*)/);
  if (/[Ａ-Ｚ]．/.test(div.textContent)) {
    const span = document.createElement("span");
    span.classList.add("initials");
    span.textContent = m[1];
    const lastName = document.createElement("span");
    lastName.textContent = m[2]
    div.replaceChildren(span, lastName);
  }
}

if (!customElements.get("npb-baserunning")) {
  customElements.define("npb-baserunning", NpbBaserunning);
}