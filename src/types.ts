import type { Card } from "./data/tarot";
import type { Rune } from "./data/runes";
import type { DIV_TABS } from "./data/spreads";

export type Mode = (typeof DIV_TABS)[number]["id"];
export type CodexTab = "tarot" | "runes" | "codes";

export type DrawnCard = Card & { reversed: boolean; position?: string };
export type Result =
  | { kind: "cards"; cards: DrawnCard[]; spreadName?: string }
  | { kind: "coin"; yes: boolean }
  | { kind: "rune"; rune: Rune; reversed: boolean };

export interface LogEntry { t: string; mode: string; text: string }
