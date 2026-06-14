/** Spreads, operation nav, Grabovoi cheatcodes. */

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
  { id: "codex", label: "Codex", open: true },
  { id: "ench", label: "Enchantment", phase: "Phase 1–3", tools: ["Sigil Creator + Log", "Wards & Manifestation", "Charge / Launch Ritual", "SigilChant Audio", "Theban Encoder"] },
  { id: "evo", label: "Evocation", phase: "Phase 3", tools: ["Spirit Board (Autouija)", "EVP / Noise Listener", "Servitor Builder", "Entity Grimoire"] },
  { id: "inv", label: "Invocation", phase: "Phase 2", tools: ["AI Familiar (local LLM)", "Elemental Correspondences"] },
  { id: "ill", label: "Illumination", phase: "Phase 2–3", tools: ["Binaural State Inducer", "Meditaid + Biometrics", "GlowStone Candle", "Moon & Planetary Hours", "Scrycloud Scrying"] },
  { id: "grim", label: "Grimoire", phase: "Phase 2", tools: ["Reading History", "Sigil Archive", "Notes & Interpretations", "Export / Backup"] },
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
      { code: "493151864​1491", meaning: "manifest dream job" },
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
      { code: "51869​23", meaning: "grounding" },
      { code: "39119488061", meaning: "understanding" },
      { code: "82349478​1572954", meaning: "activate true potential" },
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
