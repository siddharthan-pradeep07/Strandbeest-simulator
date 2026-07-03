# Strandbeest Leg Simulator

<p align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://hackatime.hackclub.com/api/v1/badge/U092G90G5FS/siddharthan-pradeep07/Strandbeest-simulator" alt="Hackatime Badge"/>
</p>

---

### A simulation software to simulate a strandbeest, large kinetic sculptures made by dutch artist - theo jansen

Simulate walking movement of a strandbeest, change lengths (bars), add legs, chaneg speed and view data.

## What it does

It simulates a **Strandbeest's leg/s, walking movement** — the same kind used in Theo Jansen's Strandbeest sculptures with reference to the 13 holy numbers.

The canvas shows the full linkage animating in real time. Every joint is solved frame-by-frame using circle-circle intersection geometry.

## Features

- **Live linkage solver** — all 13 bar lengths are editable. Change the values of each bar in the controls panel, and click save.
- **Mirror leg** — a horizontally mirrored / duplicated version of the innitial leg.
- **Multi-leg mode** — select 1–4 legs. Extra legs are phase-offset equally around the crank circle (180°, 120°, 90°).
- **Per-leg color picker** — each leg gets its own color, applied to both the main and mirrored copy.
- **Play / pause** — play / pause simulation.
- **Speed control** — (slider).
- **Joint labels** — labels all points (joints) on each leg
- **data panel** — displays ground angle and ground distance
- **Foot trace** — the full path of the foot (joint h) is drawn every frame.

## Controls

| Control | Where |
|---|---|
| bar lengths (A–C to M–N) | right panel --> Controls (Measurements) |
| save / revert | inside the measurements panel |
| play / pause | right panel --> top |
| speed | below the preview panel |
| mirror leg | top left corner [CHECK BOX] |
| label joints | below mirror leg [CHECK BOX]|
| Number of legs | right panel, below the play / pause button [DROP DOWN] |
| data | above the play / pause button |

## Quick files

- `src/App.jsx` — main app, all logic + code are contained inside this.
- `src/App.jsx → solve_leg()` — leg movement logic
- `src/App.jsx → solve_leg_mirror()` — mirrored varient of leg movement `inter_mirror()`
- `src/App.jsx → draw_scene()` — canvas drawings: bars, joints, traces, labels etc...
- `src/App.jsx → make_transform()` — auto-fit + rotate the scene to canvas
- `src/App.jsx → PreviewCanvas` — the animated canvas component, " ref" based state

## maths!

Each frame, `solve_leg(theta, lengths)` places the crank pin at `(m·cos θ, m·sin θ)` and resolves the rest of the linkage through a chain of circle–circle intersections (`inter()`). The intersection root is chosen by cross-product sign to always pick the same branch of the solution.

The mirror version uses `inter_mirror()` which picks the opposite root, producing the fliped version of the mechanism.

-----

#### Made with love.

please give it a ⭐

**Siddharthan Pradeep** — [GitHub](https://github.com/siddharthan-pradeep07) · [siddharthansp07@gmail.com](mailto:siddharthansp07@gmail.com)

-----