# Dr. Data Events Presentations

Event decks and the live audience quiz for Dr. Data Decision Intelligence. Static site on Netlify (drdataevents.netlify.app).

Repo type: Static site. Rules: `DR_DATA_RULES.md` (sections 1, 3.1 to 3.3, 4, 6, 8, 9, 12, Appendix B).

## What is here

| Path | What |
|---|---|
| `find-your-zone-mke-spin.html` | MKE SPIN talk deck (bundled export, site root) |
| `custom-dashboards-ai-wurkshop.html` | AI WurkShop deck, Nov 10 2026 |
| `live/join`, `live/screen` | Live Find Your Zone quiz: phone join page and room screen |
| `netlify/functions/live.mjs`, `netlify/lib/` | Quiz API and question set (Netlify Blobs) |
| `notes/` | Speaker notes pages |
| `own-your-ai-2027/` | Own Your AI 2027 Workshops: series plan and one folder per workshop |
| `test/` | Quiz API tests (`npm test`) |

## Rules for this repo

1. Synthetic data only. No client names or client data.
2. Every number on a slide carries its source.
3. No compliance claims.
4. Collaboration slides are marked "Remove before event" and come out before the workshop runs.
5. The live quiz stays behind its off switch and is turned off the same day as the event (rules 12.5, 12.6).
