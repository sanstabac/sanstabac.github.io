/* Sans Tabac — shared app.js */

const SansTabac = (() => {
  let _photos = null;

  // ── DATA ──────────────────────────────────────────────────────────────────

  async function loadPhotos() {
    if (_photos) return _photos;
    // Walk up from wherever this script lives to find data/photos.json
    const base = getBase();
    const res = await fetch(`${base}data/photos.json`);
    if (!res.ok) throw new Error("Could not load photo manifest");
    _photos = await res.json();
    return _photos;
  }

  function getBase() {
    // Works whether site is at root or in a subdir (e.g. /sans-tabac/)
    const scripts = document.querySelectorAll("script[src*='app.js']");
    if (scripts.length) {
      const src = scripts[scripts.length - 1].src;
      return src.replace(/js\/app\.js.*$/, "");
    }
    return "/";
  }

  // ── FILTERING ─────────────────────────────────────────────────────────────

  function filter(photos, { constructor, year, brand, livery, q } = {}) {
    return photos.filter(p => {
      if (constructor && p.constructor.toLowerCase() !== constructor.toLowerCase()) return false;
      if (year && String(p.year) !== String(year)) return false;
      if (brand && p.brand.toLowerCase() !== brand.toLowerCase()) return false;
      if (livery && p.livery !== livery) return false;
      if (q) {
        const search = q.toLowerCase();
        const haystack = [p.constructor, p.brand, String(p.year), p.description, p.livery].join(" ").toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }

  // ── AGGREGATION ───────────────────────────────────────────────────────────

  function groupBy(photos, key) {
    return photos.reduce((acc, p) => {
      const k = p[key];
      if (!acc[k]) acc[k] = [];
      acc[k].push(p);
      return acc;
    }, {});
  }

  function uniqueValues(photos, key) {
    return [...new Set(photos.map(p => p[key]))].sort();
  }

  function stats(photos) {
    return {
      total: photos.length,
      full: photos.filter(p => p.livery === "full").length,
      sans: photos.filter(p => p.livery === "sans").length,
      constructors: new Set(photos.map(p => p.constructor)).size,
      brands: new Set(photos.map(p => p.brand)).size,
      years: uniqueValues(photos, "year").map(Number),
    };
  }

  // ── URL PARAMS ────────────────────────────────────────────────────────────

  function getParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      constructor: p.get("constructor") || "",
      year: p.get("year") || "",
      brand: p.get("brand") || "",
      livery: p.get("livery") || "",
      q: p.get("q") || "",
    };
  }

  function browseUrl(filters) {
    const base = getBase();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    return `${base}browse.html${qs ? "?" + qs : ""}`;
  }

  // ── RENDERING ─────────────────────────────────────────────────────────────

  const TEAM_COLORS = {
    "Ferrari": "#e8002d",
    "McLaren": "#ff8000",
    "Williams": "#005aff",
    "Lotus": "#c8a800",
    "Benetton": "#0090ff",
    "BAR Honda": "#dc0000",
    "Jordan": "#f0a800",
    "Tyrrell": "#0070c0",
    "Renault": "#ffd700",
    "Arrows": "#f80",
    "Minardi": "#444",
    "Prost": "#1a7a3c",
    "Ligier": "#2060c8",
    "Brabham": "#1a5c1a",
    "Sauber": "#c0c0c0",
    "Stewart": "#c8a020",
    "Jaguar": "#007f50",
    "Toyota": "#cc0000",
    "Honda": "#c00020",
  };

  function teamColor(constructor) {
    return TEAM_COLORS[constructor] || "#c4a14a";
  }

  function photoCard(photo, opts = {}) {
    const { base = "" } = opts;
    const label = [photo.brand, photo.livery === "sans" ? "Sans Tabac" : "Full Livery"].join(" · ");
    const desc = [photo.year, photo.constructor, photo.description].filter(Boolean).join(" · ");

    return `
      <article class="photo-card" onclick="window.location='${base}photo.html?id=${encodeURIComponent(photo.id)}'">
        <div class="photo-card-img-wrap">
          <img
            src="${base}${photo.file}"
            alt="${desc}"
            loading="lazy"
            onerror="this.parentElement.classList.add('img-error'); this.remove()"
          >
          <div class="photo-card-livery ${photo.livery === "sans" ? "badge-sans" : "badge-full"}">
            ${photo.livery === "sans" ? "Sans Tabac" : "Full Livery"}
          </div>
        </div>
        <div class="photo-card-meta">
          <div class="photo-card-primary">
            <span class="photo-card-year">${photo.year}</span>
            <span class="photo-card-constructor" style="--tc:${teamColor(photo.constructor)}">${photo.constructor}</span>
          </div>
          <div class="photo-card-brand">${photo.brand}</div>
          ${photo.description ? `<div class="photo-card-desc">${photo.description}</div>` : ""}
        </div>
      </article>`;
  }

  function emptyState(message = "No photos found.") {
    return `<div class="empty-state">
      <div class="empty-state-icon">◎</div>
      <div class="empty-state-msg">${message}</div>
    </div>`;
  }

  // ── SHARED CSS ────────────────────────────────────────────────────────────
  // Injected dynamically so browse + photo pages share card styles

  const CARD_CSS = `
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
    }
    .photo-card {
      background: var(--bg-card);
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      flex-direction: column;
    }
    .photo-card:hover { background: var(--bg-hover); }
    .photo-card-img-wrap {
      position: relative;
      aspect-ratio: 3/2;
      overflow: hidden;
      background: #111;
      display: flex; align-items: center; justify-content: center;
    }
    .photo-card-img-wrap.img-error::after {
      content: "Image not found";
      font-family: 'DM Mono', monospace;
      font-size: 0.6rem;
      letter-spacing: 0.1em;
      color: var(--cream-dim);
      opacity: 0.4;
      text-transform: uppercase;
    }
    .photo-card-img-wrap img {
      width: 100%; height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    .photo-card:hover .photo-card-img-wrap img { transform: scale(1.04); }
    .photo-card-livery {
      position: absolute; bottom: 0.6rem; right: 0.6rem;
      font-family: 'DM Mono', monospace;
      font-size: 0.52rem; letter-spacing: 0.15em; text-transform: uppercase;
      padding: 0.2rem 0.5rem;
      border: 1px solid;
    }
    .badge-full { color: var(--gold); border-color: var(--gold); background: rgba(12,11,9,0.7); }
    .badge-sans { color: var(--cream-dim); border-color: var(--cream-dim); background: rgba(12,11,9,0.7); }
    .photo-card-meta { padding: 0.9rem 1rem 1rem; display: flex; flex-direction: column; gap: 0.3rem; }
    .photo-card-primary { display: flex; align-items: baseline; gap: 0.6rem; }
    .photo-card-year {
      font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem;
      color: var(--gold); line-height: 1; letter-spacing: 0.05em;
    }
    .photo-card-constructor {
      font-family: 'DM Mono', monospace; font-size: 0.6rem;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--tc, var(--gold)); opacity: 0.9;
    }
    .photo-card-brand {
      font-size: 0.85rem; color: var(--cream); font-weight: 300;
    }
    .photo-card-desc {
      font-family: 'DM Mono', monospace; font-size: 0.55rem;
      letter-spacing: 0.08em; color: var(--cream-dim); text-transform: uppercase;
    }
    .empty-state {
      grid-column: 1/-1; padding: 6rem 2rem; text-align: center;
      display: flex; flex-direction: column; gap: 1rem; align-items: center;
    }
    .empty-state-icon { font-size: 2.5rem; color: var(--gold-dim); opacity: 0.4; }
    .empty-state-msg { font-family: 'DM Mono', monospace; font-size: 0.65rem;
      letter-spacing: 0.2em; text-transform: uppercase; color: var(--cream-dim); }
  `;

  function injectCardStyles() {
    if (document.getElementById("st-card-css")) return;
    const style = document.createElement("style");
    style.id = "st-card-css";
    style.textContent = CARD_CSS;
    document.head.appendChild(style);
  }

  return { loadPhotos, filter, groupBy, uniqueValues, stats, getParams, browseUrl, photoCard, emptyState, teamColor, injectCardStyles, getBase };
})();
