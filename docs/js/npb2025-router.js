const locationHandler = () => {
  const [_, site, app, ...opts] = location.pathname.split("/");
  let title;
  [...document.querySelectorAll(".container *")].forEach((app) => {
    //app.style.display = "none";
  });
  try {
    if (app === "above500") {
      const [league, ...rest] = opts;
      if (!["Central", "Pacific"].includes(league)) {
        throw new Error("not found");
      }
      title = `Games above .500, ${league} League 2025 | NPB 2025`;
      const above500 = document.querySelector("npb-above500");
      above500.style.display = "block";
      above500.setAttribute("league", league);
    } else {
      throw new Error("not found");
    }
  } catch (error) {
    console.log(error);
    window.location.href = "/npb2025/above500/Central";
  }

  document.querySelector("title").textContent = title;
}

const route = (e) => {
  e.preventDefault();
  if (e.target.href === window.location.href) return;
  window.history.pushState({}, null, e.target.href);
  locationHandler();
}

window.addEventListener("popstate", (_) => {
  locationHandler();
});

const css = `<style>
div {
  margin-block-end: 5px;
  font-family: 'Noto Sans', sans-serif;
  background: var(--npb-blue);
  box-shadow: rgb(0 0 0) 1px 0px 5px;
  overflow-x: auto;
}
ul {
  list-style: none;
  display: flex;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
li {
  white-space: nowrap;
}
div>ul {
  margin-block: 0;
  padding: 8px 0 8px .5em;
  width: 100%;
  color: white;
  height: 40px;
}
div>ul>li {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 0.5em;
}
div>ul>li:nth-of-type(n+2) {
  border-left: 1px solid white;
}
li>ul {
  padding-inline-start: .5em;
}
li>ul>li {
  margin-right: .25em;
}
[data-league="Central"] {
  --league-color: var(--central-league-green, crimson);
}
[data-league="Pacific"] {
  --league-color: var(--pacific-league-blue, crimson);
}
a {
  display: block;
  color: white;
  background: var(--league-color);
  text-decoration: none;
  padding: 0;
  width: 5.25em;
  text-align: center;
}
</style>`;

class NpbRouter extends HTMLElement {
  static get observedAttributes() {
    return ["league"];
  }

  constructor() {
    super();
  }

  render() {
    const html = `
<div>
<ul>
  <li><a href="https://github.com/KurimaReiji/npb2025">NPB 2025</a></li>
  <li>Above .500
  <ul>
    <li><a href="/npb2025/above500/Central" data-app="above500" data-league="Central">Central</a></li>
    <li><a href="/npb2025/above500/Pacific" data-app="above500" data-league="Pacific">Pacific</a></li>
  </ul>
</li>
</ul>
</div>
    `;
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `${css}${html}`;

    [...this.shadowRoot.querySelectorAll(`a[data-app]`)].forEach((a) => {
      a.addEventListener("click", route)
    });
  }
  connectedCallback() {
    this.render();
  }
}

customElements.define("npb-router", NpbRouter);
export { NpbRouter, route, locationHandler }
