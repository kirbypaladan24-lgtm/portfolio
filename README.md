# Kirby Paladan — Portfolio

A fast, single-page portfolio. **All content lives in one file: `portfolio.json`.**
Edit that file to add, remove or change projects, images, skills and personal details — no HTML/CSS editing needed.

## File map

```
index.html       Layout skeleton (rarely touched)
portfolio.json   ← ALL content: edit this
style.css        Theme & layout styling
app.js           Rendering + animations (rarely touched)
assets/
  resume.pdf     Your resume (shown in the View Resume dialog)
  img/           Project images + resume fallback render
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
The "10 projects" counter in the Work heading updates automatically.

**Remove a project** — delete its block (and its image file if you want).

**Swap a project image** — overwrite the file in `assets/img/`, or point `"image"` at a new filename.

**Optional fields** — `live`, `details.facts`, `details.flow` (ordered pipeline chips, like JARVIS uses), and `image` can all be `null` or omitted; the card adapts.

**Other content** — everything else is labeled plainly: `person` (name, phone, email, links), `about` (paragraphs + stats), `skills.groups`, `contact`, `resume`.

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

The page fetches `portfolio.json`, so it needs a static server — double-clicking `index.html` from disk won't load content:

- **VS Code**: install the *Live Preview* extension → right-click `index.html` → Open Preview
- **Terminal**: `npx serve` or `python -m http.server` in this folder

## Deploying

Push the whole folder to GitHub and enable **GitHub Pages**, or import it to **Vercel** — no build step, no config needed. Works at any subpath (all references are relative).
