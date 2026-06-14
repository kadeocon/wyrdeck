/**
 * Tarot data — 78-card RWS deck.
 * Icon art is referenced by *name* (lucide identifiers) so the data layer has
 * zero native deps; the UI resolves names via lucide-react-native once that
 * dependency lands. Pam-A scans replace icon art when bundled (plan §Assets).
 */

export type Suit = "Wands" | "Cups" | "Swords" | "Pentacles" | "Major";
export type Element = "Fire" | "Water" | "Air" | "Earth" | "Aether";

export interface Card {
  kind: "major" | "minor";
  chip: string;
  name: string;
  up: string;
  rev: string;
  art: string; // lucide icon name
  arcana: string;
  suit: Suit;
  element: Element;
  pips?: number; // 0 = court
  rank?: string;
  court?: string | null;
}

// [numeral, name, upright, reversed, icon]
const MAJORS: [string, string, string, string, string][] = [
  ["0", "The Fool", "beginnings, leap of faith, innocence", "recklessness, hesitation, naivety", "feather"],
  ["I", "The Magician", "will, manifestation, resourcefulness", "manipulation, untapped talent", "wand-2"],
  ["II", "The High Priestess", "intuition, the unconscious, mystery", "secrets withheld, disconnection", "moon"],
  ["III", "The Empress", "abundance, nurture, creation", "dependence, creative block", "flower"],
  ["IV", "The Emperor", "structure, authority, order", "tyranny, rigidity, loss of control", "crown"],
  ["V", "The Hierophant", "tradition, teaching, institutions", "rebellion, unconventional paths", "key"],
  ["VI", "The Lovers", "union, alignment, a true choice", "disharmony, misaligned values", "heart"],
  ["VII", "The Chariot", "drive, victory through will", "scattered force, lost direction", "rocket"],
  ["VIII", "Strength", "courage, gentle power, patience", "self-doubt, raw emotion unmastered", "dumbbell"],
  ["IX", "The Hermit", "introspection, solitary search", "isolation, withdrawal, lost path", "lamp"],
  ["X", "Wheel of Fortune", "cycles, turning point, fate", "resistance to change, bad turn", "refresh-cw"],
  ["XI", "Justice", "truth, cause and effect, fairness", "dishonesty, accountability avoided", "scale"],
  ["XII", "The Hanged One", "surrender, new perspective, pause", "stalling, needless sacrifice", "anchor"],
  ["XIII", "Death", "ending, transformation, release", "clinging, transition resisted", "skull"],
  ["XIV", "Temperance", "balance, synthesis, moderation", "excess, imbalance, friction", "flask-conical"],
  ["XV", "The Devil", "bondage, shadow, attachment", "release, reclaiming power", "link"],
  ["XVI", "The Tower", "sudden upheaval, revelation", "disaster averted, feared change", "castle"],
  ["XVII", "The Star", "hope, renewal, guidance", "despair, faith dimmed", "star"],
  ["XVIII", "The Moon", "illusion, dream, the subconscious", "confusion lifting, fear released", "moon-star"],
  ["XIX", "The Sun", "vitality, clarity, success", "clouded joy, delayed triumph", "sun"],
  ["XX", "Judgement", "awakening, reckoning, calling", "self-doubt, ignored summons", "megaphone"],
  ["XXI", "The World", "completion, integration, wholeness", "loose ends, incompletion", "globe"],
];

const SUITS: [Exclude<Suit, "Major">, Exclude<Element, "Aether">, string][] = [
  ["Wands", "Fire", "will & fire"],
  ["Cups", "Water", "emotion & water"],
  ["Swords", "Air", "intellect & air"],
  ["Pentacles", "Earth", "matter & earth"],
];

// [rank, value chip, pip count (0 = court), upright, reversed]
const RANKS: [string, string, number, string, string][] = [
  ["Ace", "A", 1, "raw potential, a seed", "false start, missed spark"],
  ["Two", "2", 2, "duality, choice, balance", "indecision, imbalance"],
  ["Three", "3", 3, "growth, collaboration", "delay, friction"],
  ["Four", "4", 4, "stability, foundation", "stagnation, restlessness"],
  ["Five", "5", 5, "conflict, loss, change", "recovery, release"],
  ["Six", "6", 6, "harmony, transition", "resistance, nostalgia"],
  ["Seven", "7", 7, "assessment, perseverance", "doubt, deception"],
  ["Eight", "8", 8, "movement, mastery", "restriction, burnout"],
  ["Nine", "9", 9, "fruition, resilience", "anxiety, excess"],
  ["Ten", "10", 10, "culmination, completion", "burden, an ending carried"],
  ["Page", "P", 0, "curiosity, a message", "immaturity, unwelcome news"],
  ["Knight", "Kn", 0, "pursuit, momentum", "recklessness, stalled quest"],
  ["Queen", "Q", 0, "inner mastery, nurture", "insecurity, smothering"],
  ["King", "K", 0, "authority, command", "rigidity, power misused"],
];

const COURTS = new Set(["Page", "Knight", "Queen", "King"]);

export const SUIT_ICON: Record<Suit, string> = {
  Wands: "wand-2", Cups: "wine", Swords: "swords", Pentacles: "coins", Major: "sparkles",
};
export const ELEMENT_ICON: Record<Element, string> = {
  Fire: "flame", Water: "droplets", Air: "wind", Earth: "mountain", Aether: "sparkles",
};
export const COURT_ICON: Record<string, string> = {
  King: "crown", Queen: "crown", Knight: "shield", Page: "scroll",
};

export const DECK: Card[] = [
  ...MAJORS.map(([numeral, name, up, rev, art]): Card => ({
    kind: "major", chip: numeral, name, up, rev, art,
    arcana: "Major Arcana", suit: "Major", element: "Aether",
  })),
  ...SUITS.flatMap(([suit, element, domain]) =>
    RANKS.map(([rank, chip, pips, up, rev]): Card => ({
      kind: "minor", chip, pips, rank,
      name: `${rank} of ${suit}`,
      up: `${up} — in the realm of ${domain}`,
      rev: `${rev} — in the realm of ${domain}`,
      arcana: `Minor Arcana · ${suit}`,
      suit, element,
      art: SUIT_ICON[suit],
      court: COURTS.has(rank) ? rank : null,
    }))
  ),
];

export const CODEX_GROUPS = [
  { title: "Major Arcana", items: DECK.slice(0, 22) },
  { title: "Wands · Fire", items: DECK.slice(22, 36) },
  { title: "Cups · Water", items: DECK.slice(36, 50) },
  { title: "Swords · Air", items: DECK.slice(50, 64) },
  { title: "Pentacles · Earth", items: DECK.slice(64, 78) },
];

// pyramid pip layouts (rows, top to bottom)
export const PIP_ROWS: Record<number, number[]> = {
  1: [1], 2: [1, 1], 3: [1, 2], 4: [1, 3], 5: [2, 3],
  6: [1, 2, 3], 7: [1, 3, 3], 8: [1, 3, 4], 9: [2, 3, 4], 10: [1, 2, 3, 4],
};
