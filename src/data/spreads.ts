/** Spreads, operation nav, Grabovoi cheatcodes. */

/**
 * One cell in a spread's positional grid, in reading/draw order.
 * col/row are 1-indexed. The column scheme for a cross+staff layout is:
 *   cols 1-3 = cross   col 4 = 8px spacer (skip)   col 5 = staff
 * Adding a new spread: supply positions[] + grid[] — nothing in the
 * renderer needs to change.
 */
export interface GridCell {
  col: number;
  row: number;
  center?: boolean; // card 1 — the "present" centre of the cross
  cross?: boolean;  // card 2 — same cell, rotated 90°
}

export interface Spread {
  id: string;
  name: string;
  positions: string[];
  /** When present, renders a SpreadMap instead of a stacked column. */
  grid?: GridCell[];
  /** Short reading guide shown in the SpreadMap info popout. */
  info?: string;
}

export const SPREADS: Spread[] = [
  { id: "ppf", name: "Past · Present · Future", positions: ["Past", "Present", "Future"] },
  { id: "soa", name: "Situation · Obstacle · Advice", positions: ["Situation", "Obstacle", "Advice"] },
  { id: "mbs", name: "Mind · Body · Spirit", positions: ["Mind", "Body", "Spirit"] },
  {
    id: "celtic", name: "Celtic Cross (10 cards)",
    positions: [
      "Present", "Challenge", "Foundation", "Recent Past",
      "Crown / Goal", "Near Future", "The Self", "Environment",
      "Hopes & Fears", "Outcome",
    ],
    grid: [
      { col: 2, row: 2, center: true }, // 1  Present
      { col: 2, row: 2, cross: true  }, // 2  Challenge  (lies across card 1)
      { col: 2, row: 3              }, // 3  Foundation
      { col: 1, row: 2              }, // 4  Recent Past
      { col: 2, row: 1              }, // 5  Crown / Goal
      { col: 3, row: 2              }, // 6  Near Future
      { col: 5, row: 4              }, // 7  The Self
      { col: 5, row: 3              }, // 8  Environment
      { col: 5, row: 2              }, // 9  Hopes & Fears
      { col: 5, row: 1              }, // 10 Outcome
    ],
    info: "The cross (1–6) maps the situation; the staff (7–10) maps where it's heading.\n\nCard 2 lies across card 1 — the heart of the matter and what crosses it.\n\nFollow the red line in number order. Tap any card for its full meaning.",
  },
  // ── Extensibility smoke-test: Horseshoe (7 cards, arc layout) ──────────────
  // Demonstrates that adding a new grid spread requires only data — zero
  // renderer edits. Remove or keep; the SpreadMap handles it automatically.
  {
    id: "horseshoe", name: "Horseshoe (7 cards)",
    positions: [
      "Past", "Present", "Hidden influences", "Obstacles",
      "External influences", "Advice", "Outcome",
    ],
    grid: [
      { col: 1, row: 3 }, // 1  Past
      { col: 1, row: 2 }, // 2  Present
      { col: 1, row: 1 }, // 3  Hidden influences
      { col: 2, row: 1 }, // 4  Obstacles
      { col: 3, row: 1 }, // 5  External influences
      { col: 3, row: 2 }, // 6  Advice
      { col: 3, row: 3 }, // 7  Outcome
    ],
    info: "The horseshoe reads in a U-shaped arc from left to right.\n\nLeft column (1–3): where you've come from and what's hidden. Top row (4–5): the obstacle and outside forces at play. Right column (6–7): guidance and likely outcome.\n\nFollow the red line in number order. Tap any card for its full meaning.",
  },
];

export interface Operation {
  id: string;
  label: string;
  open?: boolean;
  phase?: string;
  tools?: string[];
}

export const OPS: Operation[] = [
  { id: "div", label: "Divination", open: true },
  { id: "codex", label: "Codex", open: true },
  { id: "ench", label: "Enchantment", phase: "Phase 1–3", tools: ["Sigil Creator + Log", "Wards & Manifestation", "Charge / Launch Ritual", "SigilChant Audio", "Theban Encoder"] },
  { id: "evo", label: "Evocation", phase: "Phase 3", tools: ["Spirit Board (Autouija)", "EVP / Noise Listener", "Servitor Builder", "Entity Grimoire"] },
  { id: "inv", label: "Invocation", phase: "Phase 2", tools: ["AI Familiar (local LLM)", "Elemental Correspondences"] },
  { id: "ill", label: "Illumination", phase: "Phase 2–3", tools: ["Binaural State Inducer", "Meditaid + Biometrics", "GlowStone Candle", "Moon & Planetary Hours", "Scrycloud Scrying"] },
  { id: "grim", label: "Grimoire", open: true },
];

export interface CheatCode { code: string; meaning: string }
export interface CheatCategory { title: string; codes: CheatCode[] }

// Grabovoi-style folk numerology sequences (circulated as focus/meditation tools — not medicine).
export const CHEATCODES: CheatCategory[] = [
  {
    title: "Financial",
    codes: [
      { code: "5207418", meaning: "unexpected money" },
      { code: "9213140", meaning: "steady income" },
      { code: "318612518714", meaning: "abundant cash flow" },
      { code: "71974131981", meaning: "entrepreneurship" },
      { code: "964986583", meaning: "money knowledge" },
      { code: "87467894", meaning: "money confidence" },
      { code: "218494517601", meaning: "get a job fast" },
      { code: "4931518641491", meaning: "manifest dream job" },
    ],
  },
  {
    title: "Health",
    codes: [
      { code: "80845700", meaning: "good health" },
      { code: "9187948181", meaning: "healing of the body" },
      { code: "848741", meaning: "whole body regeneration" },
      { code: "741", meaning: "immediate solution" },
      { code: "1121495", meaning: "insomnia" },
      { code: "2937853", meaning: "improved vision" },
      { code: "8363957", meaning: "hormonal balance" },
      { code: "8121596", meaning: "muscle strength & flexibility" },
    ],
  },
  {
    title: "Mental & Emotional",
    codes: [
      { code: "4532246", meaning: "gain confidence" },
      { code: "2567993", meaning: "positive outlook" },
      { code: "4588623", meaning: "focus" },
      { code: "2963586", meaning: "depression relief" },
      { code: "2536933", meaning: "anxiety relief" },
      { code: "4258735", meaning: "release fear" },
      { code: "6682121", meaning: "release anger" },
      { code: "2539579", meaning: "bipolar balance" },
    ],
  },
  {
    title: "Relationships",
    codes: [
      { code: "8884121289018", meaning: "manifest love" },
      { code: "396815", meaning: "self-love" },
      { code: "197023", meaning: "attract a partner" },
      { code: "401543512", meaning: "manifest romance" },
      { code: "8277237", meaning: "fame" },
      { code: "5514809", meaning: "spiritual protection" },
    ],
  },
  {
    title: "Manifestation",
    codes: [
      { code: "813791", meaning: "ideal future" },
      { code: "817219738", meaning: "good luck" },
      { code: "1001105010", meaning: "peace" },
      { code: "3542888", meaning: "willpower" },
      { code: "5186923", meaning: "grounding" },
      { code: "39119488061", meaning: "understanding" },
      { code: "823494781572954", meaning: "activate true potential" },
      { code: "4748132148", meaning: "cancel negativity" },
    ],
  },
];

export const DIV_TABS = [
  { id: "tarot", label: "Tarot" },
  { id: "spread", label: "Spreads" },
  { id: "coin", label: "Binary" },
  { id: "runes", label: "Runes" },
] as const;
