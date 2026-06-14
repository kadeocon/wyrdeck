/** Spreads, operation nav, IRL Cheatcodes. */

export interface Spread {
  id: string;
  name: string;
  positions: string[];
}

export const SPREADS: Spread[] = [
  { id: "ppf", name: "Past · Present · Future", positions: ["Past", "Present", "Future"] },
  { id: "soa", name: "Situation · Obstacle · Advice", positions: ["Situation", "Obstacle", "Advice"] },
  { id: "mbs", name: "Mind · Body · Spirit", positions: ["Mind", "Body", "Spirit"] },
  {
    id: "celtic", name: "Celtic Cross (10 cards)",
    positions: ["Present", "Challenge", "Foundation", "Past", "Crown", "Near Future", "Self", "Environment", "Hopes & Fears", "Outcome"],
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
  { id: "ench", label: "Enchantment", phase: "Phase 1–3", tools: ["Sigil Creator + Log", "Wards & Manifestation", "Charge / Launch Ritual", "SigilChant Audio", "Theban Encoder"] },
  { id: "evo", label: "Evocation", phase: "Phase 3", tools: ["Spirit Board (Autouija)", "EVP / Noise Listener", "Servitor Builder", "Entity Grimoire"] },
  { id: "inv", label: "Invocation", phase: "Phase 2", tools: ["AI Familiar (local LLM)", "Elemental Correspondences"] },
  { id: "ill", label: "Illumination", phase: "Phase 2–3", tools: ["Binaural State Inducer", "Meditaid + Biometrics", "GlowStone Candle", "Moon & Planetary Hours", "Scrycloud Scrying"] },
  { id: "grim", label: "Grimoire", phase: "Phase 2", tools: ["Reading History", "Sigil Archive", "Notes & Interpretations", "Export / Backup"] },
];

// IRL Cheatcodes — folk numerology (Grabovoi-style sequences as circulated in
// numerology communities). Focus tools, not medicine — disclaimer in UI.
export const CHEATCODES: [string, string][] = [
  ["55515", "rapid healing"],
  ["1884321", "restoration of general health"],
  ["741", "immediate solution to a problem"],
  ["5207418", "unexpected money"],
  ["5207427", "steady income"],
  ["71427321893", "universal love"],
  ["9187948181", "confidence & self-esteem"],
];

export const DIV_TABS = [
  { id: "tarot", label: "Tarot" },
  { id: "spread", label: "Spreads" },
  { id: "coin", label: "Binary" },
  { id: "runes", label: "Runes" },
] as const;
