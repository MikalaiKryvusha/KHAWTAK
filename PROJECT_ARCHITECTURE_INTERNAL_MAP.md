# KHAWTAK — Internal architecture map

> **The INTERNAL map: how the system thinks** — the abstractions of the calculator and how they interact. Companion:
> `PROJECT_STRUCTURE_EXTERNAL_MAP.md` (where things live). **Living reference — never DONE-tagged.**
> Status 2026-11-17: **partly built** in `kalculator/index.html` (core only, no UI; `node kalculator/test.mjs` 81/81,
> `--control` 35/35 — hygiene, not a functional run). Where each abstraction lives in the core:
>
> | Abstraction | Core functions (plan 02 step) | State |
> |---|---|---|
> | Site | `airDensity`, `shearLog`, `shearTwoLayer`, `shearPower`, `gamma`, `weibullScale`, `weibullPdf`, `yearlyEnergy_kWh`, `SITE_DEFAULT` (S2; hub 7 m — interview 002) | built |
> | Rotor design | `nacaHalfThickness`, `nacaCamber`, `minChordForStud_mm`, `printableTrailingEdgeX`, `airfoilSection`, `schmitz*`, `linearBlade`, `bladeStations` (S3–S4) | built; the polar (FORK in plan 02) open |
> | Performance | `prandtlF`, `bemStation`, `bemRotor` (S5); `powerCurve`, `tipSpeed` (S6) | built; the power curve still uses a fixed Cp_e |
> | Loads | — (S7) | planned; an owner question first (IEC factors or a hobby margin) |
> | Structure | `STUDS`, `studCapacity_kN`, `smallestStud`, `jointPreload_N`, `wrenchTorque_Nm`, `shellSection`, `wallT_mm`, `SECTION_A`, `bladeSection`, `jointStress_MPa`, `PETG_LONG_TERM_MPA`, `anchorBearing` (S8) | built for one section in the chord frame; the flange law along the span and the twisted section — next |
> | Sectioning | `sectionCuts` | first helper; the mesh is phase 2 |
> | Blade geometry · Hub · STL writer | — | phase 2 |

## The core abstractions

| Abstraction | What it *is* (essence) | Responsibility |
|-------------|------------------------|----------------|
| Site | the wind where the turbine stands | mean wind at a reference height → shear to hub height (a mast; the owner's site in Brest region — `researches/03`), Weibull/Rayleigh, air density |
| Generator — **after the MVP** | the owner's axial-flux dual-rotor alternator (≈200 mm, 12 magnets 40×20×5 per disc, N42/N52, 9 coils) working into a smart controller | in the MVP only its size class bounds D (1.0–1.6 m); its model, the controller and the brake come later (owner, interview 001 Q4–Q6) |
| Rotor design | B = 3 blades, diameter D, design tip-speed ratio λ, airfoil | optimum chord and twist per station (Schmitz/BEM), Cp; the smart controller is assumed to hold λ near its optimum |
| Matching — **after the MVP** | the bridge Rotor ↔ Generator ↔ Site | in the MVP: a warning when D leaves the 200 mm generator's class |
| Performance | the power curve and the year | P(V), mean power, AEP |
| Loads | what the blade must survive | IEC 61400-2 simplified load cases → root moments, centrifugal force |
| Structure | the stud + the PETG shell + the joints | preload `F0 ≥ M/k + F_c`, the smallest stud M3–M14 for the user's grade, shell/bearing stress, the tip anchor's bearing, safety factors |
| Blade geometry | the printable blade | airfoil sections along the span, the stud channel at ≈0.40c, thickness limits, the tip section's anchor pocket |
| Sectioning | the cut of the blade into bed-sized parts | section length ≤ bed Z, own internal structure (shell, flanges, stud tube, web), spigot + key + glue gap, print upright (R8) |
| Hub | the ≈200 mm disc the blades and the generator bolt to | root fitting, bolt pattern, pitch setting |
| STL writer | the files the user prints | binary STL per section, manifold |

## How they interact

```
Site ──V(h)──▶ Matching ◀──P(rpm)── Generator
                  │
                  ▼
            Rotor design ──chord, twist──▶ Performance (P(V), AEP)
                  │
                  ├──▶ Loads ──▶ Structure (studs, shell, joints) ──limits──▶ Blade geometry
                  ▼                                                              │
            Blade geometry ──▶ Sectioning ──▶ STL writer ◀── Hub ◀──────────────┘
```

## Invariants & rules of the model

- The core is DOM-free (AGENT_GUIDE → Architecture); every physical constant carries its source.
- Every part leaves ready to print with its joints in the STL (HOUSE_RULES R8); the slicer only prints.
- A section never exceeds the build volume the user entered.

## Key decisions embedded in the architecture

The owner's answers to interview 001 (2026-11-16 21:35, `MASTER_PLAN.md` → decision log):

- **The stud is anchored IN the tip section and tightened at the root.** Assembly runs tip → root: the stud screws into an
  anchor inside the tip section, the other sections slide on, one nut at the hub side pulls the stack together. So the
  tip anchor (a captive nut or a tapped steel plate in a solid end cell — the kind is open, `researches/02` §5.2) carries
  preload + the centrifugal pull of everything outboard, and the root nut stays reachable for re-tightening.
- **KHAWTAK generates the internal structure** (variant A of `researches/02` §7); the slicer prints perimeters only.
- **The MVP stops at the blade and its root fitting**; Generator and Matching are bounded by the 200 mm class only.
