# KHAWTAK — KAIF 2.9 (+ 2.10 pre-release) install report

**Delivered upstream:** NOT YET

Project: KHAWTAK (KRINIK Horizontal-Axis (three-blade) Wind Turbine Automated Kalculator) — a greenfield web tool (sizes a
small 3-blade HAWT and generates its blade as 3D-printable sections clamped on steel studs); the tree held only the owner's
`GOAL.md` before the install. Machine: Windows 11 Pro 10.0.26200, Git Bash 5.2.21 + PowerShell 5.1, Node v24.15.0. Agent:
Claude Opus 5.5 (Claude Code, VS Code extension). **The install was driven from a chat whose working directory is a SIBLING
deployment (KATAK, KAIF 2.9 + 2.10 pre-release, same build)** — the owner's words: «давай сдлеаем новую папку в ai_sandbox …
как и в KATAK, делаем папку, разворачиваем KAIF 2.9 + 2.10 WIP». Session date: 2026-11-16.
EXPERIENCE recall: the project's log was empty before this session; EXP-0001 (`subagent-wrong-root`) and EXP-0002
(`shared-temp-collision`) were written during it (§2.1, §2.2, §2.5).

## 1. Chronology with numbers

- 20:28 `git init -b main`; owner's `GOAL.md` (his chat message verbatim) committed first (`162eb1b`); his addenda appended
  verbatim and committed alone (`3f36b7c` 20:31, `c9bb14d` 21:16).
- `KAIF.md` fetched from `raw.githubusercontent.com/MikalaiKryvusha/KAIF/main/KAIF.md` (15 353 bytes), byte-equal (CR
  stripped) to the local `KAIF/dist/KAIF.md` at KAIF `d2f2127`. Loader extracted mechanically (`awk` between the six-backtick
  fences) — 149 lines, `node --check` ok.
- `node KAIF-LOADER.mjs --lang ru --channel main` → exit 0; marker `version 2.9 · prerelease 2.10 · build 3aa4b346ba3b`;
  `KAIF_ADAPTATION_TASK.md` with 11 items.
- Adaptation: `wire-hooks` done FIRST by hand (as #197 §2.2 asked) — 15 entries into a new `.claude/settings.json`, 10
  scripts: `session-start-refresh`, `prompt-refresh-timer`, `prompt-resume-word`, `clock-now` (prompt + pre-write),
  `knowledge-moment` (prompt + post-tool + post-failure), `context-window` (prompt + post-tool), `subagent-preamble`,
  `test-after-code` (post-tool + stop), `stop-status-guard`, `stop-farewell-capture`. Then sphere `programming`, project-name
  `KHAWTAK` (7 seeded H1 headings fixed by `sed`), placeholders (`checkpoint placeholders` re-synced 175 mirror copies — a past
  output), owner-voice (public snapshot, git-ignored), maps, goal-plan, kaif-framework, study (nine core documents re-read,
  marker `ritual:install` 20:40:19).
- Project additions (not KAIF payload): `HOUSE_RULES.md` R1–R8 carried over from KATAK with their provenance lines; four
  project hooks from KATAK `tools/hooks/` + their suite (`node tools/test-hooks.mjs` → `67 of 67 as expected`); `testHook`
  kinds copied into `.kaif/kaif.json`; KUIPS 1.3.1 as a devDependency.

## 2. Friction and rakes

1. **The subagent preamble hook and auto mode collide when the hook rewrites an Agent call.** Two research subagents were
   launched in one message; both calls came back refused: «The server-side auto mode classifier gave no verdict for Agent: a
   hook changed this call's input after auto mode reviewed it … In your next response, issue the Agent call once more with
   exactly that input». The hook is `.kaif/hooks/subagent-preamble.mjs` (it prepends `[KAIF subagent preamble v1]`). The
   re-issue with the hook-produced input passed. Observed on one pair of calls; the cause the refusal names is the rewrite.
   Cost: one round trip — and in that window the owner sent new design inputs, which then had to reach the running subagents
   by `SendMessage` instead of the brief. Suggest: the hooks README and the subagent brief template say that under auto mode
   a call the hook rewrites is refused once; or tell the agent to write the marked preamble itself — the hook leaves a prompt
   that already carries the marker alone (`subagent-preamble.mjs:63`, `input.prompt.includes(MARKER)`). Observed: the judge
   subagent of this install, launched with a self-written marked preamble, was not refused.
2. **The preamble points a subagent at the WRONG project when the install is driven from a sibling chat.** The preamble
   says «read IN FULL, from the project root … STATUS.md · AGENT_GUIDE.md · … · EXPERIENCE.md» — the root is the chat's
   working directory (KATAK), while the subagent's task lives in the new project. Each research subagent was told to read 13
   documents of an unrelated project before its task. Suggest: the preamble names the root it means by absolute path,
   and/or honours a `Project root:` line in the brief. Workaround used for the judge: the self-written marked preamble names
   the KHAWTAK root by absolute path.
3. **The ignore-first set lacks `node_modules/`.** The install writes `package.json` (the `kaif:*` handles) and the fresh
   `.gitignore` has no `node_modules/` line; after the first `npm install` (KUIPS) a sweeping add would have staged
   `node_modules/`. Caught by reading `.gitignore` before the first commit. Suggest: add `node_modules/` to the ignore-first
   set whenever the install creates or touches `package.json`.
4. **`wire-hooks` is still item 9 of 11** (#197 §2.2 asked for it to be first). Done first by hand here — and in THIS install
   it changed nothing for the session, because the chat runs the sibling's hooks (§3.1); in a chat opened in the new project
   the order matters as #197 described.
5. **Two concurrent subagents share one temp folder.** The brief template's Bounds offer no per-agent temp folder; both
   recon subagents were told «temp files go into `.work\tmp` … delete them when done». One reached for a recursive delete of
   the folder (refused by the harness), then deleted its own eight files by name. Suggest: the template's Bounds line names a
   per-agent subfolder (`.work/tmp/<label>/`).

## 3. What confused a cold agent (top 3)

1. Driving an install from a sibling chat: the NEW project's hooks (`.claude/settings.json` of the new folder) do not run in
   this session — the sibling's hooks do (observed: its `knowledge-moment` fired on reads of the new tree's files, e.g.
   «you re-read ../KRINIK_Horizontal_…/HOUSE_RULES.md»). The canon does not say which project's hooks govern such a session;
   STATUS of the new project tells the next session to reopen the editor in the new folder.
2. Entry cost: `check` says `/resume` reads ~81k tokens here (it counts `HOUSE_RULES.md` too); `AGENT_GUIDE.md` ~36k tokens,
   over the 25k one Read returns — read in parts.
3. The knowledge-moment hook fires on `PostToolUseFailure` for a `diff` that exits 1 because files DIFFER (its documented
   success meaning): «a tool call failed — you expected one thing and got another». Noise, not a rake.

## 4. Final state and judge verdict

- Judge: a clean-instance subagent, read-only, 21:08–21:15, briefed with eleven claims to re-run. **VERIFIED WITH CAVEATS.**
  C1 `check` → «✅ manifest satisfied: 110 files + 152 agent artifacts present»; C2 `67 of 67 as expected`; C3 GOAL commits
  add lines only; C4 nine checkpoints (all but field-report and verify); C5 15 KAIF + 4 project entries, 0 missing scripts;
  C6 the four project hooks differ from KATAK's by the guard label and comments only; C7 all private/generated paths ignored;
  C8 marker `ritual:install` with the nine core documents; C9 no placeholders left; C10 numbers reproduce (15 353 bytes, 149
  lines, the hashes).
- Findings and their fate: F1 STATUS called phase 0 done and «the tree green» before `verify-final` and the deploy commit →
  STATUS rewritten after the commit; F2 «~73k tokens» was stale → §3.2 now quotes today's ~81k; F3 the wired hooks were not
  named → §1 names them; F4 three loop skills and the sphere library named the not-yet-existing build and harness commands
  without a mark → «PLANNED, the file does not exist yet» added, mirrors re-synced (`sync`, 175 copies); F5 a ported hook
  comment called KATAK's scratch hash «this project» → corrected, suite 67/67 again; F6 the agent's label line in `GOAL.md`
  lacked the `[AI]` mark → marked; F7 «the FIRST Agent call is refused» generalised one pair → §2.1 reworded; F8 no
  EXPERIENCE recall line and the temp collision missing → header line and §2.5 added; F9 the name expansion lacked
  «three-blade» and an identity row claimed a meaning with no owner source → both fixed. The agent's own re-read found one
  more claim wider than its evidence (§2.4: the early wire-hooks «covered the first subagents») → corrected.
- `verify-final` → «✅ verify-final passed — KAIF install is complete and self-cleaned» (after `checkpoint verify`; the first
  run named that checkpoint missing). Delivery: `node .kaif/kaif-core.mjs report <this file>` was refused by the agent
  harness's auto-mode classifier («[Unsanctioned Communication]») — the canon's standing authorization for field reports
  does not reach the harness. Left to the owner; whoever delivers it, this line is the evidence of why it came late.
