# Dr. Data Build Rules

Version 1.3. 22 Nov 2026. Owner: Zubia Mughal.

One rule file for every repo, every product, and every builder: Claude, Cursor, and any person. The master copy lives in the Dr Data Playbook project. Each repo carries an exact copy as `DR_DATA_RULES.md`. `CLAUDE.md`, `.cursor/rules/dr-data.mdc` and `AGENTS.md` point here and add only that repo's own facts. If a repo file disagrees with this one, this one wins.

Every repo is one of three types. The type decides which sections apply.

| Type | Examples | Sections |
|---|---|---|
| Hub product | MVP_Hub, Hub client setups, desktop installers | 1 to 11 |
| Cloud app | AgentPulse (Bridget, Jason), DrDataPulseWeb | 1, 3 to 12, Appendix A |
| Static site | BridgetSellsWI, ZakkiWedsYasmeen, drdatadecisionintelligence | 1, 3.1 to 3.3, 4, 6, 8, 9, 12, Appendix B |

## 1. Session start: read less, read right

1.1 Read this file first. Then the repo's README and its pointer file. Nothing else until the task needs it.
1.2 Read the step record, PR, or session log entry for the area being changed. Never read the whole repo.
1.3 Check origin/main and open PRs before cutting a branch. Say if another chat or Cursor touched the same files.
1.4 Confirm the location. Cursor prompts open with a location guard: the full path, then `(Get-Location).Path`, and stop if it does not match.
1.5 Say what cannot run where you are: Windows paths, the Tauri build without graphics libraries, the client pack, live Netlify. Never claim something ran when it did not.

## 2. The Hub is the machine

2.1 MVP Hub is the base architecture. Every client has its own repo that depends on a pinned Hub release. A client repo never copies or edits Hub code. It holds only its app shell and branding, its pack, its client modules, and synthetic examples. Real client answers stay on the client's machine.
2.2 A capability goes in the Hub when it is generic or a second client needs it. A capability only one client needs may live in that client repo as a module behind the Hub's extension contract. It moves into the Hub when a second client needs it.
2.3 The architecture map in `crates/hub-app/src/architecture.ts` is the one source of truth. A step that adds or changes a part updates the map in the same PR.
2.4 Every part is Built or Planned. Planned parts never appear as working in a demo, pitch, or document.
2.5 The Build profile decides what a client sees. A module that is on must cite answered STZ questions. A module that is off is hidden in the menu and refused by the backend.
2.6 Data class routing is fixed. Public and Internal may use code, local, pool, or the client's provider. Confidential and Restricted stay on code and the local model. Unclassified data is Confidential.
2.7 `BY_DESIGN_WE_DONT.md` is binding. A request that crosses it is flagged before any design.
2.8 Older client repos stay on their Hub snapshot unless Zubia decides to move them. New products start from the Hub.
2.9 STZ answers configure the Hub through code only. No model reads or rewrites answers to build a setup. The path:
   1. The owner fills the interview sheet in Word.
   2. `interview.rs` reads the docx tables row by row.
   3. Each row's question ID is matched against `stz/question_bank.toml`.
   4. `STZ_COMPILER.md` maps each answer to a setup file and field. The answer is copied verbatim with `source_question` recorded.
   5. The validator reports missing answers as gaps. Gaps stay gaps.
   6. The setup is fingerprinted and the owner signs the policy.
   A model sees the answers only later, inside an agent's instructions, as quoted text.
2.10 STZ material is split in two. The question bank is Dr. Data's. Client answers are the client's. Client answers never go in any repo. Repos hold synthetic answers only. The repo scan refuses any file named `STZ_*` outside the allowed method files. Dr. Data's own answers may be seeded in Dr. Data's own repos.

2.11 Every proposal is drafted with its scope.toml, and Schedule A is filled from it. A Hub part turns on only when an STZ answer needs it and a signed phase sold it (DD-ADR-076). Prices stay in the proposal.

## 3. How work is done

3.1 Diagnose, report, wait. Read the code. Say what is there, what is missing, and what it takes. Stop.
3.2 Nothing is committed until Zubia says go. When she says go, build exactly what was proposed. New findings come back as a report, not into the branch.
3.3 One step, one branch from main, one PR. A stacked branch only when the second step depends on the first, and the PR says so.
3.4 No conflicts. Before cutting a branch, check open PRs touching the same files. If two would overlap, say so and propose an order.
3.5 Tests first. Each new test fails before the code exists. Each bug found gets a test that reproduces it before the fix.
3.6 Every step updates its step record, `ROADMAP.md`, `DEBT_LEDGER.md`, and the map if parts changed.
3.7 One decision, one ADR in `docs/adr/`. Never edited after acceptance. A changed decision gets a new ADR that supersedes the old.
3.8 Only Zubia merges. Claude merges only when her message says so, then reports the hash.
3.9 Push, open the PR, stop. Do not wait on CI. Check the result at the start of the next step.
3.10 Claude and Cursor work together, whichever is cheaper for the task. The report says who did what.

| Work | Default |
|---|---|
| Diagnosis, design, ADRs, rule files, diff review | Claude |
| Rust logic and tests that run on Linux | Claude |
| PowerShell, installers, launching apps, Windows-only tests | Cursor |
| Checking the other's work | Both: Claude reviews Cursor's diff, Cursor runs Claude's branch on Windows |

3.11 Keep code nimble. Prefer fewer, smaller parts. No new dependency without saying why and what it costs. Nothing built "just in case". Planned parts go on the map, not into code.
3.12 For client features, the first build takes free text. Add fixed choices only after real values have been seen.

## 4. Tokens and speed

4.1 Targeted reads: search first, then read the lines needed.
4.2 During a step, run only the crate or file being changed, filtered by test name.
4.3 Run the full suites once per step, before commit, exactly as CI runs them.
4.4 Never `cargo clean`. Never delete a target folder. Reuse the build cache.
4.5 One session per step where possible. The step record is the handoff, not the chat history.
4.6 Let code check what code can check: test counts, merge state, file contents, hashes. Claude does design, diagnosis, and writing.
4.7 Pointer files hold rules and facts only. Session captures go to `SESSION_LOG.md`. A lesson that applies everywhere is promoted to this file at session end, not appended to a repo file.
4.8 PowerShell is held until Zubia asks for it.

## 5. Before every commit

5.1 Hub: `cargo test --workspace`, `npx tsc --noEmit`, and the frontend build. Cloud: typecheck, lint on touched files, tests, build.
5.2 Pre-existing failures and warnings are named, not fixed, inside a feature branch.
5.3 Grep the staged diff for client names, towns, domains, and keys. Zero matches or no commit.
5.4 Stage named files. Never `git add .`. Never commit `.env` or `.env.local`.
5.5 No em dashes in code, comments, UI text, TOML, docs, or commit messages.

## 6. Data and secrets

6.1 Synthetic data only in any repo or prompt. No client data, client answers, databases, `.env` files, or key files.
6.2 Never invent a number. A missing figure stays marked missing. Every figure on screen or in a prompt comes from a database row, the client's live data, or a cited source.
6.3 Never paste, generate, or display a key, token, or password in chat. Zubia generates secrets locally. A secret seen in any output, including pasted PowerShell output, gets rotated.
6.4 Never use a placeholder like YOUR_KEY_HERE in a command Zubia will run.
6.5 Client names appear only where permission is confirmed.
6.6 Do not open `C:\Users\Public` or any client folder outside `examples/`.
6.7 Never run: force push, `reset --hard`, `git clean`, recursive delete.
6.8 Code that deletes or moves data reads the result back before removing the original.
6.9 Seed content in a real person's voice comes from their own text, supplied explicitly. A model never authors it.

## 7. PowerShell and Zubia's machine

7.1 Every block starts with the full `cd` path on the same line, commands joined by semicolons, so one paste runs everything.
7.2 Hub tests use `CARGO_TARGET_DIR=C:\Users\zumah\MVP_Hub_target_test`.
7.3 Name the exact setup folder to load when testing. Never rely on a remembered copy.
7.4 The wrong folder or the wrong Cursor window is a real failure mode. Name the full path every time.

## 8. Writing and claims

8.1 Short sentences. Lead with the outcome. English only.
8.2 No italics in documents. No compliance or certification claims.
8.3 Status words are Live or Planned only.
8.4 Client-facing text says what the model does and does not do.
8.5 Every acronym is spelled out on first use in anything a client reads.

## 9. Reports and session end

9.1 Every report contains:
   1. Branch and commit hash.
   2. What changed: each file, one line on why, and anything deleted or renamed.
   3. Tests: new ones, failed then passed, and suite counts.
   4. One or two short code snippets that matter most, each with one plain sentence on what it does. Never the whole diff.
   5. Click test: three to five things to check on screen, with the exact folder or URL.
   6. Not done, and decisions needed.
   7. Suggestions: at most three, for smaller, safer, or more future-proof code. Never built without a go.
9.2 Reports stay under 25 lines plus snippets. No recap of steps taken.
9.3 Session end: update the step record or `SESSION_LOG.md`, promote general lessons to this file, and save durable decisions to the project. Add only, never delete.

## 10. CI

10.1 CI must be green before a PR is called ready. A red CI stops new work until it is diagnosed.
10.2 A check that keeps failing for a reason that is not a bug is fixed or narrowed in its own step. It is never ignored or switched off.
10.3 Run locally what CI runs, before pushing. CI confirms; it is not the first test.
10.4 After each merge, CI on main is checked once and reported.

## 11. Quality control

11.1 Two keys. No PR is ready until the other builder has checked it. Claude reviews the actual diff, not the report. Cursor runs it on Windows.
11.2 Red, then green, for every test and every bug.
11.3 The golden set never drops below the baseline in `HUB_SPEC.md` section 10. Warm the models before eval.
11.4 A UI change is not shipped until it is verified on screen: hard refresh, use the feature end to end, refresh again to confirm it persisted. Verify before pushing to main, not after.
11.5 Installer smoke test before any client release: install on a clean Windows profile, open, load the setup, run one agent.
11.6 No new warnings. Existing ones are listed in the debt ledger.
11.7 Flaky tests are bugs. Never retried until green, never skipped.
11.8 Diagnose with real data before changing selection or scoring logic. A fix built on sample data can pick the wrong answer.
11.9 Every repo that has tests has a `test` command and a CI that runs typecheck, lint, tests, and build. Added in the next PR in that repo.
11.10 Definition of done: tests pass, CI green, step record and map updated, report complete per 9.1, click test passed.

## 12. Netlify credits

12.1 Every successful production deploy costs 15 credits. Deploy previews and branch deploys cost 0. The Pro plan includes 3,000 credits a month; when they run out, every site on the team shows "Site not available".
12.2 Work merges to `main` freely. Production deploys come from a `release` branch. Zubia pushes `main` to `release` at most once a day per site, after the click test passes on the branch deploy.
12.3 One step, one merge. Do not merge several small PRs to `release` one after another; batch them.
12.4 Scheduled functions run hourly or slower. A faster schedule needs a client reason written in an ADR.
12.5 Anything that polls the server (live quizzes, remotes, dashboards) ships behind an off-by-default switch such as `LIVE_ENABLED`, stops when the server says it is off, pauses while the tab is hidden, and stops on its own after the event.
12.6 After a live event, turn the switch off the same day.
12.7 Large files (decks, images, video) cost bandwidth on every view. Compress images and keep decks under 5 MB where possible.
12.8 Check Team, then Usage in Netlify at the start of each week. Anything above 25% of the month's credits by day 7 gets diagnosed before new work.

## Appendix A. Cloud apps (React, Supabase, Netlify functions)

A1. What comes from the Hub is the design, not the code: the four data classes, a receipt for every model call, Live or Planned, one decision per ADR, step records, and `BY_DESIGN_WE_DONT`. To reuse a Hub feature, read the Hub part first, then adapt it to the cloud data model. Hub Rust is never pasted into a web repo.
A2. Restricted data never goes to a cloud app. Pulse receives telemetry only: data health and ROI numbers.
A3. Migrations live in `supabase/migrations/`, named by timestamp. The header lists the columns read before writing it. Never edit or renumber an old migration.
A4. Every new table carries its grants and RLS in the same migration. Authenticated only. Nothing to anon. `user_settings` stays service role. Turn off public sign-up when policies use `USING (true)`.
A5. Zubia runs the SQL. Claude gives the SQL for the Supabase SQL Editor plus a one-line check query. Long SQL uses dollar quoting. Migration before deploy, always.
A6. Supabase returns at most 1,000 rows per request. Every count pages through the table ordered by id.
A7. Keys live in Netlify env or the client's own Integrations card, stored encrypted. No shared fallback key. Server-only files carry a `@server-only` header, and `dist/assets` is grepped for key names and module names after build.
A8. Every paid AI call has a cache with an expiry and a cost cap.
A9. Display reads status and labels through the single-source helpers (`getEffectiveStatus`, `getSourceLabel`, `getStageLabel`). Never raw values. Activity metrics read the `interactions` table, never `updated_at`.
A10. A lead is one person. Dedupe stays on. Nothing inbound is dropped.
A11. Every catch block logs `err.message`. Every auth failure logs a reason before returning.
A12. Netlify functions stop near 30 seconds whatever `timeout` says. Long work is split into small requests. Functions are not type-checked by `npm run build`; check them with a temporary tsconfig and compare the error count to main.
A13. Each new function needs its own `/api` redirect. Scheduled function syntax changes one function at a time, never in bulk. Web calls go to a re-export, not to the scheduled function.
A14. Deploys: confirm the Netlify published hash matches the commit before anyone tests. Roll back by republishing the previous deploy, not by git revert. After editing an env var, type it, check its length, then clear cache and deploy.
A15. Every new Supabase project sets Site URL and redirect URLs before the first deploy.
A16. AI research cites a source URL for every claim or says it could not verify.
A17. One clone per client repo. Porting a feature means reading the target repo first and checking brand terms, towns, domains, and Supabase project.

## Appendix B. Static sites

B1. Plain HTML, CSS, and JS on Netlify. No build step unless the repo already has one.
B2. Every number on a page traces to a source. Run a number audit on every content page.
B3. One analytics file is the single source of attribution. No tracking tags added page by page.
B4. Confirm the Netlify published hash before anyone tests. Hard refresh before calling anything broken.
B5. Sections 1, 4, 6, 8, and 9 still apply.
