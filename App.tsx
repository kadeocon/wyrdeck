/**
 * Technomancer's WyrDeck — Expo port, step 1.
 * Working divination core: single tarot pull, spreads (incl. Celtic Cross),
 * binary, runes. CSPRNG + ritual touch-stir entropy, 30% reversals.
 * Visual layer is deliberately minimal — crackle/scanlines/chroma effects,
 * lucide icon art, codex, and sigil creator port next.
 */
import { useState, useRef } from "react";
import {
  View, Text, Pressable, ScrollView, StyleSheet, GestureResponderEvent,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { T } from "./src/theme";
import { secureInt, rollReversed, drawWithoutReplacement } from "./src/engine/random";
import { useEntropyPool, STIR_CAP } from "./src/engine/entropy";
import { DECK, Card } from "./src/data/tarot";
import { RUNES, Rune } from "./src/data/runes";
import { SPREADS, DIV_TABS } from "./src/data/spreads";

type Mode = (typeof DIV_TABS)[number]["id"];

type DrawnCard = Card & { reversed: boolean; position?: string };
type Result =
  | { kind: "cards"; cards: DrawnCard[]; spreadName?: string }
  | { kind: "coin"; yes: boolean }
  | { kind: "rune"; rune: Rune; reversed: boolean };

interface LogEntry { t: string; mode: string; text: string }

export default function App() {
  const [mode, setMode] = useState<Mode>("tarot");
  const [spreadId, setSpreadId] = useState("ppf");
  const [result, setResult] = useState<Result | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [charge, setCharge] = useState(0);
  const { mix, drain, stirs } = useEntropyPool();
  const lastStir = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onStir = (e: GestureResponderEvent) => {
    const now = Date.now();
    if (now - lastStir.current < 16) return; // throttle to ~60Hz
    lastStir.current = now;
    const { pageX, pageY } = e.nativeEvent;
    mix(Math.round(pageX * 7), Math.round(pageY * 13));
    setCharge(Math.round((stirs.current / STIR_CAP) * 100));
  };

  const addLog = (mode: string, text: string) =>
    setLog((l) => [{ t: new Date().toLocaleTimeString(), mode, text }, ...l].slice(0, 30));

  const draw = () => {
    const entropy = drain();
    setCharge(0);
    if (mode === "tarot") {
      const card = DECK[secureInt(DECK.length, entropy)];
      const reversed = rollReversed(entropy);
      setResult({ kind: "cards", cards: [{ ...card, reversed }] });
      addLog("Tarot", `${card.name}${reversed ? " (rev)" : ""}`);
    } else if (mode === "spread") {
      const spread = SPREADS.find((s) => s.id === spreadId)!;
      const picks = drawWithoutReplacement(DECK.length, spread.positions.length, entropy);
      const cards = picks.map((i, k): DrawnCard => ({
        ...DECK[i], reversed: rollReversed(entropy), position: spread.positions[k],
      }));
      setResult({ kind: "cards", cards, spreadName: spread.name });
      addLog("Spread", `${spread.name}: ${cards.map((c) => c.name).join(" · ")}`);
    } else if (mode === "coin") {
      const yes = secureInt(2, entropy) === 0;
      setResult({ kind: "coin", yes });
      addLog("Binary", yes ? "01 · YES" : "00 · NO");
    } else {
      const rune = RUNES[secureInt(RUNES.length, entropy)];
      const reversed = rune.reversible && rollReversed(entropy);
      setResult({ kind: "rune", rune, reversed });
      addLog("Rune", `${rune.name}${reversed ? " (merkstave)" : ""}`);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.eyebrow}>ORACLE ENGINE · EXPO PORT · CSPRNG + RITUAL ENTROPY</Text>
        <Text style={s.super}>TECHNOMANCER'S</Text>
        <Text style={s.title}>WYRDECK</Text>

        <View style={s.tabs}>
          {DIV_TABS.map((tb) => (
            <Pressable key={tb.id}
              style={[s.tab, mode === tb.id && s.tabOn]}
              onPress={() => { setMode(tb.id); setResult(null); }}>
              <Text style={[s.tabTxt, mode === tb.id && s.tabTxtOn]}>{tb.label}</Text>
            </Pressable>
          ))}
        </View>

        {mode === "spread" && (
          <View style={s.tabs}>
            {SPREADS.map((sp) => (
              <Pressable key={sp.id}
                style={[s.tab, spreadId === sp.id && s.tabOn]}
                onPress={() => setSpreadId(sp.id)}>
                <Text style={[s.tabTxt, spreadId === sp.id && s.tabTxtOn]}>{sp.name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View
          style={s.ring}
          onStartShouldSetResponder={(e) => {
            touchStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
            return false;
          }}
          onMoveShouldSetResponder={(e) => {
            if (!touchStart.current) return false;
            const dx = e.nativeEvent.pageX - touchStart.current.x;
            const dy = e.nativeEvent.pageY - touchStart.current.y;
            return Math.hypot(dx, dy) > 8;
          }}
          onResponderMove={onStir}
        >
          <Text style={s.chargeTxt}>{charge}%</Text>
          <Text style={s.hint}>stir to charge</Text>
          <Pressable style={s.draw} onPress={draw}>
            <Text style={s.drawTxt}>DRAW</Text>
          </Pressable>
        </View>
        <Text style={s.hintWide}>
          Stir the ring to feed ritual entropy into the pool (FNV-1a), XOR-mixed with the
          OS CSPRNG at draw time. Charging is optional — randomness is never weaker without it.
        </Text>

        {result?.kind === "cards" && (
          <View style={s.cards}>
            {result.spreadName && <Text style={s.spreadName}>{result.spreadName}</Text>}
            {result.cards.map((c, i) => (
              <View key={i} style={[s.card, c.reversed && s.cardRev]}>
                {c.position && <Text style={s.pos}>{c.position.toUpperCase()}</Text>}
                <View style={s.titleRow}>
                  <Text style={s.chip}>{c.chip}</Text>
                  <Text style={s.cardName}>{c.name}</Text>
                </View>
                <Text style={s.arcana}>{c.arcana.toUpperCase()} · {c.element.toUpperCase()}</Text>
                {c.reversed && <Text style={s.revBadge}>⟲ REVERSED</Text>}
                <Text style={s.meaning}>{c.reversed ? c.rev : c.up}</Text>
              </View>
            ))}
          </View>
        )}

        {result?.kind === "coin" && (
          <View style={s.card}>
            <Text style={[s.chroma, { color: result.yes ? T.cyan : T.red }]}>
              {result.yes ? "YES" : "NO"}
            </Text>
            <Text style={s.seg}>{result.yes ? "0 1" : "0 0"}</Text>
          </View>
        )}

        {result?.kind === "rune" && (
          <View style={[s.card, result.reversed && s.cardRev]}>
            <Text style={[s.bigRune, result.reversed && s.bigRuneRev]}>{result.rune.glyph}</Text>
            <Text style={s.cardName}>{result.rune.name}</Text>
            {result.reversed && <Text style={s.revBadge}>⟲ MERKSTAVE</Text>}
            <Text style={s.meaning}>{result.rune.meaning}</Text>
          </View>
        )}

        {log.length > 0 && (
          <View style={s.log}>
            <Text style={s.arcana}>SESSION LOG</Text>
            {log.map((e, i) => (
              <View key={i} style={s.logRow}>
                <Text style={s.logT}>{e.t}</Text>
                <Text style={s.logM}>{e.mode}</Text>
                <Text style={s.logTxt}>{e.text}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.void },
  scroll: { alignItems: "center", padding: 20, paddingTop: 64, paddingBottom: 48 },
  eyebrow: { color: T.dim, fontSize: 9, letterSpacing: 3, marginBottom: 10 },
  super: { color: T.dim, fontSize: 11, letterSpacing: 6 },
  title: { color: T.cyan, fontSize: 38, fontWeight: "700", letterSpacing: 8, marginBottom: 18 },
  tabs: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginBottom: 14 },
  tab: { borderWidth: 1, borderColor: T.line, paddingVertical: 7, paddingHorizontal: 13, borderRadius: 2 },
  tabOn: { borderColor: T.cyan },
  tabTxt: { color: T.dim, fontSize: 11, letterSpacing: 1.5 },
  tabTxtOn: { color: T.cyan },
  ring: {
    width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: T.line,
    backgroundColor: T.panel, alignItems: "center", justifyContent: "center", marginTop: 8,
  },
  chargeTxt: { color: T.cyan, fontSize: 12, position: "absolute", top: 28 },
  hint: { color: T.dim, fontSize: 9, letterSpacing: 2, position: "absolute", top: 46 },
  draw: {
    width: 92, height: 92, borderRadius: 46, borderWidth: 1, borderColor: T.yellow,
    backgroundColor: T.void, alignItems: "center", justifyContent: "center",
  },
  drawTxt: { color: T.yellow, fontSize: 14, letterSpacing: 3 },
  hintWide: { color: T.dim, fontSize: 10, lineHeight: 17, textAlign: "center", maxWidth: 340, marginTop: 12, marginBottom: 8 },
  cards: { width: "100%", alignItems: "center", gap: 12, marginTop: 12 },
  spreadName: { color: T.cyan, fontSize: 11, letterSpacing: 2 },
  card: {
    width: 250, backgroundColor: T.panel, borderWidth: 1, borderColor: T.line,
    borderTopWidth: 2, borderTopColor: T.cyan, borderRadius: 6,
    padding: 16, alignItems: "center", gap: 7, marginTop: 12,
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
  log: { width: "100%", maxWidth: 560, borderTopWidth: 1, borderTopColor: T.line, paddingTop: 14, marginTop: 22, gap: 5 },
  logRow: { flexDirection: "row", gap: 10 },
  logT: { color: T.dim, fontSize: 10, minWidth: 64 },
  logM: { color: T.red, fontSize: 10, minWidth: 48 },
  logTxt: { color: T.bone, fontSize: 10.5, flex: 1 },
});
