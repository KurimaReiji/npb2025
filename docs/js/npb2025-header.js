const css = `<style>
:host {
  --npb-blue: #2862ae;}
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
a {
  display: block;
  color: white;
  text-decoration: none;
  padding: 0;
  width: 5.25em;
  text-align: center;
}


</style>`;

class NpbHeader extends HTMLElement {
  static get observedAttributes() {
    return [];
  }

  constructor() {
    super();
    this.render(this.getAttribute('title') ?? '');
  }

  render(title) {
    const html = `
<div>
<ul>
  <li><a title="Home" href="https://kurimareiji.github.io/npb2025/index.html">NPB 2025</a></li>
  <li>${title}</li>
</ul>
</div>
    `;
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `${css}${html}`;

  }

  connectedCallback() {
  }
}

if (!customElements.get("npb-header")) {
  customElements.define("npb-header", NpbHeader);
}
