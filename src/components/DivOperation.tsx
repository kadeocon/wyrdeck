import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { T } from "../theme";
import { CardIcon } from "../CardIcon";
import { ChromaText } from "./Effects";
import { SpreadMap, type MapCard } from "./SpreadMap";
import { SPREADS } from "../data/spreads";
import type { Mode, DrawnCard, Result, LogEntry } from "../types";
import type { Spread } from "../data/spreads";

interface Props {
  mode: Mode;
  result: Result | null;
  currentSpread: Spread;
  log: LogEntry[];
  onSelectSpread: (id: string) => void;
}

export function DivOperation({ mode, result, currentSpread, log, onSelectSpread }: Props) {
  const [logOpen, setLogOpen] = useState(false);

  return (
    <>
      {/* Spread sub-picker */}
      {mode === "spread" && (
        <View style={d.spreadWrap}>
          <View style={d.spreadBracket}>
            <View style={d.bracketLine} />
            <Text style={d.bracketLabel}>SPREAD TYPE</Text>
            <View style={d.bracketLine} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={d.tabsRow}>
            {SPREADS.map((sp) => (
              <Pressable
                key={sp.id}
                style={[d.tab, currentSpread.id === sp.id && d.tabOn]}
                onPress={() => onSelectSpread(sp.id)}
              >
                <Text style={[d.tabTxt, currentSpread.id === sp.id && d.tabTxtOn]}>{sp.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={d.positionHint}>
            {currentSpread.positions.map((p, i) => `${i + 1}·${p}`).join("  ")}
          </Text>
        </View>
      )}

      {/* Results */}
      {result?.kind === "cards" && (
        mode === "spread" && currentSpread.grid ? (
          <SpreadMap
            cards={result.cards as MapCard[]}
            grid={currentSpread.grid}
            hint={currentSpread.info}
          />
        ) : (
          <View style={d.cards}>
            {result.spreadName && <Text style={d.spreadName}>{result.spreadName}</Text>}
            {result.cards.map((c: DrawnCard, i: number) => (
              <View key={i} style={[d.card, c.reversed && d.cardRev]}>
                {c.position && <Text style={d.pos}>{c.position.toUpperCase()}</Text>}
                <CardIcon name={c.art} size={36} color={T.yellow} strokeWidth={1.5} />
                <View style={d.titleRow}>
                  <Text style={d.chip}>{c.chip}</Text>
                  <Text style={d.cardName}>{c.name}</Text>
                </View>
                <Text style={d.arcana}>{c.arcana.toUpperCase()} · {c.element.toUpperCase()}</Text>
                {c.reversed && <Text style={d.revBadge}>⟲ REVERSED</Text>}
                <Text style={d.meaning}>{c.reversed ? c.rev : c.up}</Text>
              </View>
            ))}
          </View>
        )
      )}

      {result?.kind === "coin" && (
        <View style={d.card}>
          <ChromaText tone={result.yes ? "yes" : "no"} style={d.chroma}>
            {result.yes ? "YES" : "NO"}
          </ChromaText>
          <Text style={d.seg}>{result.yes ? "0 1" : "0 0"}</Text>
        </View>
      )}

      {result?.kind === "rune" && (
        <View style={[d.card, result.reversed && d.cardRev]}>
          <Text style={[d.bigRune, result.reversed && d.bigRuneRev]}>{result.rune.glyph}</Text>
          <Text style={d.cardName}>{result.rune.name}</Text>
          {result.reversed && <Text style={d.revBadge}>⟲ MERKSTAVE</Text>}
          <Text style={d.meaning}>{result.rune.meaning}</Text>
        </View>
      )}

      {/* Session log accordion */}
      {log.length > 0 && (
        <View style={d.log}>
          <Pressable style={d.logHeader} onPress={() => setLogOpen((o) => !o)}>
            <Text style={d.arcana}>SESSION LOG</Text>
            <ChevronDown size={13} color={T.dim} style={logOpen ? d.chevronUp : undefined} />
          </Pressable>
          {logOpen && log.map((e, i) => (
            <View key={i} style={d.logRow}>
              <Text style={d.logT}>{e.t}</Text>
              <Text style={d.logM}>{e.mode}</Text>
              <Text style={d.logTxt}>{e.text}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

const d = StyleSheet.create({
  chevronUp: { transform: [{ rotate: "180deg" }] },

  spreadWrap: { width: "100%", alignItems: "center", marginBottom: 12, gap: 10 },
  spreadBracket: { flexDirection: "row", alignItems: "center", gap: 10, width: "80%" },
  bracketLine: { flex: 1, height: 1, backgroundColor: T.red },
  bracketLabel: { color: T.red, fontSize: 9, letterSpacing: 2.5 },
  tabsRow: { gap: 6, paddingHorizontal: 4 },
  tab: { borderWidth: 1, borderColor: T.line, paddingVertical: 7, paddingHorizontal: 13, borderRadius: 2 },
  tabOn: { borderColor: T.cyan },
  tabTxt: { color: T.dim, fontSize: 11, letterSpacing: 1.5 },
  tabTxtOn: { color: T.cyan },
  positionHint: { color: T.dim, fontSize: 9, letterSpacing: 1, textAlign: "center" },

  cards: { width: "100%", alignItems: "center", gap: 12 },
  spreadName: { color: T.cyan, fontSize: 11, letterSpacing: 2 },
  card: {
    width: 250, backgroundColor: T.panel, borderWidth: 1, borderColor: T.line,
    borderTopWidth: 2, borderTopColor: T.cyan, borderRadius: 6,
    padding: 16, alignItems: "center", gap: 7, marginTop: 4,
  },
  cardRev: { borderTopColor: T.red },
  pos: { color: T.cyan, fontSize: 9, letterSpacing: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  chip: {
    color: T.cyan, borderWidth: 1, borderColor: T.cyan, borderRadius: 999,
    minWidth: 24, textAlign: "center", fontSize: 10, paddingHorizontal: 6, paddingVertical: 3,
  },
  cardName: { color: T.bone, fontSize: 16, fontWeight: "600" },
  arcana: { color: T.dim, fontSize: 8.5, letterSpacing: 2 },
  revBadge: { color: T.red, borderWidth: 1, borderColor: T.red, fontSize: 9, letterSpacing: 2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  meaning: { color: T.dim, fontSize: 12, lineHeight: 19, textAlign: "center" },
  chroma: { fontSize: 32, letterSpacing: 6, fontWeight: "700" },
  seg: { color: T.dim, fontSize: 18, letterSpacing: 4, fontVariant: ["tabular-nums"] },
  bigRune: { color: T.yellow, fontSize: 56 },
  bigRuneRev: { color: T.red, transform: [{ rotate: "180deg" }] },

  log: { width: "100%", maxWidth: 560, borderTopWidth: 1, borderTopColor: T.line, paddingTop: 10, marginTop: 16, gap: 4 },
  logHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 },
  logRow: { flexDirection: "row", gap: 10 },
  logT: { color: T.dim, fontSize: 10, minWidth: 64 },
  logM: { color: T.red, fontSize: 10, minWidth: 48 },
  logTxt: { color: T.bone, fontSize: 10.5, flex: 1 },
});
