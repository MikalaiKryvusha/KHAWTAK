# Test run report — the calculation core in Chrome (smoke) and in Node (hygiene)

**Created:** 2026-11-17 10:26 +03:00 · **Run by:** the agent (Claude Opus 5.5) ·
**Version/build:** commit a5e8cdd (`kalculator/index.html` as committed; no build step)

## 1. Work

The core of `kalculator/index.html` after plan 02 steps S8 (section A, seam stresses) and S5–S6 additions (BEM with drag,
Sutherland viscosity, design Reynolds) — basis: criteria 1–7, 9, 10 of `plans/02_epic01_phase1_core.md`. Question of this
run: does the page's module run in a real browser, and does it compute what Node computes? The page has no user interface
yet (it comes after the KUIPS mock-ups), so no user path exists to walk.

## 2. Contour

The core only. Stand: this machine (Windows 11 Pro), Node v24.15.0 for the suite; Google Chrome
`C:\Program Files\Google\Chrome\Application\chrome.exe`, headless, a fresh profile in `.work/tmp/chrome-smoke/profile`,
the page opened from disk as `file://`. No production exists — no `REAL WORLD:` line applies.

## 3. Runs

| # | Moment | Command | Exit / outcome |
|---|---|---|---|
| 1 | 2026-11-17 10:25 +03:00 | `node kalculator/test.mjs` | exit 0 · 90 of 90 as expected |
| 2 | 2026-11-17 10:25 +03:00 | `node .work/tmp/chrome-smoke/smoke.mjs` (now `node tools/chrome-core-smoke.mjs`) | exit 0 · the core evaluated in Chrome, no errors |
| 3 | 2026-11-17 10:20 +03:00 | `node kalculator/test.mjs --control` | exit 0 · 42 of 42 mutants seen red (≈ 41 s) |
| 5 | ≈ 2026-11-17 15:27 +03:00 (recorded 2026-11-17 15:29 +03:00) | `node tools/chrome-core-smoke.mjs` (+ the mesh of section 1) | exit 0 · no errors, no requests; `node kalculator/test.mjs` 115/115, `--control` 75/75 |
| 4 | ≈ 2026-11-17 14:53 +03:00 (recorded 14:54) | `node tools/chrome-core-smoke.mjs` (after the third judge's fixes: the tube only along the stud) | exit 0 · no errors, no requests; the default seam case below; `node kalculator/test.mjs` 106/106, `--control` 62/62 |

## 4. Checks

- Hygiene: `node kalculator/test.mjs` 90/90 · `--control` 42/42 mutants red, each on its target case.
- Functional run: NONE — the page has no user interface; run 2 is a smoke of the core in the real browser (what Chrome
  computed was READ), not a walk by the user's path. The `[NOT-TESTED]` markers stay.

| Case | Status | Observation |
|---|---|---|
| the module runs in Chrome: `window.KHAWTAK` exists | pass | 46 exported names, title «KHAWTAK» |
| no console error, no uncaught exception | pass | `console errors: none` |
| self-contained (HOUSE_RULES R7): no request besides the page | pass | `requests besides the page: none` |
| Chrome = Node: section A2 (chord 180, t/c 18 %, M8, flanges 3 mm) | pass | Chrome A 898.3992388549207, Ix 127282.6500027534, k 8.134300264779332; Node A 898.3992388549208, Ix 127282.65000275338, k 8.134300264779329 — equal to the 16th digit |
| Chrome = Node: F0 through k(A2), 30 N·m, F_c 1.22 kN | pass | Chrome 4908.086131993044 N, Node 4908.0861319930455 N |
| the owner's default mast in the browser (interview 002 Q2 «B») | pass | hub 7 m → 2.3865734483410836 m/s (criterion 7: 2.39 ± 0.01) |
| Sutherland at 15 °C, Re of D 1.4 at 0.75R | pass | 1.7893e-5 Pa·s (standard 1.7894e-5); Re 62 010 (recon 01 §7: 62 thousand) |
| run 5 · Chrome = Node: section 1's mesh and STL (plan 03 G1) | pass | Chrome: 9434 triangles, closed, V 210748.00258818534 mm³, 471784 bytes, byte hash 2768478605; Node: the same count, V 210748.00258818528, the same bytes and hash |
| run 4 · Chrome = Node: the default seam (rotor 1.36 m, printed root, the blade's own mass, the tube along the stud) | pass | Chrome F0 2791.822146684068 N, M5, «caution», strict IEC fails; Node 2791.8221466840682 N — equal to the 15th digit |

## 5. Found

- none

## 6. Traces

- the console output of runs 1–3 in this session's transcript; the smoke script `tools/chrome-core-smoke.mjs`;
  the Chrome profile was temporary (`.work/tmp/chrome-smoke/profile`, deleted after the run).

## 7. Verdict

partial — the core runs in Chrome without errors or foreign requests and computes what Node computes, but no functional
run by the user's path exists until the page has its interface.
