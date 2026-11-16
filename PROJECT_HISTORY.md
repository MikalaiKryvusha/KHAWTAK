# KHAWTAK — Project History (the chronicle)

> The APPEND-ONLY chronicle of how this project lived and grew: closed sessions, shipped phases,
> releases, big decisions in the order they happened. This is where `STATUS.md` sheds its past —
> STATUS stays a short live summary of NOW; everything finished moves HERE (the "bonsai trim" step
> of `/end-chat-soft`).
>
> **Not required reading.** This file is NOT part of `/resume`'s canon set and not in the
> before-every-task minimum — open it only when you actually need the archaeology: how a decision
> came to be, what an old phase contained, when something shipped.
>
> **Chronicle rules (ADR discipline):**
> - **Append-only, newest on top.** A recorded entry is never edited to say something else —
>   history that can be rewritten is not history. Corrections come as NEW entries that reference
>   and supersede the old one.
> - An entry moves here VERBATIM from `STATUS.md` when its work closes — move, don't rewrite;
>   the entry already carries its dates, counters and file pointers.
> - Entries mention versions and dates freely — a chronicle legitimately speaks of old versions,
>   and the update machinery's stale-claims scan knows to leave this file alone.
> - When the file grows unwieldy, split by era: keep the newest era here, move older ones to
>   `PROJECT_HISTORY_<era>.md` files, and leave a one-line index at the top of this file
>   (the pattern large changelogs use).
>
> Living document — never DONE-tagged.

---

## Entries (newest first)

### 2026-11-16 22:13 +03:00 — сессия 1 закрыта: от GOAL.md до ядра расчёта (чат открыт в папке KATAK) ✅

Записи STATUS.md на момент закрытия — дословно:

### Сессия 1 — 2026-11-16 с 20:26 +03:00 (идёт; чат открыт в папке KATAK)
- Папка `D:\work\ai_sandbox\KRINIK_Horizontal_Axis_Three_Blade_Wind_Turbine_Automated_Kalculator`, `git init -b main`;
  `GOAL.md` — слова владельца дословно (два коммита: видение 20:26 и дополнение 20:31).
- KAIF 2.9 + пре-релиз 2.10 с канала `main`; 15 хуков KAIF подключены первым пунктом адаптации; 4 хука из KUMM (через
  KATAK) в `tools/hooks/` — `node tools/test-hooks.mjs` 67/67; правила владельца R1–R8 перенесены из KATAK в `HOUSE_RULES.md`.
- KUIPS 1.3.1 в devDependencies (`npx kuips …`); портрет голоса — публичный слепок, в `.gitignore`.
- Разведки (субагенты, 20:33–21:02): `researches/01_hawt_aero_generator_loads` (БЭМ, профили, генератор, ветер на 4–7 м,
  нагрузки IEC 61400-2) и `researches/02_segmented_printed_blade` (секции, стыки, шпильки, затяжка, PETG, нутро, ступица,
  классы размеров). Главным агентом перепроверены: пример затяжки 02 §2.4 (k, F₀, σ, ключ 7,9 Н·м), магниты 01 §4.1 (352 мм
  против 480 мм), минимальные хорды 01 §2.3, ветер на ступице 01 §5.3; остальное — находки разведчиков, их «не проверено» —
  в конце каждого конспекта.
- Иконка: круг 1 (`homeworks/01`), выбор владельца 21:27 — А «Дуги скорости»; интервью 001 — семь развилок; полевой отчёт установки KAIF — судья: подтверждено с оговорками, исправлено.

- [x] Разведка 03 — ветер посёлка (`researches/03_site_wind`) ✅: [координаты скрыты], ≈ 160 м; опорный ветер
  3,0 м/с на 10 м над открытой местностью (Барановичи 1991–2020), k 1,8; ротор 1,4 м, посёлок среди полей: 50 / 72 / 85 кВт·ч
  в год на мачте 7 / 10 / 12 м; правило мачты — низ ротора на 9 м выше препятствий в радиусе 90 м (US DOE, Otherpower).
  Контрольные точки перепроверены ядром KHAWTAK (критерий 7 плана 02). Вопросы о мачте — интервью 002.
- [ ] 🔧 **Эпик 01 — MVP-лопасть, фаза 1 — ядро расчёта** (`plans/02_epic01_phase1_core.md`): с 21:46 по 22:03 сделаны S1–S6
  и половина S8 — `kalculator/index.html` (только ядро, без интерфейса) и `node kalculator/test.mjs` **66/66**,
  `--control` **23/23** мутанта красные; критерии 1–7 плана зелёные (воздух, лопасть Шмитца, БЭМ Cp 0,517 и Ct 0,878,
  хорда под шпильку, затяжка 4,95 кН и ключ 7,9 Н·м, самая тонкая шпилька, ветер и выработка посёлка). **Дальше:**
  1) S8 — утолщения, трубка и перегородка в сечении оболочки, затем пример A1/A2 разведки 02 §2.4 как критерий;
  2) поляра профиля (развилка FORK в S3) и Cp ротора из БЭМ вместо постоянного Cp_e;
  3) S7 — нагрузки IEC 61400-2, сначала вопрос владельцу: строгие коэффициенты IEC или запас самодельщика;
  4) S9 — отчёт прогона и пометки.
- [x] Разведка 04 — `researches/04_web_stl_blade_mesh` ✅ 2026-11-16 21:43: веб-часть из KATAK как есть; профиль NACA по
  формуле (сверена с источниками), печатная задняя кромка ≥ 2 линий, нутро — тело с полостями, карман закладной, ZIP «stored».

