/* Portfolio app v7 — multi-page.
   Architecture: five pages share one shell (header nav, footer page index,
   resume dialog); portfolio.json stays the single source of content;
   <body data-page> selects which sections render. Page-to-page motion uses
   same-origin View Transitions where the browser supports them (the
   <meta name="view-transition"> in each <head>) — plain navigation elsewhere.
   Home renders: hero, ticker, about (+ certificate emblem strip), featured
   work, contact. Work renders every project; About renders about (+ emblem
   strip), skills and background; Credentials renders an emblem wall of every
   certifying organization, then the certificate blocks; Contact renders the
   full contact page; 404 needs no data. */

(() => {
  const d = document;
  const $ = (s, r = d) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const R = d.documentElement;
  let lenis = null;
  R.classList.add("js");
  const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PAGE = d.body.dataset.page || "home";

  /* ---------- old single-page anchors moved to their own pages ----------
     Deep links like /#work from the previous one-page site are forwarded. */
  if (PAGE === "home" && location.hash) {
    const moved = {
      "#work": "work.html",
      "#certs": "credentials.html",
      "#skills": "about.html#skills",
      "#background": "about.html#background",
      "#contact": "contact.html"
    };
    if (moved[location.hash]) location.replace(moved[location.hash]);
  }

  /* ---------- boot ---------- */
  (async () => {
    let data;
    try {
      const res = await fetch("portfolio.json?v=" + Date.now()); // cache-bust: always read fresh edits
      if (!res.ok) throw new Error("HTTP " + res.status);
      data = await res.json();
    } catch (e) {
      const k = $(".kicker");
      if (k) k.textContent = "Content could not load";
      const nm = $("#hero-name") || $(".phero h1");
      if (nm) nm.textContent = "portfolio.json not found";
      const ld = $("#hero-lede") || $("#page-lede");
      if (ld) ld.textContent = "Serve this folder with a static server (VS Code Live Preview, GitHub Pages, Vercel, or npx serve) — opening the page straight from disk cannot fetch the JSON.";
      return;
    }
    render(data);
    initMotion();

    // Hash targets that app.js itself renders — the credentials org blocks —
    // arrive after the browser's own hash jump has already fired and missed.
    // Scroll to them once they exist (and again on load, when late images
    // have settled the layout); 72px clears the sticky header.
    if (location.hash) {
      const jump = () => {
        const t = d.getElementById(location.hash.slice(1));
        if (t) scrollTo(0, t.getBoundingClientRect().top + scrollY - 72);
      };
      requestAnimationFrame(jump);
      addEventListener("load", jump);
    }
  })();

  /* ---------- render dispatch ---------- */
  function render(x) {
    if (x.site) {
      if (x.site.title && PAGE === "home") d.title = x.site.title;
      if (x.site.footerNote) $("#footer-note").textContent = x.site.footerNote;
    }
    const pg = (x.pages && x.pages[PAGE]) || {};
    const lede = $("#page-lede");
    if (lede && pg.lede) lede.textContent = pg.lede;

    if (PAGE === "home") renderHome(x);
    else if (PAGE === "work") renderWork(x);
    else if (PAGE === "about") renderAbout(x);
    else if (PAGE === "credentials") renderCerts(x);
    else if (PAGE === "contact") renderContact(x);
    setupResume(x.resume || {});
  }

  /* ---------- home ---------- */
  function renderHome(x) {
    const p = x.person || {};
    if (p.tagline) $("#hero-tagline").textContent = p.tagline;
    if (p.name) $("#hero-name").textContent = p.name;
    if (p.lede) $("#hero-lede").textContent = p.lede;
    if (Array.isArray(p.meta)) $("#hero-meta").innerHTML = p.meta.map(m => "<span>" + esc(m) + "</span>").join("");

    if (Array.isArray(x.ticker) && x.ticker.length) {
      const items = x.ticker.map(t => "<span>" + esc(t) + "</span>").join("");
      $("#ticker").innerHTML = "<div>" + items + "</div><div>" + items + "</div>";
    }

    if (x.about) renderAboutBlocks(x);
    renderCertStrip(x);

    if (x.work) {
      const all = (x.work.projects || []).concat((x.work.more && x.work.more.projects) || []);
      const flagged = all.filter(pj => pj && pj.featured === true);
      const pick = flagged.length ? flagged : all.slice(0, 3);
      $("#featured-note").textContent = pick.length + " of " + all.length + " — highlights";
      $("#featured-grid").innerHTML = pick.map(card).join("");
      const aw = $("#allwork");
      if (aw) $("#allwork-label").textContent = "View all " + all.length + " project" + (all.length === 1 ? "" : "s");
    }

    if (x.contact) {
      const ch = $("#contact-heading");
      if (ch && x.contact.heading) ch.innerHTML = x.contact.heading; // trusted site copy; may contain <em>
      const ct = $("#contact-text");
      if (ct && x.contact.text) ct.textContent = x.contact.text;
    }
    contactLinks(p);
  }

  /* ---------- work page ---------- */
  function renderWork(x) {
    if (!x.work) return;
    const grid = $("#work-grid");
    const all = (x.work.projects || []).concat((x.work.more && x.work.more.projects) || []);
    $("#work-count").textContent = all.length + " project" + (all.length === 1 ? "" : "s");
    let html = (x.work.projects || []).map(card).join("");
    if (x.work.more && x.work.more.label && (x.work.more.projects || []).length)
      html += '<p class="mono sub" data-r>' + esc(x.work.more.label) + "</p>" + x.work.more.projects.map(card).join("");
    grid.innerHTML = html;
  }

  /* ---------- about page (about + skills + background) ---------- */
  function renderAbout(x) {
    renderAboutBlocks(x);
    renderCertStrip(x);
    if (x.skills) {
      if (x.skills.note) $("#skills-note").textContent = x.skills.note;
      $("#skills-grid").innerHTML = (x.skills.groups || []).map(g =>
        "<div><span class=\"mono\">" + esc(g.label) + "</span><ul>" +
        (g.items || []).map(i => "<li>" + esc(i) + "</li>").join("") +
        "</ul></div>").join("");
    }
    if (x.background && Array.isArray(x.background.rows)) renderBackground(x.background.rows);
  }

  function renderAboutBlocks(x) {
    if (!x.about) return;
    const at = $("#about-text");
    if (at) at.innerHTML = (x.about.paragraphs || []).map(t => "<p>" + esc(t) + "</p>").join("");
    const st = $("#about-stats");
    if (st) st.innerHTML = (x.about.stats || []).map(s => "<div><b>" + esc(s.value) + "</b><span class=\"mono\">" + esc(s.label) + "</span></div>").join("");
  }

  /* ---------- certificate emblem strip (under About me, home + about) ----------
     Reads certificates.orgs from portfolio.json: one logo chip per
     organization, linking to that org's credentials on the certificates page,
     plus the button that opens the page. A "shortName" on an org overrides
     the chip label (e.g. IBM). */
  function renderCertStrip(x) {
    const el = $("#cert-strip");
    if (!el) return;
    const orgs = x.certificates && Array.isArray(x.certificates.orgs) ? x.certificates.orgs : [];
    if (!orgs.length) { el.remove(); return; }
    el.innerHTML =
      '<span class="mono">Certified by</span>' +
      '<div class="cst-orgs">' + orgs.map(o => {
        const n = (o.credentials || []).length;
        const name = o.shortName || o.name || "Organization";
        const mark = o.logo
          ? '<img src="' + esc(o.logo) + '" alt="" loading="lazy" decoding="async">'
          : '<span class="mono" aria-hidden="true">' + esc(initials(o.name)) + "</span>";
        return '<a class="cst beam" href="credentials.html#org-' + orgSlug(o) + '">' + mark +
          '<span class="mono">' + esc(name) + (n ? " · " + n : "") + "</span></a>";
      }).join("") + "</div>" +
      '<a class="btn p beam" href="credentials.html">View my certificates<span class="ar" aria-hidden="true"> →</span></a>';
  }

  /* Anchor id for an organization — from shortName when present ("IBM"),
     else the full name; shared by the emblem wall links and the About strip. */
  function orgSlug(o) {
    return String((o && (o.shortName || o.name)) || "org").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "org";
  }

  function renderBackground(rows) {
    const bg = $("#background-grid");
    if (!bg) return;
    bg.innerHTML = rows.map(r => {
      let c = "";
      if (r.text) c = "<p>" + esc(r.text) + "</p>";
      else if (Array.isArray(r.lines)) c = '<div class="bgl">' + r.lines.map(l => "<p>" + esc(l) + "</p>").join("") + "</div>";
      else if (Array.isArray(r.columns)) c = '<div class="bgc">' + r.columns.map(col => "<div>" + col.map(l => "<p>" + esc(l) + "</p>").join("") + "</div>").join("") + "</div>";
      return '<div class="bgd"><span class="mono">' + esc(r.label) + '</span><div class="bgt">' + c + "</div></div>";
    }).join("");
  }

  /* ---------- credentials page ---------- */
  function renderCerts(x) {
    if (!x.certificates) return;
    if (x.certificates.note) $("#certs-note").textContent = x.certificates.note;
    const cg = $("#certs-grid");
    const fxDefault = x.certificates.effects !== false; // JSON global toggle
    let orgs = x.certificates.orgs;
    if (!Array.isArray(orgs) && Array.isArray(x.certificates.items)) {
      // flat legacy list: group credentials by issuer
      const groups = new Map();
      x.certificates.items.forEach(it => {
        const k = it.issuer || "Certificate";
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(it);
      });
      orgs = Array.from(groups, ([name, credentials]) => ({ name, credentials }));
    }
    if (cg && Array.isArray(orgs)) {
      cg.innerHTML = orgs.map(o => org(o, fxDefault)).join("");

      // certificate image backdrop color (portfolio.json: certificates.imageBackground)
      const bg = String(x.certificates.imageBackground || "").trim();
      if (/^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s,.%]+\)|hsla?\([\d\s,.%deg]+\)|[a-zA-Z]{3,20})$/.test(bg))
        cg.querySelectorAll(".cimg").forEach(el => { el.style.backgroundColor = bg; });

      watchLogos(cg, true); // org-block frames may grow a little for big marks
    }

    // emblem wall — every certifying organization as one large tile above the
    // certificates; tapping an emblem slides down to that org's credentials
    const ow = $("#org-wall");
    if (ow && Array.isArray(orgs)) {
      ow.innerHTML = orgs.map(o => {
        const n = (o.credentials || []).length;
        const name = o.shortName || o.name || "Organization";
        const mark = o.logo
          ? '<img src="' + esc(o.logo) + '" alt="' + esc(name) + ' logo" loading="lazy" decoding="async">'
          : '<span class="orgm mono">' + esc(initials(o.name)) + "</span>";
        return '<a class="owt" href="#org-' + orgSlug(o) + '" data-r>' +
          '<span class="orgl owl">' + mark + "</span>" +
          '<span class="own serif">' + esc(name) + "</span>" +
          '<span class="mono">' + n + " credential" + (n === 1 ? "" : "s") + "</span></a>";
      }).join("");
      watchLogos(ow, false); // wall frames stay flat — equal optical area, no multipliers
    }
  }

  /* ---------- contact page ---------- */
  function renderContact(x) {
    const p = x.person || {};
    const c = x.contact || {};
    const ch = $("#contact-heading");
    if (ch && c.heading) ch.innerHTML = c.heading; // trusted site copy; may contain <em>
    const ct = $("#contact-text");
    if (ct && c.text) ct.textContent = c.text;
    const cm = $("#contact-meta");
    if (cm) {
      const items = Array.isArray(c.meta) ? c.meta : [];
      if (items.length) cm.innerHTML = items.map(m => "<span>" + esc(m) + "</span>").join("");
    }
    contactLinks(p);
  }

  /* Shared by home + contact page: the button row under Let's build something. */
  function contactLinks(p) {
    const L = $("#links");
    if (!L) return;
    L.insertAdjacentHTML("beforeend", '<button class="btn p beam" type="button" data-resume>View resume</button>');
    if (p.phone) L.insertAdjacentHTML("beforeend", '<a class="btn beam" href="' + digitsOnly(p.phone) + '">' + esc(p.phone) + "</a>");
    if (p.email) L.insertAdjacentHTML("beforeend", '<a class="btn beam" href="mailto:' + esc(p.email) + '">Email me</a>');
    L.insertAdjacentHTML("beforeend", linkButtons(p));
  }

  function digitsOnly(s) { return "tel:" + String(s).replace(/[^+\d]/g, ""); }

  /* Contact link buttons — "links": [ { "label": "GitHub", "url": "https://…" },
     { "label": "LinkedIn", "url": "https://…" } ] on person in portfolio.json.
     Each entry becomes a button in the Let’s build something section, in order,
     after the phone/email buttons. External http(s) links open in a new tab;
     tel:/mailto: URLs work too. Legacy fallback: person.github still renders a
     GitHub button when no links array is present. */
  function linkButtons(p) {
    const items = (Array.isArray(p.links) ? p.links : [])
      .filter(l => l && String(l.url || l.href || "").trim());
    if (!items.length && p.github) items.push({ label: "GitHub", url: p.github });
    return items.map(l => {
      const url = String(l.url || l.href).trim();
      const label = String(l.label || "").trim() || url;
      const ext = /^https?:\/\//i.test(url);
      return '<a class="btn beam" href="' + esc(url) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + esc(label) + "</a>";
    }).join("");
  }

  /* GitHub repo link — a project in portfolio.json may set "github" to a full URL
     ("https://github.com/you/repo") or the "you/repo" shorthand (a leading @ or a
     trailing .git is tolerated and dropped). It renders a GitHub link beside the
     live-site link on that project card; omit it or set it to null to hide it.
     A "featured": true flag on any project also lifts it onto the home page. */
  const GH_MARK = '<svg class="gi" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.07-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';
  function ghRepo(v) {
    let u = String(v || "").trim().replace(/^@/, "").replace(/\.git$/i, "");
    if (!u) return "";
    if (!/^https?:\/\//i.test(u))
      u = "https://github.com/" + u.replace(/^(?:www\.)?github\.com\//i, "").replace(/^\/+/, "");
    return u;
  }

  function card(pj) {
    const det = pj.details;
    let h = '<article class="card beam" data-r>';
    h += '<span class="mono">' + esc(pj.category || "") + "</span>";
    h += '<h3 class="serif">' + esc(pj.title || "") + "</h3>";
    h += "<p>" + esc(pj.description || "");
    const links = [];
    if (pj.live) links.push('<a class="live mono" href="' + esc(pj.live) + '" target="_blank" rel="noopener" aria-label="' + esc(pj.title || "Project") + ' live site">Live site ↗</a>');
    const gh = ghRepo(pj.github);
    if (gh) links.push('<a class="live mono gh" href="' + esc(gh) + '" target="_blank" rel="noopener" aria-label="' + esc(pj.title || "Project") + ' source code on GitHub">' + GH_MARK + "GitHub ↗</a>");
    if (links.length) h += " " + links.join(' <span class="lsep" aria-hidden="true">·</span>');
    h += "</p>";
    if (det && (det.items || []).length) {
      h += "<details" + (det.open ? " open" : "") + "><summary class=\"mono\">" + esc(det.summary || "How it works") + "</summary><ul>";
      h += det.items.map(i => "<li>" + esc(i) + "</li>").join("");
      h += "</ul>";
      if (det.facts) h += '<div class="facts mono">' + esc(det.facts) + "</div>";
      if (Array.isArray(det.flow) && det.flow.length)
        h += '<ol class="flow mono" aria-label="Pipeline, in order">' + det.flow.map(f => "<li>" + esc(f) + "</li>").join("") + "</ol>";
      h += "</details>";
    }
    if (Array.isArray(pj.tags) && pj.tags.length)
      h += '<div class="tags mono">' + pj.tags.map(t => "<span>" + esc(t) + "</span>").join("") + "</div>";
    if (pj.image)
      h += '<figure class="shot"><img src="assets/img/' + esc(pj.image) + '" alt="Screenshot of ' + esc(pj.title || "project") + '" loading="lazy" decoding="async"></figure>';
    else
      h += '<figure class="shot empty" aria-hidden="true"><span class="mono">Project image</span></figure>';
    h += "</article>";
    return h;
  }

  function initials(name) {
    return String(name || "").trim().split(/\s+/).map(w => w[0]).join("").slice(0, 3).toUpperCase();
  }

  /* ---------- logo optical sizing (org blocks + emblem wall) ----------
     Every logo renders inside a uniform frame, auto-sized to equal optical
     area (a square fills the frame height, wider marks shrink to the same
     area) so no logo outweighs another. An org's "logoSize" multiplier in
     portfolio.json scales its mark on the org blocks — growing past 1 widens
     the logo band (up to ~1.45x); the wall ignores multipliers and keeps its
     frames flat. Failed logos swap to the monogram tile. */
  const fittedLogos = [];
  function watchLogos(scope, grow) {
    scope.querySelectorAll(".orgl img").forEach(img => {
      if (grow) img.dataset.grow = "1";
      const fail = () => {
        if (!img.parentNode) return;
        const m = d.createElement("span");
        m.className = "orgm mono";
        m.textContent = img.getAttribute("data-mono") || "";
        img.replaceWith(m);
      };
      if (img.complete && img.naturalWidth === 0) fail();
      else img.addEventListener("error", fail);
      if (img.complete && img.naturalWidth > 0) fitLogo(img);
      else img.addEventListener("load", () => fitLogo(img));
      fittedLogos.push(img);
    });
  }
  addEventListener("resize", () => fittedLogos.forEach(img => { if (img.parentNode) fitLogo(img); }));

  function fitLogo(img) {
    const box = img.parentNode;
    const nw = img.naturalWidth, nh = img.naturalHeight;
    if (!box || !nw || !nh) return;
    const bw = box.clientWidth;
    box.style.height = "";                  // reset, then read the CSS band
    const bh = box.clientHeight;
    if (!bw || !bh) return;
    const r = nw / nh;
    let w = Math.sqrt(bh * bh * r), h = w / r;
    const m = parseFloat(img.dataset.size);
    if (isFinite(m) && m > 0) { w *= m; h *= m; }
    const band = img.dataset.grow === "1"
      ? Math.max(bh, Math.min(h, bh * 1.45))  // org blocks: the band may grow
      : bh;                                    // wall: frames stay flat
    const k = Math.min(bw / w, band / h, 1);
    img.style.width = (w * k).toFixed(2) + "px";
    img.style.height = (h * k).toFixed(2) + "px";
    box.style.height = band.toFixed(2) + "px";
  }

  /* Organization block — logo on the left, name beside it, credentials listed underneath. */
  function org(o, fxDefault) {
    let l = '<span class="orgl">';
    if (o.logo) {
      const sz = parseFloat(o.logoSize);
      l += '<img src="' + esc(o.logo) + '" alt="' + esc(o.name || "Organization") + ' logo" data-mono="' + esc(initials(o.name)) + '"' +
        (isFinite(sz) && sz > 0 ? ' data-size="' + sz + '"' : "") +
        ' loading="lazy" decoding="async">';
    } else
      l += '<span class="orgm mono">' + esc(initials(o.name)) + "</span>";
    l += "</span>";
    const creds = (o.credentials || []).map(c => cred(c, o.name, fxDefault)).join("");
    return '<article class="org" id="org-' + orgSlug(o) + '" data-r>' + l +
      '<h3 class="orgn serif">' + esc(o.name || "") + "</h3>" +
      '<ul class="creds">' + creds + "</ul></article>";
  }

  /* One credential — the certificate image links to its verification page, with the
     linked title, kind/date and a subtle Verified link beside it. */
  function cred(c, orgName, fxDefault) {
    const meta = [c.kind, c.date].filter(Boolean).join(" · ");
    let host = "";
    try { host = new URL(c.verify).hostname.replace(/^www\./, ""); } catch (e) { /* leave blank */ }
    // image effects: per-credential "effect" overrides the global "effects" default
    const fxOn = typeof c.effect === "boolean" ? c.effect : fxDefault;
    let h = fxOn === false ? '<li class="nofx">' : "<li>";
    if (c.image) {
      const alt = (orgName ? orgName + " certificate: " : "Certificate — ") + (c.title || "");
      const img = '<img src="' + esc(c.image) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">';
      h += c.verify
        ? '<a class="cimg" href="' + esc(c.verify) + '" target="_blank" rel="noopener" aria-label="Open verification for ' + esc(c.title || "certificate") + '">' + img + "</a>"
        : '<div class="cimg">' + img + "</div>";
    }
    h += '<div class="ctxt">';
    if (c.verify)
      h += '<a class="ct" href="' + esc(c.verify) + '" target="_blank" rel="noopener">' +
           esc(c.title || "Credential") + '<span class="ar" aria-hidden="true"> ↗</span></a>';
    else
      h += '<span class="ct">' + esc(c.title || "Credential") + "</span>";
    if (meta) h += '<span class="ctd mono">' + esc(meta) + "</span>";
    if (c.verify) h += '<a class="vfy mono" href="' + esc(c.verify) + '" target="_blank" rel="noopener">Verified — ' + esc(host || "issuer page") + " ↗</a>";
    h += "</div></li>";
    return h;
  }

  /* ---------- resume dialog (every page) ---------- */
  function setupResume(cfg) {
    const dl = $("#rd");
    if (!dl) return;
    $("#rt").textContent = cfg.dialogTitle || "Resume";
    const pdf = cfg.pdf || "assets/resume.pdf";
    const fresh = u => u + (u.includes("?") ? "&" : "?") + "v=" + Date.now(); // cache-bust: resume always loads fresh
    const pages = Array.isArray(cfg.pages) ? cfg.pages : [];
    const prA = $("#pr");
    if (prA) { prA.href = fresh(pdf); if (cfg.downloadName) prA.setAttribute("download", cfg.downloadName); }

    // Fallback render (no embedded PDF support, e.g. iPadOS Safari)
    if (pages.length) $("#rbody").innerHTML = pages.map((u, i) => '<img class="rpg" src="' + esc(fresh(u)) + '" alt="Resume, page ' + (i + 1) + " of " + pages.length + '">').join("");

    const canPdf = (() => {
      try { const v = navigator.pdfViewerEnabled; return v === undefined ? !/iPad|iPhone|iPod/.test(navigator.userAgent) : v === true; }
      catch (e) { return false; }
    })();
    let embedded = false;
    const embedResume = () => {
      const b = $("#rbody");
      if (!b || embedded || !canPdf) return;
      embedded = true;
      b.innerHTML = '<iframe src="' + esc(fresh(pdf)) + '" title="Resume PDF"></iframe><p><a href="' + esc(fresh(pdf)) + '" target="_blank" rel="noopener">Open in a new tab</a></p>';
    };

    let last;
    d.querySelectorAll("[data-resume]").forEach(b => b.addEventListener("click", () => { last = b; embedResume(); dl.showModal(); lenis && lenis.stop(); }));
    $("#rc").onclick = () => dl.close();
    dl.addEventListener("close", () => { last && last.focus(); lenis && lenis.start(); });
    dl.addEventListener("click", e => { if (e.target === dl) dl.close(); });
  }

  /* ---------- motion (runs after render, on every page) ---------- */
  function initMotion() {
    d.querySelectorAll("[data-split]").forEach(el => {
      const t = el.textContent.trim();
      el.innerHTML = '<span class="sr">' + t + "</span>" + t.split(" ").map((w, i) => '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + "</span></span>").join(" ");
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("in")));
    });

    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: .2, rootMargin: "0px 0px -10% 0px" });
    d.querySelectorAll("[data-r]").forEach(e => {
      const sib = [...e.parentElement.children].filter(c => c.hasAttribute("data-r"));
      e.style.setProperty("--d", Math.min(sib.indexOf(e), 4) * 90 + "ms");
      io.observe(e);
    });

    const sd = new IntersectionObserver((es, o) => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); o.unobserve(e.target); }
    }), { rootMargin: "0px 0px -15% 0px" });
    d.querySelectorAll("section").forEach(s => sd.observe(s));

    if (!rm && window.Lenis && window.gsap) {
      lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      const st = window.ScrollTrigger;
      if (st) { gsap.registerPlugin(st); lenis.on("scroll", st.update); }
      if (matchMedia("(hover:hover) and (pointer:fine)").matches) d.querySelectorAll(".btn").forEach(b => {
        const qx = gsap.quickTo(b, "x", { duration: .5, ease: "power3.out" });
        const qy = gsap.quickTo(b, "y", { duration: .5, ease: "power3.out" });
        b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * .18); qy((e.clientY - r.top - r.height / 2) * .28); });
        b.addEventListener("pointerleave", () => { qx(0); qy(0); });
      });
      const tk = t => lenis.raf(t * 1000);
      gsap.ticker.add(tk); gsap.ticker.lagSmoothing(0);
      d.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
        const id = a.getAttribute("href"), t = id === "#top" ? 0 : d.querySelector(id);
        if (t === null) return;
        e.preventDefault(); lenis.scrollTo(t, { offset: t === 0 ? 0 : -72, duration: 1.4 });
      }));
      if (st) d.querySelectorAll(".stats b").forEach(b => {
        const m = b.textContent.match(/^([\d.]+)(.*)$/); if (!m) return;
        const to = parseFloat(m[1]), sx = m[2], o = { v: 0 }; b.textContent = "0" + sx;
        st.create({ trigger: b, start: "top 88%", once: true, onEnter: () => gsap.to(o, { v: to, duration: 1.6, ease: "power3.out", onUpdate: () => b.textContent = Math.round(o.v) + sx }) });
      });
      (d.fonts ? d.fonts.ready : Promise.resolve()).then(() => st.refresh());
      addEventListener("pagehide", () => { gsap.ticker.remove(tk); lenis.destroy(); });
    }
  }
})();

