# Plan 03 — epic 01, phase 2: the printable blade — the section mesh, the inner structure, the joints, STL

> **Создан:** 2026-11-17 (main agent, the autonomous loop the owner ordered at 10:27 «работай автономно до закрытия чата по
> переполнению контекста») · **Родитель:** `plans/01_EPIC_mvp_blade.md` → phase table, row «2 · геометрия и секции» · **Статус:**
> 🔲 written at the close of phase 1 (plan 02); nothing built yet · **Вовне:** — (the slicer probe's preview goes to the owner's eye
> as homework when it exists)

## Goal vector

**Achieve:** from the core's printed blade (`printedBlade`, `bladeSection`, `sectionCuts`, `bedFit`) the page produces, for every
section, a closed binary STL that prints upright without supports: the outer airfoil surface, the inner cavities of section A
(shell, flanges, stud tube, web), 45° roofs that close the cells at both ends, the joint (collar + key + glue gap) and, in the tip
section, the anchor pocket — HOUSE_RULES R8: the slicer only prints. **Avoid:** an open or self-intersecting mesh; a section larger
than the bed; a cavity the slicer fills with infill; a mass that disagrees with the core's.

## Acceptance criteria (each a check `node kalculator/test.mjs` or a named tool prints)

1. Every section of the default blade (rotor 1.36 m, three sections) is a closed 2-manifold: each edge in exactly two triangles
   with opposite orientation; the signed volume is positive (normals outward). Scale: edges failing · Meter: the Node check ·
   Target: 0.
2. The mesh volume of a section without cavities equals ∫A_outer dr of its stations (divergence theorem) within 0.5 %.
3. With cavities: the material volume equals ∫A_sectionA dr (`bladeSection`'s area) within 2 % (the thin-walled sum vs the true
   offset — plan 02 criterion 9's spread) — and PETG mass = that volume × 1.25 g/cm³ equals `bladeMass` within 2 %.
4. `prusa-slicer-console.exe --info <section.stl>` reports `manifold = yes` for every section (HOUSE_RULES §3); the bounding box
   fits the 220 × 220 × 240 volume (and agrees with `bedFit`).
5. The slicer probe (recon 04 §2.3): one section sliced at 0 % infill — perimeters around every cavity, no infill inside the
   cavities; the filament mass the slicer reports is within ± 10 % of `bladeMass` (the epic's gate).
6. Two neighbouring sections meet without a step: the top outline of section i equals the bottom outline of section i+1 to 1e-6 mm
   (outside the collar).

## Steps

Each step quotes its anchor in the epic: «сечения профиля по размаху, ось крутки = ось шпильки на 0,40c; нутро (оболочка,
утолщения, трубка, перегородка, закрытые ячейки с крышей 45°); стык — буртик и шип, зазор под клей; карман закладной в вершинной
секции; корневой узел; двоичный STL».

- [ ] **G1 · the outer mesh and the STL writer.** Stations at the section cuts plus intermediate ones (the same point count per
  outline, cosine spacing — `airfoilSection`); strips of triangles between neighbouring outlines; the end caps; the binary STL of
  KATAK (80-byte header not starting with `solid`, uint32 count, 50 bytes per triangle — recon 04 §1). The checks of criteria 1, 2,
  6 land in the same step (an edge map, the divergence-theorem volume).
- [ ] **G2 · the cavities.** The cavity outline per station: the outer outline offset inward by the local wall (shell T(3), plus
  the flanges over 0.15–0.50c by `flangeAt_mm`), minus the tube ring around the stud, split by the web at 0.60c — 2D polygon
  operations without libraries (recon 04 §2.3: the main risk of the MVP mesh). FORK before coding: options <a general polygon
  offset + boolean | cavities built from the airfoil's own parametrisation (inner surface = outer point − wall × normal, the
  web as a vertical cut, the tube as its own closed cylinder)> · consulted <recon 04 §2.3, the industry's way (a clipping
  library's offset — Clipper — is the reference; the page has no libraries)>. Criterion 3.
- [ ] **G3 · the 45° roofs.** Each cell closed at both ends of the section by a roof at 45° (prints without supports, recon 02
  §7.1); a solid end band under the collar.
- [ ] **G4 · the joint.** The collar 5–8 mm on the inner contour of the top end, a 0.2 mm glue gap, one key at the rear, a 0.4 mm
  chamfer on the bottom edge (recon 02 §11 S1, §3.3) — dimensions from recon 02 §3.3 with their sources.
- [ ] **G5 · the tip anchor pocket.** A slot for the steel plate (3 × 12 × 40 mm by default) or a nut in a solid end cell of the
  tip section; the bearing check `anchorBearing` (≤ 3–7 MPa) names the plate (interview 001 Q3; recon 02 §5.2, recon 04 §2.4).
- [ ] **G6 · the slicer probe.** `prusa-slicer-console.exe --info` for every section (criterion 4); one section sliced at 0 % infill
  to G-code; the layer preview rendered to PNG (Blender or the slicer's own export — HOUSE_RULES §3) and READ by the agent;
  the filament mass against `bladeMass` (criterion 5). A run report in `testcases/reports/`. The preview goes to the owner as
  homework (the taste of the surface is his eye).
- [ ] **G7 · the root fitting.** The root block (r < 110 mm) to the 200 mm hub disc: the bolt pattern and the root nut seat —
  recon 02 §8.2 first; an owner question only if a fork outside the recon appears.

## Risks

- **High — the cavity geometry (G2):** offsetting a twisted airfoil inward near the trailing edge collapses (the edge is thinner
  than two walls): the cavity ends where the profile is thinner than 2 × shell — the TE zone stays solid (as the raster of plan 02
  criterion 9 already shows).
- **Medium — the slicer reads cavities differently** (PrusaSlicer, OrcaSlicer, Cura): the probe G6 before any full blade.
- **Low — the ZIP «stored» format** for many files is from memory (recon 04 §3, source 3 not opened) — at phase 4, not here.
