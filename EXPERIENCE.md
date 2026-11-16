# EXPERIENCE — the agent's accumulated experience

> The agent's growing log of lessons. **Externalized memory of *what works and what doesn't*** — so a
> fresh, context-less session (or an autonomous loop) never repeats a dead end. Consult it BEFORE a task;
> append to it AFTER a meaningful attempt (success **or** failure). Grep, don't scroll.
>
> **Tags live inline on every entry** (not in a central list) — so one grep finds the experiences directly:
> `grep '#loop' EXPERIENCE.md` · `grep -i '#context\|#build' EXPERIENCE.md` · `grep '❌' -A4 EXPERIENCE.md`
> · `grep 'EXP-0007' EXPERIENCE.md`. Reuse an existing tag where one fits (grep to see what's in use).
>
> **Entry format (keep it short and grep-friendly).** Newest on top. Every entry starts with a stable id,
> an ISO date, an outcome marker (`✅` / `❌` / `❌→✅`), and inline `#tags`:
>
> ```
> ### EXP-0001 · 2026-01-01 · ✅ · #tag #area
> class: <slug from the class list below — the UNIT OF RECURRENCE>
> **Context:** one line — what was being done.
> **Tried / did:** the approach, briefly.
> **Result:** ✅/❌ — what happened.
> **Lesson:** the reusable takeaway (the reason this entry exists).   → link: bugs/NN · ideas/NN · plans/NN
> **Repro:** the ready-to-run command/check that verifies or applies the lesson — a weak session
>   executes a pasted command reliably, an essay it won't act on. REQUIRED since 2.1: a lesson
>   with no Repro line is not accepted (field-proven: lessons with a Repro command get executed,
>   essay-lessons get read and ignored). If the lesson genuinely has no command, say what to
>   OBSERVE instead — but say it as an action.
> **Trigger:** for class-level lessons — the decision point that must invoke this lesson, as
>   "writing X → run Y" (the lesson names WHERE it applies, instead of hoping to be remembered).
> **Not for:** the lesson's validity range — where it does NOT apply. A documented lesson is still a
>   hypothesis; applied outside its range it kills good ideas.
> ```
>
> **A lesson that repeats is a lesson that failed as text.** When the same class recurs in NEW code
> after its entry was recorded, the journal has proven insufficient — the lesson MUST become
> executable (a linter rule, a guard, a gate), and the entry gains the line
> `mechanized: <the tool>`. Two strikes → a mechanism, never a third reminder.
>
> **The deadline is RUN, not remembered** (2.7, epic EL; origin issue #69 — a field audit of one
> project's journal: 14 of 15 failure classes recurred AFTER their lesson was written, five lessons
> written 6–17 times in different words, 5.8 % mechanized): `node .kaif/tools/kaif-experience-lint.mjs
> check` reads the `class:` field as the UNIT of recurrence and reddens on the SECOND failure entry of
> one class with no `mechanized:`, naming the class and both entries by id. Two fates clear it, both
> WRITTEN: name the guard in the entry (`mechanized: <the tool>`), or re-check the price once for the
> WHOLE class and declare it — `<!-- class-ok: <slug> — <why it is not cheaply possible> -->` (an empty
> declaration is itself a finding; the declared classes are printed on the summary line and that list
> only shrinks). A third record is never a fate. It also warns when
> `mechanized:` names a command this project does not contain, and when a slug is outside the list
> below; `--shrink EXP-NNNN` collapses a MECHANIZED entry to one line pointing at its guard (shows by
> default, `--yes` writes — the text itself stays in the git history). The command belongs in the
> closing ritual (`/end-chat-soft`).
>
> **The class list of this journal** — a CONTROLLED list, not a closed one: pick a slug from it, and
> when a lesson genuinely brings a new class, add the slug here in the same write (the linter warns
> about an unlisted slug, it never refuses). The starter list below is what a field audit had already
> measured (origin issue #69) — replace and grow it with your project's own classes.
>
> <!-- classes: question-already-answered, guard-not-proven-against-threat, shown-as-link,
>      claim-before-evidence, owner-decision-not-applied, text-in-agents-world,
>      etalon-from-dirty-tree, shell-lied, escaping-layer, twins-missed,
>      field-dropped-in-rebuild, subagent-wrong-root, shared-temp-collision -->
>
> | Class slug | The failure it names |
> |---|---|
> | `question-already-answered` | the owner is asked what his own past word, the goal doc or a run already decided |
> | `guard-not-proven-against-threat` | a guard shipped without being seen red on the threat it claims to stop |
> | `shown-as-link` | showing replaced by a link or a path instead of the thing itself |
> | `claim-before-evidence` | a claim written wider than the observation behind it |
> | `owner-decision-not-applied` | a decision the owner gave is recorded and not carried into the artifact |
> | `text-in-agents-world` | text written for the agent's own world instead of the owner's |
> | `etalon-from-dirty-tree` | a reference/etalon captured from a tree that was not clean |
> | `shell-lied` | the shell or the tool swallowed/rewrote what was passed to it |
> | `escaping-layer` | one escaping level lost between the tool and the file |
> | `twins-missed` | one of two layers/copies moved and the twin stayed behind |
> | `field-dropped-in-rebuild` | a field or section silently lost when an artifact was regenerated |
> | `subagent-wrong-root` | a subagent is pointed at the canon of the chat's project instead of the project its task lives in |
> | `shared-temp-collision` | two agents share one temp folder and a cleanup of one would delete the other's files |
>
> The `#tags` are **trigger-tags**: before a task, grep by the task's tags and QUOTE the relevant
> lessons in your report (id + one line) — or state "no relevant lessons". An unquoted recall is
> unverifiable; `/fable-judge` checks for this line.
>
> Skill: `/experience` (capture a lesson · recall relevant lessons).

## Entries

### EXP-0003 · 2026-11-16 · ❌→✅ · #stamp #status #clock
class: claim-before-evidence
**Context:** STATUS was edited BEFORE the deploy commit and stamped the phase «✅ 21:22» and a refusal «21:20» ahead of the event.
**Tried / did:** wrote the minute by feel; the clock probe at the commit said 21:19, the refusal had come before it.
**Result:** ❌→✅ — both stamps replaced by measured ones; the `stamp-gate` hook did not fire: the stamp was a bare `HH:MM`
inside a table cell, with no date next to it.
**Lesson:** stamp an event AFTER it happened, from the probe of the same command (KATAK's EXP-0004 is the same class).   → link: STATUS.md
**Repro:** `NOW="$(date '+%H:%M')"` in the command that performs the event, then write `$NOW` into the document.
**Trigger:** writing «✅ HH:MM» or «done at HH:MM» → the event already happened and the probe printed that minute.
**Not for:** planned times the owner named («until 23:00»).
Second strike, minutes later: «идёт с 21:21» written by `sed` while the probe of the same command printed 21:20.
mechanized: .kaif/hooks/clock-now.mjs — write a moment only through Write/Edit with the NOW placeholder (the word NOW in white
square brackets), which the hook fills from the machine's clock; never type a minute into a `sed` or `echo` line.

### EXP-0002 · 2026-11-16 · ❌→✅ · #subagent #tmp #cleanup
class: shared-temp-collision
**Context:** two recon subagents ran at once with the same temp folder `.work/tmp` (the main agent's files lived there too).
**Tried / did:** the brief said "temp files go into `.work\tmp` … delete them when done".
**Result:** ❌→✅ — one subagent reached for a recursive delete of the folder; the harness refused it, and the subagent then
deleted its own eight files by name. A granted delete would have taken the sibling's and the main agent's files.
**Lesson:** give every subagent its OWN temp subfolder and tell it to delete only that folder.   → link: reports/KAIF_UPDATES/KHAWTAK_KAIF_2.9_INSTALL_REPORT.md
**Repro:** in each brief write `temp: .work/tmp/<agent-label>/ — create it, delete only it at the end`.
**Trigger:** writing a brief for a second concurrent subagent → name its own temp subfolder.
**Not for:** a single subagent with nothing else in `.work/tmp`.
none-cheap: first strike; the harness already refuses a recursive delete in auto mode, and the cure is one brief line.

### EXP-0001 · 2026-11-16 · ❌→✅ · #subagent #hooks #automode #sibling-project
class: subagent-wrong-root
**Context:** KHAWTAK was installed from a chat whose working directory is the sibling KATAK; the chat's
`subagent-preamble` hook prepends «read IN FULL, from the project root … STATUS.md · AGENT_GUIDE.md …».
**Tried / did:** two Agent calls with a plain brief.
**Result:** ❌ both refused by auto mode («a hook changed this call's input after auto mode reviewed it»); the re-sent
input sent the subagents to read KATAK's 13 canon documents for a KHAWTAK task. ✅ The judge brief carried its own line
`[KAIF subagent preamble v1] … its root is <absolute KHAWTAK path>`: the hook left it alone (`input.prompt.includes(MARKER)`),
auto mode passed it on the first call.
**Lesson:** when the chat's project is not the task's project, write the marked preamble yourself and name the task's
root by absolute path.   → link: reports/KAIF_UPDATES/KHAWTAK_KAIF_2.9_INSTALL_REPORT.md §2.1–2.2
**Repro:** start the brief with `[KAIF subagent preamble v1] Before the task below, enter the project the task is about — its root is <abs path> …`.
**Trigger:** launching a subagent for another project than the chat's working directory → self-written marked preamble.
**Not for:** a subagent working in the chat's own project — let the hook write the preamble.
none-cheap: first strike; the fix belongs to the KAIF hook itself (asked upstream in the field report), not to a local guard.
