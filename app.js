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
      const res = await fetch("portfolio.json");
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
