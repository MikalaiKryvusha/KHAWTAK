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
>      field-dropped-in-rebuild, subagent-wrong-root, shared-temp-collision, unverified-reference, question-without-stake,
>      evidence-discarded -->
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
> | `unverified-reference` | a number from a recon or a subagent becomes a test target without being re-derived by a second route |
> | `question-without-stake` | the owner is asked something whose answer changes no work in progress — a user input, not a fork |
> | `evidence-discarded` | the script that produced a quoted number was deleted, so a later mismatch can be bounded but not traced |
>
> The `#tags` are **trigger-tags**: before a task, grep by the task's tags and QUOTE the relevant
> lessons in your report (id + one line) — or state "no relevant lessons". An unquoted recall is
> unverifiable; `/fable-judge` checks for this line.
>
> Skill: `/experience` (capture a lesson · recall relevant lessons).

## Entries

### EXP-0007 · 2026-11-17 · ❌→✅ · #grep #cyrillic #shell #count
class: shell-lied
**Context:** counting where the village name stands before an owner question about public files.
**Tried / did:** `git ls-files | xargs grep -liE "<название>|<латиницей>"` in Git Bash.
**Result:** ❌→✅ — 7 files, 9 lines, exit 0; `-i` did not fold the Cyrillic capitals («[…]», «[…]»), so GOAL.md and
HOUSE_RULES.md were missing. Node with `/…/iu` found 38 lines in 14 files.
**Lesson:** a count of Cyrillic text is taken by Node (or `review.mjs --search`), never by the shell's `grep -i` — the shell
returns a smaller number with a green exit code.   → link: interviews/interview_004_place_in_public_files.md
**Repro:** `node -e "…/<название>/iu…"` over `git ls-files` (the session's command, kept in interview 004's context).
**Trigger:** about to count or prove the ABSENCE of a Russian word with grep → use Node.
**Not for:** ASCII patterns; exact-case Cyrillic searches where the case is known.
none-cheap: first strike here; the KAIF door already searches through Node (`review.mjs --search`) for exactly this reason.

### EXP-0006 · 2026-11-17 · ❌→✅ · #recon #checkpoint #scripts #reproducibility
class: evidence-discarded
**Context:** two recon checkpoint tables (recon 02 §2.4 sections, recon 01 §1.6 BEM with drag) were re-derived by the core.
**Tried / did:** the sections agreed within the method spread; the drag table sat 0.2–1.5 % off, the gap growing with drag.
**Result:** ❌→✅ — the recon scripts had been deleted («удалён после разведки»), so the gap could be BOUNDED by an analytic
route but never TRACED; the criterion took a band instead of a cause. The second route of this session was kept:
`tools/section-raster.mjs`.
**Lesson:** a script that produced a checkpoint is evidence — keep it in the repository next to the numbers, never in a
temp folder that a cleanup deletes.   → link: plans/02_epic01_phase1_core.md (criteria 9, 10) · researches/01 §1.6
**Repro:** a recon or a second-route run with [РАСЧЁТ] numbers → its script lands as `researches/NN_*/<name>.mjs` or
`tools/<name>.mjs` in the same commit; `git ls-files researches/NN_* tools/` shows it.
**Trigger:** writing a recon brief or deleting a temp script that printed a number a document quotes → keep it instead.
**Not for:** throwaway probes whose output no document quotes.
none-cheap: first strike; the cure is one brief line («keep the script in researches/NN/»), the subagents deleted theirs because the brief allowed one file only.

### EXP-0005 · 2026-11-16 · ❌ · #interview #owner #questions
class: question-without-stake
**Context:** interview 002 asked the owner where his own mast stands and how tall it is.
**Tried / did:** two scenario questions with yields per mast spot and height (recon 03 numbers, computed by the core).
**Result:** ❌ — he answered both (B, B) and wrote on each «не понимаю, зачем тебе эта информация»: the MVP is the BLADE; his
mast is one user's input on the page, not a fork that blocks work.
**Lesson:** before filing a question, name the work it unblocks; if every user of the tool would type the answer into a field,
it is an input with a default, not a question to the owner.   → link: interviews/interview_002_mast_spot_height.md
**Repro:** the interview's «Answer target» must name a plan step that waits on it — `grep -n "Answer target" interviews/<doc>`.
**Trigger:** drafting a question → can the plan step proceed with a sensible default and a field on the page? Then do not ask.
**Not for:** decisions that shape the product for every user (scope, safety, publication).
none-cheap: first strike; the interview skill already demands an answer target — this one named a default, not a blocked step.

### EXP-0004 · 2026-11-16 · ❌→✅ · #recon #checkpoint #bem #tests
class: unverified-reference
**Context:** plan 02 took recon 01's checkpoints as test targets; the BEM Ct went red (0.878 against 0.84).
**Tried / did:** before touching the code or the target — two more routes: plain momentum 4aF(1−a) gave 0.835 (the
recon's number), momentum with Buhl's C_T where a > 0.4 gave 0.878 = the blade-element value.
**Result:** ❌→✅ — the recon's checkpoint was computed outside its formula's range; corrected where it stood (bugs/01_DONE).
**Lesson:** a recon checkpoint is a FINDING; when a test against it goes red, re-derive it by a second route of the same
documented method before moving either the code or the target.   → link: bugs/01_DONE_ct_checkpoint_mismatch.md
**Repro:** for a red physics criterion, compute the quantity two ways (e.g. blade-element vs momentum) in `.work/tmp` and
compare with the target before editing anything.
**Trigger:** a criterion copied from `researches/` goes red → two routes first.
**Not for:** identities with exact values (Γ(1) = 1) — those are not findings.
none-cheap: first strike; the cure is a habit of the red run, and the guard for THIS quantity is in the test already.

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
Third strike, 21:43: a dated stamp one minute ahead was typed into a script (claim-ok: the next line quotes the refused stamp)
«✅ 2026-11-16 21:44» — the `stamp-gate` hook REFUSED it: the guard holds dated stamps; the cure applied: `NOW="$(date …)"` claim-ok: quote of the refused stamp
passed to the script through the environment.
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
