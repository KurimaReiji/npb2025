class TableSelector extends HTMLElement {
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
      width: auto;
      height: fit-content;
      font-size: 1rem;
      position: sticky;
      top: 0;

      --npb-blue: #2862ae;
      --central-league-green: #0f8f2e;
      --pacific-league-blue: #3fb1e5;

      --h2-display: none;
    }

    .container {
      --bg-color: var(--npb-blue);
    }

    .container {
      margin-block-end: 5px;
      font-family: 'Noto Sans', sans-serif;
      background: var(--bg-color);
    }

    .container {
      box-shadow: rgb(0 0 0) 1px 0px 5px;
      overflow-x: auto;
      color: white;
      display: flex;

      padding-inline-start: .5em;
      padding-block: 8px;

      &>section {
        padding-inline: .5em;
        &:nth-of-type(1) {
          padding-inline: .5em 1em;
        }
        &:nth-of-type(n+2) {
          border-left: solid 1px white;
        }
      }
    }

    div {
      box-sizing: border-box;
    }

    a {
      display: block;
      text-align: center;
      text-decoration: none;
      color: currentColor;
    }

    .langs,
    .tables {
      display: grid;
      grid-template-columns: repeat(var(--count), 1fr);
      gap: 0.25em;
      margin-block: 0;
      padding-inline: .25em;
      list-style: none;

      & li {
        border-style: solid;
        border-width: 1px;
        border-color: transparent;

        &.current {
          box-shadow:
            inset 1px 1px 2px rgba(0, 0, 0, 0.8), 
            inset -1px -1px 2px rgba(255, 255, 255, 0.8);
        }
        &:has(a:hover):not(.current) {
          box-shadow:
            -1px -1px 2px rgba(255, 255, 255, 0.8),
            1px 1px 2px rgba(0, 0, 0, 0.8);
        }
      }
      & a {
        min-width: 1.75em;
      }
    }
    .langs {
      --count: 2;
    }
    .tables {
      --count: 3;
    }
    h1, h2 {
      margin-block: 0;
      font-size: 1em;
      font-weight: normal;
      text-align: center;
    }
    h2 {
      display: var(--h2-display, block);
      font-size: .85em;
    }
    </style>`;
    const html = `
  <div class="container">
    <section><h1><a href="https://kurimareiji.github.io/npb2025/index.html">NPB 2025</a></section>
    <section>
      <h2>Tables</h2>
      <ul class="tables">
        <li data-table="pitcher"><a href="baserunning.html?table=pitcher">P</a></li>
        <li data-table="catcher"><a href="baserunning.html?table=catcher">C</a></li>
        <li data-table="runner"><a href="baserunning.html?table=runner">R</a></li>
      </ul>
    </section>
    <section>
      <h2>Lang</h2>
      <ul class="langs">
        <li data-lang="en"><a href="baserunning.html?lang=en">en</a></li>
        <li data-lang="ja"><a href="baserunning.html?lang=ja">ja</a></li>
      </ul>
    </section>
  </div>
    `;
    const self = this;
    const shadow = self.attachShadow({ mode: "open" });
    shadow.innerHTML = `${css}${html}`;

    shadow.querySelectorAll('.tables a, .langs a').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        event.preventDefault();

        const currentUrl = new URL(window.location.href);
        const targetUrl = new URL(event.currentTarget.href);

        const newLang = targetUrl.searchParams.get('lang') || currentUrl.searchParams.get('lang') || 'en';
        const newTable = targetUrl.searchParams.get('table') || currentUrl.searchParams.get('table') || 'catcher';

        targetUrl.searchParams.set('lang', newLang);
        targetUrl.searchParams.set('table', newTable);
        document.dispatchEvent(new CustomEvent('TableSelected', {
          detail: { url: targetUrl }
        }));
        self.setCurrentTable(newLang, newTable);

      });
    });

    self.setCurrentTable();
  }

  setCurrentTable(lang, table) {
    const currentUrl = new URL(window.location.href);
    lang = lang || currentUrl.searchParams.get('lang') || 'en';
    table = table || currentUrl.searchParams.get('table') || 'catcher';
    const shadow = this.shadowRoot;
    const lis = shadow.querySelectorAll('.tables li, .langs li');
    lis.forEach((anchor) => {
      anchor.classList.remove('current');
      if (anchor.dataset.table === table || anchor.dataset.lang === lang) {
        anchor.classList.add('current');
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) { }

  connectedCallback() { }
}

if (!customElements.get("table-selector")) {
  customElements.define("table-selector", TableSelector);
}
