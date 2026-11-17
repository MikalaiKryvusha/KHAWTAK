# Plan 02 — epic 01, phase 1: the calculation core (site, blade aerodynamics, loads, stud and preload)

> **Создан:** 2026-11-16 (main agent, the autonomous stretch the owner ordered at 21:40) · **Родитель:**
> `plans/01_EPIC_mvp_blade.md` → phase table, row «1 · ядро расчёта» · **Статус:** 🔧 S1–S2 done 2026-11-16 (criteria 1 and 7
> green); S3 nearly done, S4–S5 done (criteria 1, 2, 3, 4, 7 green); S6 done, S8 half done (criteria 1–7 green); S8 done
> 2026-11-17 (criterion 9 green, 81/81, `--control` 35/35); criterion 10 (BEM with drag) and Re green 2026-11-17 (90/90,
> 42/42); S7 ✅ 2026-11-17 — loads D, H, E (criterion 11), the owner's margin policy (interview #003 «A»), the printed root (99/99, 55/55); next —
> S3's polar, `--control` expectations, S9 · **Вовне:** one question to the
> owner at step S7 — answered: interview #003, Q1 «A» (2026-11-17 10:41 +03:00)

## Goal vector

**Achieve:** a DOM-free core inside `kalculator/index.html` (between `CORE-BEGIN` / `CORE-END`) that turns the site, the
rotor diameter and the user's stud grade into the blade geometry, the power curve and yearly energy, the loads, the
smallest stud and its preload — every number traceable to `researches/01–04`. **Avoid:** an unsourced constant; a check
that cannot fail.

## Acceptance criteria (each a check `node kalculator/test.mjs` prints)

1. ρ(220 m, 7 °C) = 1.2275 kg/m³ ± 0.0005 — `researches/01` Appendix A.
2. Schmitz chord at R 0.45 m, λ 4, B 3, C_l 1.26, r 0.045 m = 89.4 mm ± 0.2, θ = 39.47° ± 0.05 — `researches/01` Appendix A.
3. BEM on the Schmitz blade, λ 6, C_l 1, L/D ∞, hub 0.1 R: Cp = 0.518 ± 0.005, Ct = 0.878 ± 0.01 — `researches/01`
   Appendix A, Ct corrected 2026-11-16 (`bugs/01_DONE_ct_checkpoint_mismatch.md`: the first value 0.84 used 4aF(1−a) in
   Buhl's region; blade-element loads and momentum-with-Buhl both give 0.878, and their agreement is guarded).
4. Minimum chord housing an M8 with two 2 mm walls at t/c 12 % = 100 mm ± 1 — `researches/01` §2.3.
5. Preload example A2: F₀ = 4.95 kN ± 0.05, wrench torque M8 = 7.9 N·m ± 0.1 — `researches/02` §2.4.
6. Stud choice for 2.6 kN at margin ≥ 1.5: grade 4.8 → M5, grade 8.8 → M4, A2-70 → M4 — main agent's check over
   `researches/02` §10 with ISO 898-1 / ISO 3506 (STATUS, 2026-11-16).
7. Brest region site, 1.4 m rotor, two log profiles (z0 0.25, k 1.8, ρ 1.2345): hub 2.39 / 2.64 / 2.77 m/s ± 0.01 and
   50 / 72 / 85 kWh ± 1 % at masts 7 / 10 / 12 m — `researches/03` §3.2, §4.2, re-computed by the core 2026-11-16.
8. Control case (gate 5): each of 1–7, 9 and 10 is seen RED once on a deliberately broken constant before it is trusted.
9. The root seam of the R 1.0 m blade — chord 180 mm, t/c 18 %, NACA 44xx, M8 at 0.40c: section A1 (shell T(3) + tube +
   web) A 518 mm² ± 2 %, Ix 63 560 mm⁴ ± 2 %, k 6.75 mm ± 3 %; A2 (+ flanges 3 mm over 0.15–0.50c) A 894 ± 2 %, Ix 126 000
   ± 2 %, k 8.04 ± 3 % — `researches/02` §2.4. Re-derived 2026-11-17 by a second route (EXPERIENCE.md EXP-0004): a raster of
   the material region at 0.05 mm gives A 511 / 890.5, Ix 63 594 / 127 109, k 6.92 / 8.21. Two methods over one geometry
   (the thin-walled sum — the recon's script and the core; the raster reuses the core's airfoil): the tolerances are their
   largest pairwise spread — A 1.55 %, Ix 1.02 %, k 2.4 % — not a fit to the code; terms below ~1 % of Ix are guarded part
   by part (the judge's findings 1–3, 2026-11-17).
10. BEM with drag: the Schmitz blade designed at each λ, C_l constant, C_d = C_l/(L/D), hub 0.1R — Cp at L/D 100 / 60 / 40
   for λ 4, 5, 6, 7, 8, 10 equals the BEM column of `researches/01` §1.6 ± 2 % (18 cells). Re-derived 2026-11-17: the core
   is 0.2–1.5 % lower, the gap growing with drag; the core's drag loss equals the analytic loss of the optimum blade
   (16/27)·λ/(L/D) within 1.25 % (guarded as its own case), the recon's is ≈ 6 % smaller — the recon script is deleted, the
   cause is not traceable, the band is the spread of the routes. With it: Sutherland's μ against the 1976 Standard
   Atmosphere (1.7894e-5 Pa·s at 15 °C, PDAS `atmos76.f90`) and recon 01 §7's Re column (27 / 44 / 62 / 89 / 133 thousand).
11. Loads of the IEC 61400-2 Simplified Load Model (class IV, ρ 1.225, the Schmitz blade λ 6, C_l 1.2, hub 0.1R): the plan
   area A_proj,B, case D (maximum thrust, F_x and M_yB = F_x·2R/(3B) at V_ave 6 and 4) and case H (parked at V_e50 42 m/s)
   equal recon 01 §7 for D 0.6 … 4.2 m to the table's rounding (re-derived 2026-11-17 through the core's Schmitz chord, every
   cell); case E (centrifugal pull) equals an external measurement — Alber et al., TORQUE 2022: 1.2 kg, CoG 0.39 m, 600 rpm
   → 1850 N ± 0.5 %. Class IV's V_ave 6 is derived (V_ave = 0.2·V_ref of the other classes; [15] has a typo, the standard's
   Table 1 is not in its free sample); it enters case D only.

## Steps

Each step quotes its anchor in the epic: «ядро расчёта … место и сдвиг ветра; БЭМ …; лопасть Шмитца …; профили …; кривая
мощности и выработка; нагрузки IEC 61400-2 …; затяжка `F₀ ≥ M/k + F_c`, выбор самой тонкой шпильки …».

- [x] **S1 · skeleton.** ✅ `node kalculator/test.mjs` runs (2026-11-16). `kalculator/index.html` with the empty core markers and `kalculator/test.mjs` that cuts the core out
  and runs it in Node — the KATAK pattern (`researches/04` §1). Check: `node kalculator/test.mjs` exits 0 with «0 of 0».
- [x] **S2 · air and wind.** ✅ criterion 1 green, 14 of 14 with the Γ / shear / Weibull identities; `--control` 4 of 4
  mutants red (2026-11-16). Recon 03 landed: criterion 7 green, 20 of 20, `--control` 6 of 6.
  `FORK: options <one log profile from the station's 10 m (recon 01) | two profiles joined at a 60 m blending height> ·
  price of error <the wrong mast spot: with one profile, trees come out windier than fields above 10 m> · consulted
  <researches/03 §3.2 (h_b 40–100 m moves the speed ±3 %)>` → two profiles, `shearTwoLayer`. ρ from altitude and temperature, log and power shear, Weibull/Rayleigh, the energy integral
  (`researches/01` §5.1). Criterion 1; criterion 7 when recon 03 lands.
- [x] **S3 · airfoil.** ✅ 2026-11-16 (the polar FORK below still open — it lands with S6/BEM per-rotor Cp): NACA half-thickness and the 44xx mean line, the smallest chord for a stud
  (criterion 4 green: 100 mm at max thickness, 103.4 mm at 0.40c), the printable trailing-edge cut; 31 of 31, `--control`
  8 of 8 (the mean-line mutant first SURVIVED — the forward branch had no interior case; one was added). Then the
  section polygon `airfoilSection` (cosine spacing, thickness normal to the mean line, the flat cut edge, origin at the
  stud axis, the twist about it): 37 of 37, `--control` 10 of 10. Then `bladeStations` — chord and twist from the
  straight-line blade, t/c 21 % → 12 % (recon 01 §2.2): 60 of 60, `--control` 20 of 20. The step as planned: NACA 4-digit camber + thickness by formula (`researches/04` §2.1), t/c(r) linear root → tip, cosine
  spacing, printable trailing edge ≥ 2 lines, the stud axis at 0.40c. Criterion 4.
  `FORK: options <analytic polar: linear C_l(α) to stall + constant C_d from the design L/D | embedded polar tables per Re> ·
  price of error <Cp off by a few % at Re < 100 k> · consulted <researches/01 §1.6–1.7, §3.3 (linearised blades measured
  better than "exact" ones)>` — start with the analytic polar; tables only if the owner asks for SG604x (licence open,
  `researches/01` §2.2).
- [x] **S4 · blade design.** ✅ 2026-11-16: `schmitzChord` / `schmitzPhi` / `schmitzTwist`, `linearBlade` (Burton, 0.7R and
  0.9R); criterion 2 green (89.36 mm, 39.466°); the Betz-limit case first used λμ 4 and went red — a wrong premise (Betz
  needs λμ ≫ 1: 4.2 % apart at 4, 0.7 % at 10), rewritten at λ 10; 42 of 42, `--control` 13 of 13. Schmitz chord and twist (`researches/01` §1.3) and their linearisation (§3.3). Criterion 2.
- [x] **S5 · BEM.** ✅ 2026-11-16: `prandtlF`, `bemStation` (bisection on (0, π/2]),
  `bemRotor`; criterion 3 green (Cp 0.5172, Ct 0.8777 after bugs/01); 47 of 47, `--control` 15 of 15. The step as planned: Ning's single-unknown φ iteration with Prandtl tip/hub loss and Buhl's high-induction correction,
  verbatim from `researches/01` §1.4–1.5. Criterion 3.
- [x] **S6 · performance.** ✅ 2026-11-16: `powerCurve` (Cp_e 0.25, cut-in 3, rated 10.5 — the recons' model, now in the
  core), `tipSpeed` (warning above 65 m/s); criterion 7 re-run through the core's curve (71.6 kWh); 51 of 51, `--control`
  17 of 17. 2026-11-17 — `FORK: options <the BEM Cp × η replaces Cp_e | Cp_e 0.25 stays the measured number; BEM gives the
  ceiling, the optimum λ, Ct and the Re warning> · price of error <BEM at L/D 40–60 gives rotor Cp 0.43–0.46, measured small
  rotors 0.25–0.35 — the user's kWh inflated by ≈ 30 %> · consulted <researches/01 §1.6 («подгонку брать как потолок
  аэродинамики, а реальный Cp — из измерений малых роторов»), §3.2 (Piggott 1.8 m, TU Delft tunnel: Cp_max 0.25–0.35)>` →
  Cp_e stays; the earlier line «a BEM-derived Cp replaces the fixed Cp_e» is withdrawn. Then BEM with drag (criterion 10),
  `airViscosity` and `designReynolds` with the «below the measured polars» flag (recon 01 §1.7, §2.1); the bisection
  trimmed 100 → 60 halvings (byte-identical suite output, the run 2.5 s → 1 s); 90 of 90, `--control` 42 of 42. The step as planned: P(V) assuming the owner's smart controller holds λ near optimum up to rated (interview 001 Q5;
  the generator itself is out of the MVP); cut-in, rated, yearly energy; v_tip warning above 60–70 m/s (§6.4).
- [x] **S7 · loads.** ✅ 2026-11-17 for the MVP — the margin policy is the owner's answer, interview #003, Q1 «A» (10:41
  +03:00): `MARGIN_POLICY` (loads ×1, stud ×1.5) and `seamCheck` (the homebuilder's verdict + the strict IEC line beside it);
  the printed root `printedBlade` (FORK in the core: the recon's root 0.18R / t/c 25 % at the root block, blended into the
  linear blade by 0.4R); the default seam through both: M5 4.8 at 2.78 kN, σ_p 4.5 MPa; strict IEC 7.8 kN, σ_max 25.1 MPa
  against 4.3; 99 of 99, `--control` 55 of 55. Case A (fatigue) stays out of the MVP with the generator (interview 001 Q4).
  Part 1 ✅ 2026-11-17: `IEC_SWT_CLASS`, `SLM`, `IEC_GAMMA`, `bladePlanArea`, `slmMaxThrust`
  (case D), `slmParked` (case H), `slmCentrifugal` (case E), `iecAllowable_MPa`; criterion 11 green, 95 of 95, `--control`
  49 of 49. Left: case A (fatigue ranges need the generator's design torque — after the MVP's generator), and the owner
  question — filed 2026-11-17 as `interviews/interview_003_blade_margin_policy.md` with the core's numbers for the default
  rotor (the «default seam» cases, 97 of 97, `--control` 50 of 50): homebuilder's margin → M5 4.8 at 2.78 kN; strict IEC →
  F0 6.8 kN, σ_max 20.9 MPa against 4.3, no printed root passes. Finding on the way: the core's linear blade gives 63 mm
  of chord at the root block (r 110 mm) — no policy holds that seam; the printed root needs its own chord (recon 02
  §0/§10: 0.18R, bed-limited) — STATUS pool, first item, for phase 2's geometry. The step as planned: IEC 61400-2 SLM cases that load the blade: A fatigue, D thrust, E max rpm (centrifugal), H parked
  (`researches/01` §6.1). Owner question before closing the step, filed in `interviews/`: strict IEC factors (no PETG root
  passes, §6.2) or a stated hobby margin.
- [x] **S8 · structure.** ✅ 2026-11-17: second part — `wallT_mm` (T(N), recon 02 §0), `bladeSection` (section A: shell
  shifted half a wall inward, flanges clipped to 0.15–0.50c under the shell, the tube with its 0.2 mm clearance, the web at
  0.60c between the inner faces; A, centroid, Ix, Iy, both kern distances, the parts), `jointStress_MPa` (σ_b, σ_p, σ_max,
  σ_min, the open seam, the long-term verdict — one limit `PETG_LONG_TERM_MPA` now serves the seam and the anchor);
  criterion 9 green, the stud-in-the-kern table at 0.40c / 0.30c, F₀ through the core's own k(A2) = 4.91 kN, the recon's
  stress table; 81 of 81, `--control` 35 of 35. Judge pass (clean instance) 2026-11-17: VERIFIED WITH CAVEATS — the spread
  text corrected, `segSq` made one definition for both thin-walled sums, the tube's and the web's Ix guarded by hand, the
  lower long-term limit given its mutant; 82 of 82, `--control` 38 of 38. Known gap: the thin-walled sum overstates A by
  1.5 % against the raster — ≈ 5 mm² from the trailing-edge zone counted twice where the two shell strips overlap, ≈ 2.6 mm²
  from strip lengths taken on the outer line instead of the midline (the judge's measurement); Iy −4 %, the offset 3.0 mm,
  not 3.4 — k comes out 1 % smaller, the conservative side. Not here yet: the flange thickness along the span (recon 02 §0: 3 mm·R/1 m at the root, none by 0.4R),
  the twisted section (properties are in the chord frame, as in the recon). First part done 2026-11-16: the stud table M3–M14 (researches/02 §4.2), `studCapacity_kN`,
  `smallestStud`, `jointPreload_N`, `wrenchTorque_Nm`; criteria 5 and 6 green; then `shellSection` — the thin-walled shell
  along the section polygon (A, centroid, flapwise I, k), exact per segment, checked on a hand-computed box; 62 of 62,
  `--control` 21 of 21. Left: flanges, the stud tube and the web added to the shell (then recon 02 §2.4 A1/A2 as a
  criterion). Then `anchorBearing` (3–7 MPa, recon 02 §5.2, an estimate) and `sectionCuts` (the fewest equal sections no
  taller than the bed — a geometry helper for phase 2): 66 of 66, `--control` 23 of 23. Planned: Thin-walled section properties (shell T(3), flanges, stud tube, web — `researches/02` §0), kern
  distance k, `F₀ ≥ M/k + F_c` (§2.3), torque `T = K·F·d` (§5.1), the smallest stud M3–M14 for the grade 4.8 · 8.8 · A2-70,
  bearing pressure of the tip anchor plate (§5.2). Criteria 5, 6.
- [ ] **S9 · control cases and markers.** Break each constant once, watch its criterion go red, restore; every core block
  carries `[NOT-TESTED]`; it flips to `[TESTED: date · how]` only on a FUNCTIONAL run of the page (TESTING_FRAMEWORK.md,
  marker rule 2 — corrected 2026-11-16 after the core judge, finding F3), never on a green criterion alone; a run report in
  `testcases/reports/`. Criterion 8.

## Risks

- Polars below Re 100 k are poorly known (`researches/01` §1.7): the core warns, it does not pretend.
- Recon 03 may move the default site numbers: criterion 7 is added then, not guessed now.
- The core grows inside one HTML file (KATAK's pattern): keep the core's functions small and named by the step they serve.
