import { load_font, svgdownload } from 'https://kurimareiji.github.io/mlb2025/js/mlb2025.js';
import { createViewportTransformer } from './chart-utils.js';
import standings from '../standings.json' with { type: 'json' };

const svgTemplate = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="none" viewBox="0 0 600 400" font-size="26">
  <style data-css="external"></style>
  <style data-css="fonts"></style>
  <style>
    #bgRect {
      fill: var(--bgcolor, cornsilk);
    }
    text {
      font-family: 'Noto Sans', Arial, sans-serif;
    }
    #title text {
      text-anchor: middle;
      alignment-baseline: middle;
    }
    .series {
      fill: none;
      stroke-linejoin: round;
      stroke-linecap: round;
    }
    .axis {
      fill: none;
      stroke-linecap: round;
      stroke: black;
      stroke-width: 2;
    }
    .tics {
      fill: none;
      stroke-linecap: round;
      stroke: gray;
      stroke-width: 1;
    }
    .tic-label {
      font-size: var(--small-font-size, 16px);
      font-family: 'Noto Sans Mono', sans-serif;
      alignment-baseline: middle;
      font-size: 100%;
    }
    .tic-label[data-x]{
      text-anchor: middle;
    }
    .tic-label[data-y]{
      text-anchor: end;
    }
    #yTics .tic-label {
      transform: translate(-.5em, 0);
    }
    #xTics .tic-label {
      transform: translate(0, .5em);
    }
    #gTitle {
      font-size: 120%;
    }
    #gSeries {
      --stroke-width: min(.3em, 10px);
    }
    #gSeries path {
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: var(--stroke-width);
      stroke: var(--team-color, black);
    }

    #gSeries path.highlight {
      stroke-width: min(calc(1.5 * var(--stroke-width)), 10px);
    }

    #gLabels text {
      fill: var(--team-text-color, var(--team-color));
      stroke: var(--team-text-color, var(--team-color));
      stroke-width: 1;
      font-family: 'Noto Sans', sans-serif;
      font-size: 100%;
      transform: translate(.5em, 0);
    }
  </style>
  <style>
#gSeries,
#gLabels {
  --alpha-value: 1;

  --giants-hue: 28;
  --giants-saturation: 95%;
  --giants-lightness: 51%;

  --tigers-hue: 40;
  --tigers-saturation: 78%;
  --tigers-lightness: 55%;

  --baystars-hue: 213;
  --baystars-saturation: 100%;
  --baystars-lightness: 28%;

  --carp-hue: 355;
  --carp-saturation: 87%;
  --carp-lightness: 44%;

  --swallows-hue: 152;
  --swallows-saturation: 100%;
  --swallows-lightness: 27%;

  --dragons-hue: 196;
  --dragons-saturation: 82%;
  --dragons-lightness: 52%;

  --hawks-hue: 42;
  --hawks-saturation: 100%;
  --hawks-lightness: 50%;

  --fighters-hue: 201;
  --fighters-saturation: 100%;
  --fighters-lightness: 30%;

  --marines-hue: 51;
  --marines-saturation: 0%;
  --marines-lightness: 51%;

  --eagles-hue: 344;
  --eagles-saturation: 100%;
  --eagles-lightness: 29%;

  --buffaloes-hue: 51;
  --buffaloes-saturation: 55%;
  --buffaloes-lightness: 47%;

  --lions-hue: 214;
  --lions-saturation: 100%;
  --lions-lightness: 15%;
}

[data-team-name] {
  --team-hsl-color: hsl(var(--hue) var(--saturation) var(--lightness) / var(--alpha-value));
}

[data-team-name="Giants"] {
  --hue: var(--giants-hue);
  --saturation: var(--giants-saturation);
  --lightness: var(--giants-lightness);
  --team-color: var(--giants-team-color, var(--team-hsl-color));
}

[data-team-name="Tigers"] {
  --hue: var(--tigers-hue);
  --saturation: var(--tigers-saturation);
  --lightness: var(--tigers-lightness);
  --team-color: var(--tigers-team-color, var(--team-hsl-color));
}

[data-team-name="Baystars"] {
  --hue: var(--baystars-hue);
  --saturation: var(--baystars-saturation);
  --lightness: var(--baystars-lightness);
  --team-color: var(--baystars-team-color, var(--team-hsl-color));
}

[data-team-name="Carp"] {
  --hue: var(--carp-hue);
  --saturation: var(--carp-saturation);
  --lightness: var(--carp-lightness);
  --team-color: var(--carp-team-color, var(--team-hsl-color));
}

[data-team-name="Swallows"] {
  --hue: var(--swallows-hue);
  --saturation: var(--swallows-saturation);
  --lightness: var(--swallows-lightness);
  --team-color: var(--swallows-team-color, var(--team-hsl-color));
}

[data-team-name="Dragons"] {
  --hue: var(--dragons-hue);
  --saturation: var(--dragons-saturation);
  --lightness: var(--dragons-lightness);
  --team-color: var(--dragons-team-color, var(--team-hsl-color));
}

[data-team-name="Hawks"] {
  --hue: var(--hawks-hue);
  --saturation: var(--hawks-saturation);
  --lightness: var(--hawks-lightness);
  --team-color: var(--hawks-team-color, var(--team-hsl-color));
}

[data-team-name="Fighters"] {
  --hue: var(--fighters-hue);
  --saturation: var(--fighters-saturation);
  --lightness: var(--fighters-lightness);
  --team-color: var(--fighters-team-color, var(--team-hsl-color));
}

[data-team-name="Marines"] {
  --hue: var(--marines-hue);
  --saturation: var(--marines-saturation);
  --lightness: var(--marines-lightness);
  --team-color: var(--marines-team-color, var(--team-hsl-color));
}

[data-team-name="Eagles"] {
  --hue: var(--eagles-hue);
  --saturation: var(--eagles-saturation);
  --lightness: var(--eagles-lightness);
  --team-color: var(--eagles-team-color, var(--team-hsl-color));
}

[data-team-name="Buffaloes"] {
  --hue: var(--buffaloes-hue);
  --saturation: var(--buffaloes-saturation);
  --lightness: var(--buffaloes-lightness);
  --team-color: var(--buffaloes-team-color, var(--team-hsl-color));
}

[data-team-name="Lions"] {
  --hue: var(--lions-hue);
  --saturation: var(--lions-saturation);
  --lightness: var(--lions-lightness);
  --team-color: var(--lions-team-color, var(--team-hsl-color));
}

  </style>
  <clipPath id="clipPath">
    <rect x="0" y="0" width="1600" height="1600"/>
  </clipPath>
  <rect x="0" y="0" width="1600" height="1600" stroke="none" id="bgRect"/>
  <g id="gTics">
    <g id="yTics">
      <g>
        <path d="" class="tics"/>
        <text class="tic-label"></text>
      </g>
    </g>
    <g id="xTics">
      <g>
        <path d="" class="tics"/>
        <text class="tic-label"></text>
      </g>
    </g>
  </g>
  <g class="gAxis">
    <path d="" class="axis" id="x-axis"/>
    <path d="" class="axis" id="y-axis"/>
  </g>
  <g id="gSeries" clip-path="url(#clipPath)">
    <path d="" fill="none" />
  </g>
  <g id="gLabels">
    <text alignment-baseline="middle"></text>
  </g>
  <g id="gTitle">
    <text x="50%" class="title" text-anchor="middle" alignment-baseline="middle"></text>
  </g>
</svg>
`;

class NpbAbove500 extends HTMLElement {
  static get observedAttributes() {
    return ["league", "x-offset", "y-offset", "y-limit", "highlight"];
  }

  constructor() {
    super();

    const self = this;
    self.updatePending = false;
    self.currentAttributes = {};

    self.data = loadData();

    self.addEventListener("DownloadSVG", async ({ detail }) => {
      const opts = Object.assign({
        league: 'Central',
        width: 1600,
        height: 900,
        xOffset: 0,
        yOffset: -100,
        yLimit: 100,
        fontSize: 26,
        highlight: "Dragons",
      }, detail
      );
      const data = self.data.find(d => d.league === opts.league) || self.data[0];
      const clone = self.shadowRoot.querySelector('template').content.cloneNode(true).querySelector('svg');

      const svg = createChart(clone, data, opts);
      svg.setAttributeNS(null, "width", opts.width);
      svg.setAttributeNS(null, "height", opts.height);
      opts.filename = opts.filename || `npb-above500-${opts.league}.png`;
      svg.setAttributeNS(null, 'download', opts.filename);
      self.shadowRoot.querySelector('div').append(svg);
      const waitForFonts = [
        { name: "Noto Sans Mono", url: "https://kurimareiji.github.io/mlb2025/fonts/NotoSansMono-Regular.ttf" },
        { name: "Noto Sans", url: "https://kurimareiji.github.io/mlb2025/fonts/NotoSans-Regular.ttf" },
      ].map(load_font);
      const fonts = await Promise.all(waitForFonts)
        .then(css => css.join("\n"));
      svg.querySelector(`style[data-css="fonts"]`).textContent = fonts;
      fix_overlapping([...svg.querySelectorAll("#gLabels text")]);
      svg.setAttribute('font-size', opts.fontSize);
      await svgdownload(opts.filename, svg);
      svg.remove();
    });

    self.render();
  }

  render() {
    const css = `
    <style>
    :host {
      display: block;
    }
    div { height: var(--height, 100%); width: var(--width, auto); }
    svg { display: block; }
    svg[download] { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;}

    </style>`;
    const html = `
    <template>${svgTemplate}</template>
    <div></div>
    `;
    const self = this;
    const shadow = self.attachShadow({ mode: "open" });
    shadow.innerHTML = `${css}${html}`;

    const container = shadow.querySelector("div");
    ["width", "height"].forEach((prop) => {
      const value = getComputedStyle(container)[prop];
      self[prop] = Math.floor(Number(value.replace("px", "")));
      container.style.setProperty(`--${prop}`, value);
    });
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
    const league = self.currentAttributes['league'] || 'Central';
    const data = self.data.find(d => d.league === league) || self.data[0];
    const xOffset = Number(self.currentAttributes['x-offset']) || 0;
    const yOffset = Number(self.currentAttributes['y-offset']) || -100;
    const yLimit = Number(self.currentAttributes['y-limit']) || 100;
    const highlight = self.currentAttributes['highlight'] || 'none';
    updateChart(self, data, { width: self.width, height: self.height, xOffset, yOffset, yLimit, highlight });
  }

  connectedCallback() { }
}

function loadData() {
  const data = ['Central', 'Pacific'].map((league, idx) => {
    const series = standings.records[idx].teamRecords
      .map(({ teamName, pct, wins, losses, overall }) => {
        const over500 = wltToGamesOver500(overall.wlt);
        const min = Math.min(...over500);
        const max = Math.max(...over500);
        const history = over500.map((n, i) => ({ x: i + 1, y: n }));
        return {
          wins, losses, teamName, pct, min, max, history,
        }
      });
    const yMin = Math.min(...series.map(({ min }) => min));
    const yMax = Math.max(...series.map(({ max }) => max));
    const xMax = Math.max(...series.map(({ history }) => history.length));
    return {
      league, series, yDomain: [yMax + 2, yMin - 2], xDomain: [0, Math.min(xMax + 1, 143)],
    }
  });
  return data;
}

function getFontSize(width, min = 26, max = 34) {
  // [1600, 26px] [600, 34px]
  const slope = (min - max) / (1600 - 600);
  const intercept = max - slope * 600;
  const rawSize = slope * width + intercept;

  return Number(Math.max(min, Math.min(rawSize, max)).toFixed(1));
}

function updateChart(self, data, opts) {
  opts.fontSize = getFontSize(self.width);

  const clone = self.shadowRoot.querySelector('template').content.cloneNode(true).querySelector('svg');
  const svg = createChart(clone, data, opts);
  const container = self.shadowRoot.querySelector("div");
  container.replaceChildren(svg);
  fix_overlapping([...svg.querySelectorAll("#gLabels text")]);
  svg.setAttribute('font-size', opts.fontSize);
}

function createChart(svg, data, { width = 1200, height = 675, xOffset = 0, yOffset, yLimit, highlight, fontSize = 26 }) {
  const league = data.league;
  const viewHeight = Math.trunc((height / width) * 1600);
  let paddingLeft = fontSize * 3, paddingRight = fontSize * 8, paddingTop = fontSize * 1.2 * 2.4, paddingBottom = fontSize * 2;
  const xRange = [paddingLeft, 1600 - paddingRight];
  const yRange = [paddingTop, viewHeight - paddingBottom];
  const xDomain = [Math.max(data.xDomain[0], xOffset), data.xDomain[1]];
  const yDomain = [1 + Math.min(data.yDomain[0], yLimit), -1 + Math.max(data.yDomain[1], yOffset)];
  const series = data.series;

  const to_vx = createViewportTransformer(xDomain, xRange);
  const to_vy = createViewportTransformer(yDomain, yRange);
  updateBgRect({ svg, width, height });
  svg.querySelector('#clipPath rect').setAttribute('x', to_vx(xDomain[0]));
  svg.querySelector('#clipPath rect').setAttribute('y', to_vy(yDomain[0]));
  svg.querySelector('#clipPath rect').setAttribute('width', Math.abs(to_vx(xDomain[0]) - to_vx(xDomain[1])));
  svg.querySelector('#clipPath rect').setAttribute('height', Math.abs(to_vy(yDomain[0]) - to_vy(yDomain[1])));
  const axis = {
    x: [
      [xDomain[0], 0],
      [xDomain[1], 0]
    ],
    y: [
      [xDomain[0], yDomain[0]],
      [xDomain[0], yDomain[1]]
    ],
  };
  updateAxis({ svg, axis, to_vx, to_vy });
  updateTics({ svg, xDomain, yDomain, to_vx, to_vy });
  updateTitle({ svg, league, paddingTop });
  updateSeries({ svg, to_vx, to_vy, series, xRange, yDomain });
  svg.querySelector(`path[data-team-name="${highlight}"]`)?.classList.add("highlight");

  return svg;
}

function wltToGamesOver500(wlt) {
  return wlt.split("")
    .map((s) => ['L', 'T', 'W'].indexOf(s) - 1)
    .map((_, i, ary) => ary.slice(0, i + 1).reduce((a, c) => a + c, 0))
    ;
}

function fix_overlapping(targets) {
  function trunc2(n) {
    return Number(n.toFixed(2));
  }

  if (targets.length === 0) return;
  const isOverlapped = (y, i, ary) => {
    if (!ary[i + 1]) return false;
    return y + h > ary[i + 1];
  };
  const h = targets[0].getBBox().height;
  const step = h * 0.125;
  let bboxes = targets.map((el) => el.getBBox().y);

  while (bboxes.some(isOverlapped)) {
    const idx0 = bboxes.findIndex(isOverlapped);
    const label0 = targets[idx0];
    const y0 = Number(label0.getAttribute("y"));
    label0.setAttribute("y", trunc2(y0 - step));

    const label1 = targets[idx0 + 1];
    const y1 = Number(label1.getAttribute("y"));
    label1.setAttribute("y", trunc2(y1 + step));
    bboxes = targets.map((el) => el.getBBox().y);
  }
};

function updateSeries({ svg, to_vx, to_vy, series, xRange, yDomain, }) {
  const reversed = series.reverse()
    .map((o) => {
      const d = o.history
        .map(({ x, y }) => ({ x: to_vx(x), y: to_vy(y) }))
        .reduce((a, c) => {
          return `${a} L ${c.x} ${c.y}`;
        }, [`M ${to_vx(0)} ${to_vy(0)}`]);
      const path = svg.querySelector("#gSeries path").cloneNode(true);
      path.setAttribute("d", d);
      ["teamName", "wins", "losses"].forEach((item) => {
        path.dataset[item] = o[item];
      });
      path.classList.add(o.teamName);
      return path;
    });
  svg.querySelector("#gSeries").replaceChildren(...reversed);

  const x = xRange[1];
  const labels = series.reverse()
    .map(({ teamName, pct, wins, losses, history }) => {
      const text = svg.querySelector("#gLabels text").cloneNode(true);
      text.textContent = `${pct} ${teamName}`;
      [["teamName", teamName], ["wins", wins], ["losses", losses]].forEach(([k, v]) => {
        text.dataset[k] = v;
      });
      const y = Math.max(yDomain[1], Math.min(yDomain[0], history.at(-1).y));
      text.setAttribute("x", x);
      text.setAttribute("y", to_vy(y));
      text.classList.add(teamName);
      return text;
    });
  svg.querySelector("#gLabels").replaceChildren(...labels);
}

function updateTitle({ svg, league = "Central", season = 2025, paddingTop }) {
  const title_y = 0.5 * paddingTop;// Number(params["padding-top"]);
  const title = `Games above .500, ${league} League ${season}`;
  const text = svg.querySelector("#gTitle text");
  text.textContent = title;
  text.setAttribute("y", title_y)
}

function updateTics({ svg, xDomain, yDomain, to_vx, to_vy }) {
  const ys = [...new Array(30)]
    .map((n, i) => i * 5 - 100)
    .filter((n) => n < yDomain[0] && n > yDomain[1])
    .map((n) => ({ x: xDomain[0], y: n }))
    .map(({ x, y }) => {
      const d = `M ${to_vx(xDomain[0])} ${to_vy(y)} L ${to_vx(xDomain[1])} ${to_vy(y)}`;
      const tic = svg.querySelector("#yTics path").cloneNode(true);
      tic.setAttribute("d", d);
      tic.dataset.y = y;
      const label = svg.querySelector("#yTics .tic-label").cloneNode(true);
      label.setAttribute("x", to_vx(x));
      label.setAttribute("y", to_vy(y));
      label.textContent = y;
      label.dataset.y = y;
      const grp = svg.querySelector("#yTics g").cloneNode(true);
      grp.replaceChildren(tic, label);
      return grp;
    });
  svg.getElementById("yTics").replaceChildren(...ys);

  const xs = "0,10,20,30,40,50,60,70,80,90,100,110,120,130,140,143"
    .split(",")
    .map((s) => Number(s))
    .filter((n) => n <= xDomain[1])
    .filter((n) => n >= xDomain[0])
    .map((n) => ({ x: n, y: yDomain[1] }))
    //.filter((xy, _, a) => (a.length > 12 ? xy.x % 20 === 0 : true))
    .filter((xy, _, a) => (xy.x % 10 === 0 || xy.x === 162))
    .map(({ x, y }) => {
      const d = `M ${to_vx(x)} ${to_vy(yDomain[0])} L ${to_vx(x)} ${to_vy(yDomain[1])}`;
      const tic = svg.querySelector("#xTics path").cloneNode(true);
      tic.setAttribute("d", d);
      tic.dataset.x = x;
      const label = svg.querySelector("#xTics .tic-label").cloneNode(true);
      label.setAttribute("x", to_vx(x));
      label.setAttribute("y", to_vy(y));
      label.setAttribute("dy", 8);
      label.textContent = x;
      label.dataset.x = x;
      const grp = svg.querySelector("#xTics g").cloneNode(true);
      if (x === 162) {
        grp.replaceChildren(tic);
      } else {
        grp.replaceChildren(tic, label);
      }
      return grp;
    });
  svg.getElementById("xTics").replaceChildren(...xs);
}

function updateAxis({ svg, axis, to_vx, to_vy }) {
  const d_axis_x = `M ${to_vx(axis.x[0][0])} ${to_vy(axis.x[0][1])} L ${to_vx(axis.x[1][0])} ${to_vy(axis.x[1][1])}`;
  const d_axis_y = `M ${to_vx(axis.y[0][0])} ${to_vy(axis.y[0][1])} L ${to_vx(axis.y[1][0])} ${to_vy(axis.y[1][1])}`;
  svg.getElementById("x-axis").setAttribute("d", d_axis_x);
  svg.getElementById("y-axis").setAttribute("d", d_axis_y);
}

function updateBgRect({ svg, width = 1600, height = 900 }) {
  svg.setAttribute("viewBox", `0 0 1600 ${Math.trunc((height / width) * 1600)}`);
  const bgRect = svg.getElementById("bgRect");
  const box = svg.viewBox.baseVal;
  bgRect.setAttribute("width", box.width);
  bgRect.setAttribute("height", box.height);
}

customElements.define("npb-above500", NpbAbove500);
export { NpbAbove500 };
