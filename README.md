# Kirby Paladan — Portfolio

A multi-page portfolio with one shared shell. **All content still lives in one file: `portfolio.json`.**
Edit that file to add, remove or change projects, images, skills and personal details — no HTML/CSS editing needed.

## Site architecture

```
index.html        Home — hero, ticker, about, featured work, contact
work.html         Every project (the growth page)
about.html        About + skills + background
credentials.html  Certificates by organization
contact.html      Full-screen contact page
404.html          Styled lost-page fallback (GitHub Pages serves it automatically)
```

Every page shares the same header nav (the current page gets an accent underline),
the footer page index, and the View-resume dialog. Moving between pages animates
via same-origin **View Transitions** in supporting browsers — plain navigation everywhere else.
Old single-page deep links (`/#work`, `/#certs`, `/#skills`, `/#background`, `/#contact`)
forward to the right page automatically.

## File map

```
*.html           Page skeletons (rarely touched — nav + section containers)
portfolio.json   ← ALL content: edit this
style.css        Theme & layout styling
app.js           Router + rendering + animations (rarely touched)
assets/
  resume.pdf     Your resume (shown in the View Resume dialog)
  img/           Project images + resume fallback render
certificates/    Certificate images + org logos
```

## Everyday edits (all in portfolio.json)

**Add a project** — copy any block inside `work.projects` (or `work.more.projects`), paste it, and edit:

```json
{
  "category": "Web app",
  "title": "My New Project",
  "image": "my-new-project.jpg",
  "description": "One or two sentences about what it is.",
  "live": "https://my-new-project.vercel.app/",
  "github": "yourname/my-new-project",
  "featured": true,
  "details": {
    "summary": "How it works",
    "open": false,
    "items": ["Bullet one.", "Bullet two."],
    "facts": "3 pages · 1 dashboard",
    "flow": null
  },
  "tags": ["React", "Vercel"]
}
```

Then drop `my-new-project.jpg` into `assets/img/` (4:3 ratio looks best, ~800–900px wide, under 150KB).
The "11 projects" counter on the Work page updates automatically.

**Feature a project on the home page** — set `"featured": true` on it (any project, either list).
Home shows the flagged ones in order; with no flags it falls back to the first three.

**Remove a project** — delete its block (and its image file if you want).

**Swap a project image** — overwrite the file in `assets/img/`, or point `"image"` at a new filename.

**Contact buttons** — under Let’s build *something* (home + contact page), `person.phone` and
`person.email` render their buttons automatically, and every entry in `person.links` becomes its
own button, in order:

```json
"links": [
  { "label": "GitHub", "url": "https://github.com/yourname" },
  { "label": "LinkedIn", "url": "https://www.linkedin.com/in/you" }
]
```

Add, reorder or remove entries freely — any external link opens in a new tab, and `tel:`/`mailto:` URLs work as buttons too.

**Page intro lines** — the lede under each page heading comes from `pages` in the JSON:

```json
"pages": {
  "work": { "lede": "Android apps, web platforms, local AI systems and games — every card opens into how it works." },
  "about": { "lede": "…" },
  "credentials": { "lede": "…" },
  "contact": { "lede": "…" }
}
```

The contact page also shows `contact.meta` — a list of one-line facts under the buttons.

**Optional fields** — `live`, `github` (repository link: full URL `"https://github.com/you/repo"` or the shorthand `"you/repo"` — renders a GitHub link beside the live-site link on the card; `null` or omitted hides it), `details.facts`, `details.flow` (ordered pipeline chips, like JARVIS uses), and `image` can all be `null` or omitted; the card adapts.

**Other content** — everything else is labeled plainly: `person` (name, phone, email), `about` (paragraphs + stats), `skills.groups`, `certificates.orgs` (logos, `logoSize`, credentials), `background.rows`, `contact`, `resume`.

**Background rows** — flat label-left layout, one block per row:

```json
{ "label": "Education", "text": "Prose wraps at a comfortable width." }
{ "label": "Leadership", "lines": ["Class President", "Built an Android app that …"] }
{ "label": "How I work", "columns": [
    ["Start from a real problem", "Ship working features, not mockups"],
    ["Design within hosting and storage limits"]
] }
```

Use `text` for a paragraph, `lines` for a single list, or `columns` (two arrays) for the two-column layout. Add or remove rows freely — each gets its own hairline divider.

## Resume

Replace `assets/resume.pdf` with an updated file (keep the name, or change `resume.pdf` in the JSON).
`resume.pages` is the image fallback used on iPhone/iPad, where browsers can't embed PDFs — regenerate it as a screenshot of page 1 if you redesign the resume.

## Running locally

Pages fetch `portfolio.json`, so they need a static server — double-clicking `index.html` from disk won't load content:

- **VS Code**: install the *Live Preview* extension → right-click `index.html` → Open Preview
- **Terminal**: `npx serve` or `python -m http.server` in this folder

## Deploying

Push the whole folder to GitHub and enable **GitHub Pages**, or import it to **Vercel** — no build step, no config needed. Works at any subpath (all references are relative).
