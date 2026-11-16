# KHAWTAK — Internal architecture map

> **The INTERNAL map: how the system thinks** — the abstractions of the calculator and how they interact. Companion:
> `PROJECT_STRUCTURE_EXTERNAL_MAP.md` (where things live). **Living reference — never DONE-tagged.**
> Status 2026-11-16: **the model below is PLANNED** — no code exists; it is the shape the recon (`researches/01`, `02`) is
> written for, and it changes when the recon or the owner's answers say otherwise.

## The core abstractions

| Abstraction | What it *is* (essence) | Responsibility |
|-------------|------------------------|----------------|
| Site | the wind where the turbine stands | mean wind at a reference height → shear to hub height (4–7 m default), Weibull/Rayleigh, air density |
| Generator | the owner's axial-flux dual-rotor alternator (≈200 mm, 24 magnets 40×20×5, 9 coils) | EMF and power vs rpm, cut-in rpm for the load voltage, losses |
| Rotor design | B = 3 blades, diameter D, design tip-speed ratio λ, airfoil | optimum chord and twist per station (Schmitz/BEM), Cp |
| Matching | the bridge Rotor ↔ Generator ↔ Site | picks D and λ so cut-in wind and rated point suit the generator and the site |
| Performance | the power curve and the year | P(V), mean power, AEP |
| Loads | what the blade must survive | IEC 61400-2 simplified load cases → root moments, centrifugal force |
| Structure | the stud(s) + the PETG shell + the joints | preload, stud stress, shell/bearing stress, safety factors |
| Blade geometry | the printable blade | airfoil sections along the span, stud channels, thickness limits |
| Sectioning | the cut of the blade into bed-sized parts | section length ≤ bed Z, joint features, glue gaps, print orientation (R8) |
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

None decided yet — the cut scheme, the internal structure (own vs slicer infill), the size classes and the generator
model wait for the recon and the owner (`MASTER_PLAN.md` → decision log).
