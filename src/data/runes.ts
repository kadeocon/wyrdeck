/** Elder Futhark — merkstave (reversed) only where traditional. */

export interface Rune {
  name: string;
  glyph: string;
  meaning: string;
  reversible: boolean;
}

const R = (name: string, glyph: string, meaning: string, reversible: boolean): Rune =>
  ({ name, glyph, meaning, reversible });

export const RUNES: Rune[] = [
  R("Fehu", "ᚠ", "wealth, abundance, reward", true),
  R("Uruz", "ᚢ", "strength, vitality, the wild", true),
  R("Thurisaz", "ᚦ", "threshold, conflict, the thorn", true),
  R("Ansuz", "ᚨ", "signal, wisdom, the word", true),
  R("Raidho", "ᚱ", "journey, rhythm, right action", true),
  R("Kenaz", "ᚲ", "torch, knowledge, revelation", true),
  R("Gebo", "ᚷ", "gift, exchange, partnership", false),
  R("Wunjo", "ᚹ", "joy, fellowship, harmony", true),
  R("Hagalaz", "ᚺ", "disruption, hail, wild forces", false),
  R("Nauthiz", "ᚾ", "need, constraint, endurance", true),
  R("Isa", "ᛁ", "stillness, ice, a pause", false),
  R("Jera", "ᛃ", "harvest, cycles, due season", false),
  R("Eihwaz", "ᛇ", "endurance, the world-tree, defense", false),
  R("Perthro", "ᛈ", "fate, mystery, the dice cup", true),
  R("Algiz", "ᛉ", "protection, sanctuary, higher self", true),
  R("Sowilo", "ᛊ", "sun, success, wholeness", false),
  R("Tiwaz", "ᛏ", "justice, victory, sacrifice", true),
  R("Berkano", "ᛒ", "birth, growth, becoming", true),
  R("Ehwaz", "ᛖ", "trust, movement, partnership", true),
  R("Mannaz", "ᛗ", "the self, humanity, mind", true),
  R("Laguz", "ᛚ", "flow, water, intuition", true),
  R("Ingwaz", "ᛜ", "gestation, stored potential", false),
  R("Dagaz", "ᛞ", "dawn, breakthrough, awakening", false),
  R("Othala", "ᛟ", "heritage, home, inheritance", true),
];

export const GLYPHS = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ";
