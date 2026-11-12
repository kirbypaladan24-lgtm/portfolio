/* Portfolio app — renders portfolio.json into the page, then wires motion.
   All content lives in portfolio.json; this file only needs touching for behavior. */
(() => {
  const d = document;
  const $ = (s, r = d) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const R = d.documentElement;
  let lenis = null;
  R.classList.add("js");
  const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- boot ---------- */
  (async () => {
    let data;
    try {
      const res = await fetch("portfolio.json?v=" + Date.now()); // cache-bust: always read fresh edits
      if (!res.ok) throw new Error("HTTP " + res.status);
      data = await res.json();
    } catch (e) {
      const el = $("#hero-tagline");
      el.textContent = "Content could not load";
      $("#hero-name").textContent = "portfolio.json not found";
      $("#hero-lede").textContent = "Serve this folder with a static server (VS Code Live Preview, GitHub Pages, Vercel, or npx serve) — opening index.html straight from disk cannot fetch the JSON.";
      return;
    }
    render(data);
    initMotion();
  })();

  /* ---------- render ---------- */
  function render(x) {
    if (x.site) {
      if (x.site.title) d.title = x.site.title;
      if (x.site.footerNote) $("#footer-note").textContent = x.site.footerNote;
    }
    const p = x.person || {};
    if (p.tagline) $("#hero-tagline").textContent = p.tagline;
    if (p.name) $("#hero-name").textContent = p.name;
    if (p.lede) $("#hero-lede").textContent = p.lede;
    if (Array.isArray(p.meta)) $("#hero-meta").innerHTML = p.meta.map(m => "<span>" + esc(m) + "</span>").join("");

    if (Array.isArray(x.ticker) && x.ticker.length) {
      const items = x.ticker.map(t => "<span>" + esc(t) + "</span>").join("");
      $("#ticker").innerHTML = "<div>" + items + "</div><div>" + items + "</div>";
    }

    if (x.about) {
      const at = $("#about-text");
      at.innerHTML = (x.about.paragraphs || []).map(t => "<p>" + esc(t) + "</p>").join("");
      $("#about-stats").innerHTML = (x.about.stats || []).map(s => "<div><b>" + esc(s.value) + "</b><span class=\"mono\">" + esc(s.label) + "</span></div>").join("");
    }

    if (x.work) {
      const grid = $("#work-grid");
      const all = (x.work.projects || []).concat((x.work.more && x.work.more.projects) || []);
      $("#work-count").textContent = all.length + " project" + (all.length === 1 ? "" : "s");
      let html = (x.work.projects || []).map(card).join("");
      if (x.work.more && x.work.more.label && (x.work.more.projects || []).length)
        html += '<p class="mono sub" data-r>' + esc(x.work.more.label) + "</p>" + x.work.more.projects.map(card).join("");
      grid.innerHTML = html;
    }

    if (x.skills) {
      if (x.skills.note) $("#skills-note").textContent = x.skills.note;
      $("#skills-grid").innerHTML = (x.skills.groups || []).map(g =>
        "<div><span class=\"mono\">" + esc(g.label) + "</span><ul>" +
        (g.items || []).map(i => "<li>" + esc(i) + "</li>").join("") +
        "</ul></div>").join("");
    }

    if (x.certificates) {
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
        // logos: auto-sized to equal optical area (a square fills the frame height,
        // wider marks shrink to the same area) so no logo outweighs another; a
        // "logoSize" multiplier on an org in portfolio.json scales its logo
        // (1 = default). Growing past 1 expands the logo band (up to ~1.45x) so
        // bigger marks stay aligned with the name; larger values cap there.
        // Failed logos swap to the monogram tile.
        const sizeLogo = img => {
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
          const band = Math.max(bh, Math.min(h, bh * 1.45));
          const k = Math.min(bw / w, band / h, 1);
          img.style.width = (w * k).toFixed(2) + "px";
          img.style.height = (h * k).toFixed(2) + "px";
          box.style.height = band.toFixed(2) + "px";
        };
        cg.querySelectorAll(".orgl img").forEach(img => {
          const fail = () => {
            if (!img.parentNode) return;
            const m = d.createElement("span");
            m.className = "orgm mono";
            m.textContent = img.getAttribute("data-mono") || "";
            img.replaceWith(m);
          };
          if (img.complete && img.naturalWidth === 0) fail();
          else img.addEventListener("error", fail);
          if (img.complete && img.naturalWidth > 0) sizeLogo(img);
          else img.addEventListener("load", () => sizeLogo(img));
        });
        addEventListener("resize", () => cg.querySelectorAll(".orgl img").forEach(sizeLogo));
      }
    }

    if (x.background && Array.isArray(x.background.rows)) {
      $("#background-grid").innerHTML = x.background.rows.map(r => {
        let c = "";
        if (r.text) c = "<p>" + esc(r.text) + "</p>";
        else if (Array.isArray(r.lines)) c = '<div class="bgl">' + r.lines.map(l => "<p>" + esc(l) + "</p>").join("") + "</div>";
        else if (Array.isArray(r.columns)) c = '<div class="bgc">' + r.columns.map(col => "<div>" + col.map(l => "<p>" + esc(l) + "</p>").join("") + "</div>").join("") + "</div>";
        return '<div class="bgd"><span class="mono">' + esc(r.label) + '</span><div class="bgt">' + c + "</div></div>";
      }).join("");
    }

    if (x.contact) {
      const ch = $("#contact-heading");
      if (x.contact.heading) ch.innerHTML = x.contact.heading; // trusted site copy; may contain <em>
      if (x.contact.text) $("#contact-text").textContent = x.contact.text;
    }

    const L = $("#links");
    L.insertAdjacentHTML("beforeend", '<button class="btn p beam" type="button" data-resume>View resume</button>');
    if (p.phone) L.insertAdjacentHTML("beforeend", '<a class="btn beam" href="tel:' + digitsOnly(p.phone) + '">' + esc(p.phone) + "</a>");
    if (p.email) L.insertAdjacentHTML("beforeend", '<a class="btn beam" href="mailto:' + esc(p.email) + '">Email me</a>');
    if (p.github) L.insertAdjacentHTML("beforeend", '<a class="btn beam" href="' + esc(p.github) + '" target="_blank" rel="noopener">GitHub</a>');

    setupResume(x.resume || {});
  }

  function digitsOnly(s) { return "tel:" + String(s).replace(/[^+\d]/g, ""); }

  function card(pj) {
    const det = pj.details;
    let h = '<article class="card beam" data-r>';
    h += '<span class="mono">' + esc(pj.category || "") + "</span>";
    h += '<h3 class="serif">' + esc(pj.title || "") + "</h3>";
    h += "<p>" + esc(pj.description || "");
    if (pj.live) h += ' <a class="live mono" href="' + esc(pj.live) + '" target="_blank" rel="noopener" aria-label="' + esc(pj.title || "Project") + ' live site">Live site ↗</a>';
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
    return '<article class="org" data-r>' + l +
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



  /* ---------- resume dialog ---------- */
  function setupResume(cfg) {
    const dl = $("#rd");
    if (!dl) return;
    $("#rt").textContent = cfg.dialogTitle || "Resume";
    const pdf = cfg.pdf || "assets/resume.pdf";
    const pages = Array.isArray(cfg.pages) ? cfg.pages : [];
    const prA = $("#pr");
    if (prA) { prA.href = pdf; if (cfg.downloadName) prA.setAttribute("download", cfg.downloadName); }

    // Fallback render (no embedded PDF support, e.g. iPadOS Safari)
    if (pages.length) $("#rbody").innerHTML = pages.map((u, i) => '<img class="rpg" src="' + esc(u) + '" alt="Resume, page ' + (i + 1) + " of " + pages.length + '">').join("");

    const canPdf = (() => {
      try { const v = navigator.pdfViewerEnabled; return v === undefined ? !/iPad|iPhone|iPod/.test(navigator.userAgent) : v === true; }
      catch (e) { return false; }
    })();
    let embedded = false;
    const embedResume = () => {
      const b = $("#rbody");
      if (!b || embedded || !canPdf) return;
      embedded = true;
      b.innerHTML = '<iframe src="' + esc(pdf) + '" title="Resume PDF"></iframe><p><a href="' + esc(pdf) + '" target="_blank" rel="noopener">Open in a new tab</a></p>';
    };

    let last;
    d.querySelectorAll("[data-resume]").forEach(b => b.addEventListener("click", () => { last = b; embedResume(); dl.showModal(); lenis && lenis.stop(); }));
    $("#rc").onclick = () => dl.close();
    dl.addEventListener("close", () => { last && last.focus(); lenis && lenis.start(); });
    dl.addEventListener("click", e => { if (e.target === dl) dl.close(); });
  }

  /* ---------- motion (runs after render) ---------- */
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

    const nl = [...d.querySelectorAll('a[href^="#"]')];
    const so = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) nl.forEach(a => a.hash === "#" + e.target.id ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current"));
    }), { rootMargin: "-40% 0px -55% 0px" });
    d.querySelectorAll(".hero,section[id]").forEach(s => so.observe(s));

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
