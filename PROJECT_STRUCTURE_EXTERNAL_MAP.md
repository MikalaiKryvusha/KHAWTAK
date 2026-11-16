# KHAWTAK — External structure map

> **The EXTERNAL map: what the project looks like from the outside** — directories, files, and the dependencies between
> them. Companion: `PROJECT_ARCHITECTURE_INTERNAL_MAP.md` (the logic). **Living reference — never DONE-tagged.**
> Planned paths are marked *(planned)* until they exist on disk.

## The tree

```
KHAWTAK/
├── GOAL.md                 # the owner's vision, verbatim (+ his addendum of 2026-11-16 20:31)
├── HOUSE_RULES.md          # the owner's standing rules R1–R8, stands, machine dossier, product knowledge (defaults)
├── AGENT_GUIDE.md · PHILOSOPHY.md · *_FRAMEWORK.md · STATUS.md · MASTER_PLAN.md · EXPERIENCE.md · PROJECT_HISTORY.md
├── AUTHOR_STYLOMETRY.md    # the owner's voice portrait, PUBLIC snapshot — git-ignored, never committed
├── researches/             # recon notes, in Russian (HOUSE_RULES R4)
│   ├── 01_hawt_aero_generator_loads/   # BEM, airfoils, generator matching, site energy, IEC 61400-2 loads
│   └── 02_segmented_printed_blade/     # sections, joints, studs, preload, PETG, walls/infill, hub, size classes
├── kalculator/             # the product: one offline HTML page
│   ├── index.html          # the core between CORE-BEGIN / CORE-END (plan 02: S2 air and wind so far); the UI comes after KUIPS
│   └── test.mjs            # extracts the core and tests it in Node; `--control` = gate-5 mutants
├── design/
│   ├── icon/               # build-icons.mjs → khawtak-icon.svg (the owner's choice A) + variants a..f + the comparison page (homeworks/01)
│   └── flow-map/           # (planned) the KUIPS sheet
├── tools/
│   ├── hooks/*.mjs         # four Claude Code hooks ported from KUMM via KATAK (scratch-sweep, stamp-gate, no-backslash-heredoc, no-permission-question)
│   ├── test-hooks.mjs      # their 67-case hygiene suite
│   └── ui-run.mjs          # (planned) the Chrome run of the page
├── plans/ ideas/ bugs/ interviews/ homeworks/ reports/ testcases/   # KAIF knowledge dirs (each with its README)
├── .kaif/                  # KAIF machinery: kaif.json marker (+ testHook kinds), kaif-core.mjs, hooks/, tools/, spheres/
├── .claude/ .agents/ .grok/ .cline/ .roo/ .clinerules/   # skills for five agent systems; .claude/settings.json wires the hooks
├── package.json            # npm handles; devDependency kuips (github:MikalaiKryvusha/KUIPS#v1.3.1)
└── .work/tmp/              # agent temp files — git-ignored (HOUSE_RULES R1)
```

## What each part is

| Path | What it is | Depends on / references |
|------|-----------|-------------------------|
| `GOAL.md` | the owner's words — never edited except a verbatim append of his later words | — |
| `researches/NN_*/README.md` | the external truth the core is coded from | sources on the web; KATAK `researches/01,02,05,07` |
| `kalculator/index.html` *(planned)* | the whole product, one file, no network | numbers sourced from `researches/` (`// source:` comments) |
| `tools/hooks/` | project hooks wired in `.claude/settings.json` | `.claude/settings.json`, `tools/test-hooks.mjs` |
| `node_modules/kuips` | KUIPS — the mock-up sheet tool (`npx kuips …`) | `package.json` |

## Cross-references & dependency rules

- The page references nothing in the repository (HOUSE_RULES R7): a number's source is named inside the page itself.
- Code cites recon (`// source: researches/NN_…/README.md §X`); recon never cites code.
- The sibling KATAK is a reference to copy patterns from, never a runtime dependency.

## Entry points

1. `STATUS.md` → 2. `GOAL.md` → 3. `HOUSE_RULES.md` → 4. `researches/01`, `researches/02` → 5. `MASTER_PLAN.md`.
