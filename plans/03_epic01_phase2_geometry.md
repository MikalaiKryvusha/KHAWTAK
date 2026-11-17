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

- [x] **G1 · the outer mesh and the STL writer.** ✅ 2026-11-17 15:29 +03:00 — `meshClosed`, `meshVolume`, `meshBounds`, `airfoilCap` (a
  ladder of rungs upper(i)–lower(i), never folds), `MESH_DEFAULT` (n 60, dz ≤ 5 mm, the trailing edge ≥ T(2) [AI]),
  `sectionMesh`, `meshToSTL`. The default blade: three sections of 9 434 triangles, closed (criterion 1), the volume against
  ∫A dz 0.004–0.014 % (criterion 2), the seams 0 mm apart (criterion 6), the caps CCW, the STL read back; 7 cases, 11 mutants
  each red; 115/115, `--control` 75/75. Criterion 4 already on the outer mesh: `node tools/slicer-check.mjs` — PrusaSlicer
  `manifold = yes`, one part, the same facet count, no repair (any `facets_reversed`, `edges_fixed`… fails it — the fifth
  judge; proven on a copy with one reversed facet), its volume = the core's (210 748.0 mm³), 190 mm high; the bed fit
  89 × 89 mm is the core's `bedFit`, which the tool prints beside the slicer's box. Chrome = Node byte for byte
  (`node tools/chrome-core-smoke.mjs`: the STL hash). Seen by eye — the command: `"C:/Program Files/Blender Foundation/Blender
  5.3/blender.exe" -b -P <KATAK>/tools/render-stl.py -- .work/tmp/slicer-check/section1-r110-300.stl <png> iso`: the twisted
  root, the kink of the linear root blend at 0.4R (`printedBlade`'s [AI] choice, cosmetic). After the fifth judge: a case ties
  the mesh to the blade (both ends = `airfoilSection` at the cut radius, twist included) with a mutant, and the trailing edge
  is measured on the mesh's own vertices. The step as planned: Stations at the section cuts plus intermediate ones (the same point count per
  outline, cosine spacing — `airfoilSection`); strips of triangles between neighbouring outlines; the end caps; the binary STL of
  KATAK (80-byte header not starting with `solid`, uint32 count, 50 bytes per triangle — recon 04 §1). The checks of criteria 1, 2,
  6 land in the same step (an edge map, the divergence-theorem volume).
- [ ] **G2 · the cavities.** The cavity outline per station: the outer outline offset inward by the local wall (shell T(3), plus
  the flanges over 0.15–0.50c by `flangeAt_mm`), minus the tube ring around the stud, split by the web at 0.60c — 2D polygon
  operations without libraries (recon 04 §2.3: the main risk of the MVP mesh). FORK before coding: options <a general polygon
  offset + boolean | cavities built from the airfoil's own parametrisation (inner surface = outer point − wall × normal, the
  web as a vertical cut, the tube as its own closed cylinder)> · consulted <recon 04 §2.3, the industry's way (a clipping
  library's offset — Clipper — is the reference; the page has no libraries)>. Criterion 3.
  **The two FORKs, closed by recon 2026-11-17 15:34 +03:00 (recon 04 §2.3 gains the notes):**
  `FORK: options <a general polygon offset + boolean (Clipper's way) | the inner contour from the airfoil's own stations (inner
  point = outer point − wall × normal at the same chord stations, trimmed where the inner upper and lower chains cross)> ·
  price of error <a cavity whose outline changes its point count between stations cannot be lofted into a closed mesh | an
  offset loop at a sharp nose> · consulted <the blade-structure tools (NuMAD, PreComp: the inner contour = the outer shape
  offset by the layup thickness, webs as separate members); Clipper2 (Vatti 1992; Chen & McMains 2005 on offsetting) — the
  general tool the slicers use, but its output re-meshes every station; recon 04 §2.2 (the same point count per station)>` →
  the airfoil's own stations: the loft needs the same point count; the nose loop lies where the profile is thinner than two
  shells, so the trim removes it (at the default tip, c 27.6 mm, the nose radius 0.44 mm < T(3), but the profile is < 2 × T(3)
  thick there anyway).
  `FORK: options <the tube free inside the front cell (recon 02 §0 section A as computed) | the web moved from 0.60c to the
  stud axis 0.40c, the tube inside the web | a second web through the tube> · price of error <a free tube 7 × 190 mm printed
  upright wobbles (forum practice: tall thin rods are braced at 1/3 and 2/3 of their height); a cell with a hole breaks the
  loft where the tube meets the shell (from r ≈ 285 mm on the default blade) | the recon's numbers move | one more entity> ·
  consulted <recon 02 §0/§7 (the web «≈ 0,60–0,65c» is its [AI] choice, no reason given; the tube's attachment not named);
  FDM practice on tall thin features (Bambu Lab forum «layer wobble for tall and skinny parts»: bracing); the I-beam spar
  of blade practice (the web joins the caps; our flanges span 0.15–0.50c, so 0.40c is inside them)>` → the web through the
  stud axis: no new entity, the tube braced top and bottom, two cells without holes, and where the tube meets the shell the
  web's height simply goes to 0. `bladeSection` follows (the web interrupted by the tube); plan 02 criterion 9 keeps the
  recon's section A by passing `xWeb: 0.60` explicitly. [AI] — the owner sees it in the step's report.
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
- **High — the tip anchor does not fit where the 333 mm stud ends (G5; found 2026-11-17 while G1 was built).** On the core's
  printed blade (rotor 1.36 m, λ 6, Cl 1.2) the profile at the stud axis (0.40c) is 12.8 mm thick — what an M5 nut needs (recon 02
  §4.5: the hex corner + 2 × T(3) + 2 × 0.5 mm) — only up to r 237 mm (0.349R); a stud from the root nut (r 35 mm) reaching it is
  202 mm. The owner's 333 mm stud (332 after the saw cut) ends at r 367 mm, where the profile is 7.56 mm thick: the M5 tube still
  fits (Ø 7.11 mm, up to r 394 mm), a nut or a tapped strip does not. Recon 02 §10 put the class-333 nut at r/R 0.52 on ITS planform
  (§0: chord 85.8 mm, 12.35 mm thick there); the core's linear blade is 47.9 mm, 7.78 mm thick at the same radius. Recon 02 §4.7's
  recommendation [AI] «the stud ends where the nut fits + a carbon rod beyond» would clamp only the first section — against the
  owner's scheme (interview 001 Q3: the stud screws into the TIP section and pulls the whole stack). A fork of the owner's level:
  the interview before G5; G1–G4 do not wait on it. The default seam's numbers (`bladeMass` with studLen 0.332 m) move with the
  answer. Numbers: `node tools/stud-fit.mjs` (kept, EXP-0006/0008).
- **Note for G2:** along the stud's run the tube nearly fills the profile at its end (7.56 mm thick at r 367 mm against the tube's
  7.11 mm): the cavity builder meets a tube that merges with the shell — a case, not an exception.
- **Medium — the slicer reads cavities differently** (PrusaSlicer, OrcaSlicer, Cura): the probe G6 before any full blade.
- **Low — the ZIP «stored» format** for many files is from memory (recon 04 §3, source 3 not opened) — at phase 4, not here.
