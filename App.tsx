import { useState, useRef } from "react";
import {
  View, Text, Pressable, ScrollView, StyleSheet, GestureResponderEvent,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { Lock, ChevronDown, BookOpen } from "lucide-react-native";
import { InfoButton, InfoCard, ip } from "./src/components/InfoPopout";
import { T } from "./src/theme";
import { CrackleOverlay, Scanlines, ChromaText } from "./src/components/Effects";
import { DivOperation } from "./src/components/DivOperation";
import { CodexOperation } from "./src/components/CodexOperation";
import { GrimoireOperation } from "./src/components/GrimoireOperation";
import { secureInt, rollReversed, drawWithoutReplacement } from "./src/engine/random";
import { useEntropyPool, STIR_CAP } from "./src/engine/entropy";
import { DECK } from "./src/data/tarot";
import { RUNES } from "./src/data/runes";
import { SPREADS, OPS, DIV_TABS } from "./src/data/spreads";
import { migrateDb, saveReading } from "./src/db/grimoire";
import type { CheatCode } from "./src/data/spreads";
import type { Mode, CodexTab, DrawnCard, Result, LogEntry } from "./src/types";

const GAUGE_R    = 46;
const GAUGE_CIRC = 2 * Math.PI * GAUGE_R;

// ── Root: SQLiteProvider shell ───────────────────────────────────────────────

export default function App() {
  return (
    <SQLiteProvider databaseName="grimoire.db" onInit={migrateDb}>
      <AppContent />
    </SQLiteProvider>
  );
}

// ── AppContent: all app state + UI ───────────────────────────────────────────

function AppContent() {
  const db = useSQLiteContext();

  // ── Operation / nav state ──
  const [op,       setOp]       = useState("div");
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Divination state ──
  const [mode,     setMode]     = useState<Mode>("tarot");
  const [spreadId, setSpreadId] = useState("ppf");
  const [result,   setResult]   = useState<Result | null>(null);
  const [log,      setLog]      = useState<LogEntry[]>([]);
  const [charge,   setCharge]   = useState(0);
  const [infoVisible, setInfoVisible] = useState(false);

  // ── Codex state ──
  const [codexTab,  setCodexTab]  = useState<CodexTab>("tarot");
  const [openEntry, setOpenEntry] = useState<string | null>(null);
  const [cheatSel,  setCheatSel]  = useState<CheatCode | null>(null);

  const { mix, drain, stirs } = useEntropyPool();
  const lastStir   = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const currentOp     = OPS.find((o) => o.id === op)!;
  const currentSpread = SPREADS.find((s) => s.id === spreadId)!;

  const onStir = (e: GestureResponderEvent) => {
    const now = Date.now();
    if (now - lastStir.current < 16) return;
    lastStir.current = now;
    const { pageX, pageY } = e.nativeEvent;
    mix(Math.round(pageX * 7), Math.round(pageY * 13));
    setCharge(Math.round((stirs.current / STIR_CAP) * 100));
  };

  const addLog = (m: string, text: string) =>
    setLog((l) => [{ t: new Date().toLocaleTimeString(), mode: m, text }, ...l].slice(0, 30));

  const draw = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const entropy = drain();
    setCharge(0);

    if (mode === "tarot") {
      const card = DECK[secureInt(DECK.length, entropy)];
      const reversed = rollReversed(entropy);
      const newResult: Result = { kind: "cards", cards: [{ ...card, reversed }] };
      setResult(newResult);
      addLog("Tarot", `${card.name}${reversed ? " (rev)" : ""}`);
      saveReading(db, "tarot", newResult);

    } else if (mode === "spread") {
      const picks = drawWithoutReplacement(DECK.length, currentSpread.positions.length, entropy);
      const cards = picks.map((i, k): DrawnCard => ({
        ...DECK[i], reversed: rollReversed(entropy ^ (k + 1)), position: currentSpread.positions[k],
      }));
      const newResult: Result = { kind: "cards", cards, spreadName: currentSpread.name };
      setResult(newResult);
      addLog("Spread", `${currentSpread.name}: ${cards.map((c) => c.name).join(" · ")}`);
      saveReading(db, "spread", newResult, currentSpread.name);

    } else if (mode === "coin") {
      const yes = secureInt(2, entropy) === 0;
      const newResult: Result = { kind: "coin", yes };
      setResult(newResult);
      addLog("Binary", yes ? "01 · YES" : "00 · NO");
      saveReading(db, "coin", newResult);

    } else {
      const rune = RUNES[secureInt(RUNES.length, entropy)];
      const reversed = rune.reversible && rollReversed(entropy);
      const newResult: Result = { kind: "rune", rune, reversed };
      setResult(newResult);
      addLog("Rune", `${rune.name}${reversed ? " (merkstave)" : ""}`);
      saveReading(db, "rune", newResult);
    }
  };

  const gaugeStroke = (GAUGE_CIRC * Math.min(charge, 100)) / 100;
  const drawLabel   = mode === "coin" ? "TOSS" : "DRAW";

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <CrackleOverlay />
      <Scanlines />

      {/* ── Fixed header ── */}
      <View style={s.header}>
        <Text style={s.eyebrow} numberOfLines={1} adjustsFontSizeToFit>
          ORACLE ENGINE · EXPO PORT · CSPRNG + RITUAL ENTROPY
        </Text>
        <Text style={s.super}>TECHNOMANCER'S</Text>
        <ChromaText tone="bone" style={s.title}>WYRDECK</ChromaText>

        {/* Operation menu */}
        <View style={s.menuWrap}>
          <Pressable style={s.menuBtn} onPress={() => setMenuOpen((o) => !o)}>
            {!currentOp.open && <Lock size={11} color={T.cyan} />}
            <Text style={s.menuBtnTxt}>{currentOp.label.toUpperCase()}</Text>
            <ChevronDown size={13} color={T.cyan} style={menuOpen ? s.chevronUp : undefined} />
          </Pressable>
          {menuOpen && (
            <View style={s.menuDropdown}>
              {OPS.map((o) => (
                <Pressable
                  key={o.id}
                  style={[s.menuItem, op === o.id && s.menuItemOn]}
                  onPress={() => {
                    setOp(o.id); setMenuOpen(false); setResult(null); setOpenEntry(null);
                  }}
                >
                  {o.open
                    ? <BookOpen size={11} color={op === o.id ? T.cyan : T.dim} />
                    : <Lock size={11} color={T.dim} />
                  }
                  <Text style={[s.menuItemTxt, op === o.id && s.menuItemTxtOn]}>
                    {o.label.toUpperCase()}
                  </Text>
                  {!o.open && <Text style={s.phaseTxt}>{o.phase}</Text>}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Skill tree */}
        <View style={s.skillTree}>
          <View style={s.trunk} />
          {op === "div" ? (
            <View style={s.branchRow}>
              <View style={s.branchBar} />
              {DIV_TABS.map((tb) => (
                <View key={tb.id} style={s.branchItem}>
                  <View style={s.branchStem} />
                  <Pressable
                    style={[s.branchBtn, mode === tb.id && s.branchBtnOn]}
                    onPress={() => { setMode(tb.id); setResult(null); }}
                  >
                    <Text style={[s.branchTxt, mode === tb.id && s.branchTxtOn]}>{tb.label}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : op === "codex" ? (
            <View style={s.branchRow}>
              <View style={s.branchBar} />
              {(["tarot", "runes", "codes"] as CodexTab[]).map((tab) => {
                const label = tab === "tarot" ? "Tarot" : tab === "runes" ? "Runes" : "Cheatcodes";
                return (
                  <View key={tab} style={s.branchItem}>
                    <View style={s.branchStem} />
                    <Pressable
                      style={[s.branchBtn, codexTab === tab && s.branchBtnOn]}
                      onPress={() => { setCodexTab(tab); setOpenEntry(null); setCheatSel(null); }}
                    >
                      <Text style={[s.branchTxt, codexTab === tab && s.branchTxtOn]}>{label}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : op === "grim" ? (
            <View style={s.branchRow}>
              <View style={s.branchBar} />
              <View style={s.branchItem}>
                <View style={s.branchStem} />
                <View style={[s.branchBtn, s.branchBtnOn]}>
                  <Text style={[s.branchTxt, s.branchTxtOn]}>Readings</Text>
                </View>
              </View>
            </View>
          ) : (
            <>
              <View style={s.branchRow}>
                <View style={s.branchBar} />
                {currentOp.tools?.map((t) => (
                  <View key={t} style={s.branchItem}>
                    <View style={s.branchStem} />
                    <View style={s.branchLocked}>
                      <Lock size={10} color={T.dim} />
                      <Text style={s.branchLockedTxt}>{t}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <Text style={s.lockNote}>{currentOp.phase} · not yet wired</Text>
            </>
          )}
        </View>

        {/* Ring — divination only */}
        {op === "div" && (
          <>
            <View style={s.ringRow}>
              <View style={s.ringRowSide} />
              <View style={s.ringWrap}>
                <View
                  style={[StyleSheet.absoluteFill, s.ringStir]}
                  onStartShouldSetResponder={(e) => {
                    touchStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
                    return true;
                  }}
                  onResponderMove={onStir}
                  onResponderRelease={() => { touchStart.current = null; }}
                  onResponderTerminate={() => { touchStart.current = null; }}
                />
                <View style={s.ring} pointerEvents="none">
                  <Text style={s.chargeTxt}>{Math.min(charge, 100)}%</Text>
                  {charge < 100 && <Text style={s.hint}>stir to charge</Text>}
                </View>
                <View style={s.gauge} pointerEvents="none">
                  <Svg width={256} height={256} viewBox="0 0 100 100" style={s.gaugeSvg}>
                    <Circle cx={50} cy={50} r={GAUGE_R} fill="none" stroke={T.line} strokeWidth={1.5} />
                    {charge > 0 && (
                      <Circle
                        cx={50} cy={50} r={GAUGE_R}
                        fill="none" stroke={T.cyan} strokeWidth={2} strokeLinecap="round"
                        strokeDasharray={`${gaugeStroke} ${GAUGE_CIRC}`}
                      />
                    )}
                  </Svg>
                </View>
                <Pressable style={({ pressed }) => [s.draw, pressed && s.drawPressed]} onPress={draw}>
                  <Text style={s.drawTxt}>{drawLabel}</Text>
                </Pressable>
              </View>
              <View style={s.ringRowSide}>
                <InfoButton
                  open={infoVisible}
                  onToggle={() => setInfoVisible((o) => !o)}
                  label="About ritual entropy"
                />
              </View>
            </View>
            {infoVisible && (
              <InfoCard title="RITUAL ENTROPY">
                <Text style={ip.body}>
                  Stir the ring to feed entropy into the pool (FNV-1a hash), XOR-mixed
                  with the OS CSPRNG at draw time.{"\n\n"}
                  Charging is optional — randomness is never weaker without it. The ritual
                  act of stirring layers your body's micro-tremors into the seed.
                </Text>
              </InfoCard>
            )}
          </>
        )}
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>
        {op === "div" && (
          <DivOperation
            mode={mode}
            result={result}
            currentSpread={currentSpread}
            log={log}
            onSelectSpread={(id) => { setSpreadId(id); setResult(null); }}
          />
        )}
        {op === "codex" && (
          <CodexOperation
            codexTab={codexTab}
            openEntry={openEntry}
            setOpenEntry={setOpenEntry}
            cheatSel={cheatSel}
            setCheatSel={setCheatSel}
          />
        )}
        {op === "grim" && <GrimoireOperation />}
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.void },

  header: { alignItems: "center", paddingTop: 40, paddingBottom: 10, paddingHorizontal: 20, zIndex: 50, overflow: "visible" },
  body: { flex: 1 },
  bodyContent: { alignItems: "center", padding: 20, paddingTop: 16, paddingBottom: 48 },

  eyebrow: { color: T.dim, fontSize: 9, letterSpacing: 2, marginBottom: 6, width: "100%", textAlign: "center" },
  super: { color: T.dim, fontSize: 11, letterSpacing: 6 },
  title: { color: T.cyan, fontSize: 38, fontWeight: "700", letterSpacing: 8, marginBottom: 14 },

  menuWrap: { alignSelf: "center", marginBottom: 6, minWidth: 200, maxWidth: 320, width: "80%", zIndex: 50 },
  menuBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: T.panel, borderWidth: 1, borderColor: T.cyan,
    paddingVertical: 10, paddingHorizontal: 18,
  },
  menuBtnTxt: { color: T.cyan, fontSize: 12, letterSpacing: 2, flex: 1, textAlign: "center" },
  chevronUp: { transform: [{ rotate: "180deg" }] },
  menuDropdown: { backgroundColor: T.void, borderWidth: 1, borderColor: T.cyan, borderTopWidth: 0, zIndex: 50 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 9, paddingHorizontal: 12 },
  menuItemOn: { backgroundColor: T.panel },
  menuItemTxt: { color: T.dim, fontSize: 11, letterSpacing: 1.5, flex: 1 },
  menuItemTxtOn: { color: T.cyan },
  phaseTxt: { color: T.red, fontSize: 9, letterSpacing: 1 },

  skillTree: { alignItems: "center", width: "100%", marginBottom: 10 },
  trunk: { width: 1, height: 12, backgroundColor: T.red },
  branchRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", paddingTop: 0, width: "100%" },
  branchBar: { position: "absolute", top: 0, left: "8%", right: "8%", height: 1, backgroundColor: T.red },
  branchItem: { alignItems: "center", marginHorizontal: 5, marginBottom: 6 },
  branchStem: { width: 1, height: 10, backgroundColor: T.red },
  branchBtn: { borderWidth: 1, borderColor: T.line, borderRadius: 2, paddingVertical: 7, paddingHorizontal: 13 },
  branchBtnOn: { borderColor: T.yellow },
  branchTxt: { color: T.dim, fontSize: 11, letterSpacing: 1.5 },
  branchTxtOn: { color: T.yellow },
  branchLocked: {
    borderWidth: 1, borderColor: "rgba(255,42,95,0.4)", borderStyle: "dashed",
    borderRadius: 2, paddingVertical: 6, paddingHorizontal: 8,
    flexDirection: "row", alignItems: "center", gap: 5, opacity: 0.7,
  },
  branchLockedTxt: { color: T.dim, fontSize: 10 },
  lockNote: { color: T.red, fontSize: 10, letterSpacing: 2, marginTop: 8 },

  ringRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 6, marginBottom: 6 },
  ringRowSide: { width: 40, alignItems: "center", justifyContent: "flex-end", paddingBottom: 12 },
  ringWrap: { width: 240, height: 240, alignItems: "center", justifyContent: "center" },
  ringStir: { borderRadius: 120 },
  ring: {
    width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: T.line,
    backgroundColor: T.panel, alignItems: "center", justifyContent: "center", position: "absolute",
  },
  chargeTxt: { color: T.cyan, fontSize: 12, position: "absolute", top: 28 },
  hint: { color: T.dim, fontSize: 9, letterSpacing: 2, position: "absolute", top: 46 },
  gauge: { position: "absolute", width: 256, height: 256, alignItems: "center", justifyContent: "center" },
  gaugeSvg: { transform: [{ rotate: "-90deg" }] },
  draw: {
    width: 92, height: 92, borderRadius: 46, borderWidth: 1, borderColor: T.yellow,
    backgroundColor: T.void, alignItems: "center", justifyContent: "center",
  },
  drawPressed: {
    backgroundColor: "rgba(255,233,74,0.12)",
    shadowColor: T.yellow, shadowOpacity: 0.8, shadowRadius: 16, shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  drawTxt: { color: T.yellow, fontSize: 14, letterSpacing: 3 },
});
