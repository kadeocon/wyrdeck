/**
 * Technomancer's WyrDeck — Expo port.
 * Divination core + operation menu + skill-tree nav + Codex.
 */
import { useState, useRef } from "react";
import {
  View, Text, Pressable, ScrollView, StyleSheet, GestureResponderEvent, Modal,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Lock, ChevronDown, BookOpen, RotateCcw, Ban, Info, X } from "lucide-react-native";
import { T } from "./src/theme";
import { CardIcon } from "./src/CardIcon";
import { CrackleOverlay, Scanlines, ChromaText } from "./src/components/Effects";
import { secureInt, rollReversed, drawWithoutReplacement } from "./src/engine/random";
import { useEntropyPool, STIR_CAP } from "./src/engine/entropy";
import { DECK, Card, CODEX_GROUPS, SUIT_ICON, ELEMENT_ICON, COURT_ICON } from "./src/data/tarot";
import { RUNES, Rune } from "./src/data/runes";
import { SPREADS, OPS, DIV_TABS, CHEATCODES, CheatCode } from "./src/data/spreads";

// Gauge — SVG viewBox 0 0 100 100, r=46. Circle starts at 3-o'clock; we rotate
// the SVG -90deg so it starts at 12. No strokeDashoffset needed.
const GAUGE_R = 46;
const GAUGE_CIRC = 2 * Math.PI * GAUGE_R; // ≈ 289

type Mode = (typeof DIV_TABS)[number]["id"];
type CodexTab = "tarot" | "runes" | "codes";

type DrawnCard = Card & { reversed: boolean; position?: string };
type Result =
  | { kind: "cards"; cards: DrawnCard[]; spreadName?: string }
  | { kind: "coin"; yes: boolean }
  | { kind: "rune"; rune: Rune; reversed: boolean };

interface LogEntry { t: string; mode: string; text: string }

// ── Codex faces ─────────────────────────────────────────────────────────────

function CodexCardFace({ card }: { card: Card }) {
  return (
    <View style={cx.face}>
      <CardIcon name={card.art} size={26} color={T.yellow} strokeWidth={1.5} />
      <View style={cx.titleRow}>
        <Text style={cx.chip}>{card.chip}</Text>
        <Text style={cx.name}>{card.name}</Text>
      </View>
      <Text style={cx.arcana}>{card.arcana.toUpperCase()} · {card.element.toUpperCase()}</Text>
      <View style={cx.metaRow}>
        <View style={[cx.metaIcon, cx.metaSuit]}>
          <CardIcon name={SUIT_ICON[card.suit]} size={11} color={T.yellow} strokeWidth={1.5} />
        </View>
        <View style={[cx.metaIcon, cx.metaElem]}>
          <CardIcon name={ELEMENT_ICON[card.element]} size={11} color={T.cyan} strokeWidth={1.5} />
        </View>
        {card.court && (
          <View style={[cx.metaIcon, cx.metaCourt]}>
            <CardIcon name={COURT_ICON[card.court]} size={11} color={T.red} strokeWidth={1.5} />
          </View>
        )}
      </View>
      <View style={cx.bothMeanings}>
        <Text style={cx.meaningUp}><Text style={cx.labelUp}>↑ upright  </Text>{card.up}</Text>
        <Text style={cx.meaningDn}><Text style={cx.labelDn}>↓ reversed  </Text>{card.rev}</Text>
      </View>
    </View>
  );
}

function CodexRuneFace({ rune }: { rune: Rune }) {
  return (
    <View style={cx.face}>
      <Text style={cx.bigrune}>{rune.glyph}</Text>
      <Text style={cx.name}>{rune.name}</Text>
      <Text style={cx.arcana}>ELDER FUTHARK</Text>
      <Text style={cx.meaning}>{rune.meaning}</Text>
      <View style={cx.mkRow}>
        {rune.reversible
          ? <><RotateCcw size={11} color={T.cyan} /><Text style={cx.mkTxt}>reversible — merkstave form applies</Text></>
          : <><Ban size={11} color={T.dim} /><Text style={[cx.mkTxt, { color: T.dim }]}>non-reversible</Text></>
        }
      </View>
    </View>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function App() {
  const [op, setOp] = useState("div");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("tarot");
  const [spreadId, setSpreadId] = useState("ppf");
  const [result, setResult] = useState<Result | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [charge, setCharge] = useState(0);
  const [infoVisible, setInfoVisible] = useState(false);
  // Codex
  const [codexTab, setCodexTab] = useState<CodexTab>("tarot");
  const [openEntry, setOpenEntry] = useState<string | null>(null);
  const [cheatSel, setCheatSel] = useState<CheatCode | null>(null);

  const { mix, drain, stirs } = useEntropyPool();
  const lastStir = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const currentOp = OPS.find((o) => o.id === op)!;
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
      setResult({ kind: "cards", cards: [{ ...card, reversed }] });
      addLog("Tarot", `${card.name}${reversed ? " (rev)" : ""}`);
    } else if (mode === "spread") {
      const spread = currentSpread;
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

  const gaugeStroke = (GAUGE_CIRC * Math.min(charge, 100)) / 100;
  const drawLabel = mode === "coin" ? "TOSS" : "DRAW";

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <CrackleOverlay />
      <Scanlines />

      {/* ── Info modal ── */}
      <Modal visible={infoVisible} transparent animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <Pressable style={s.modalBackdrop} onPress={() => setInfoVisible(false)}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>RITUAL ENTROPY</Text>
              <Pressable onPress={() => setInfoVisible(false)}>
                <X size={16} color={T.dim} />
              </Pressable>
            </View>
            <Text style={s.modalBody}>
              Stir the ring to feed entropy into the pool (FNV-1a hash), XOR-mixed with the
              OS CSPRNG at draw time.{"\n\n"}
              Charging is optional — randomness is never weaker without it. The ritual act
              of stirring layers your body's micro-tremors into the seed.
            </Text>
          </View>
        </Pressable>
      </Modal>

      {/* ── Fixed header — never scrolls ── */}
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
                  onPress={() => { setOp(o.id); setMenuOpen(false); setResult(null); setOpenEntry(null); }}
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

        {/* Ring — only shown in divination */}
        {op === "div" && (
          <View style={s.ringRow}>
            {/* Left spacer keeps ring centered */}
            <View style={s.ringRowSide} />

            <View style={s.ringWrap}>
              {/* Stir capture — returns true immediately, blocking ScrollView */}
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
              {/* Visual ring */}
              <View style={s.ring} pointerEvents="none">
                <Text style={s.chargeTxt}>{charge}%</Text>
                <Text style={s.hint}>stir to charge</Text>
              </View>
              {/* Charge gauge — no strokeDashoffset; rotation alone positions start at 12 */}
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
              {/* Draw button — sibling of stir layer */}
              <Pressable style={({ pressed }) => [s.draw, pressed && s.drawPressed]} onPress={draw}>
                <Text style={s.drawTxt}>{drawLabel}</Text>
              </Pressable>
            </View>

            {/* Info button — right side, bottom-aligned */}
            <View style={s.ringRowSide}>
              <Pressable style={s.infoBtn} onPress={() => setInfoVisible(true)}>
                <Info size={16} color={T.dim} />
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>

        {/* Divination scrollable content */}
        {op === "div" && (
          <>
            {/* Spread sub-picker — red bracket style */}
            {mode === "spread" && (
              <View style={s.spreadWrap}>
                <View style={s.spreadBracket}>
                  <View style={s.bracketLine} />
                  <Text style={s.bracketLabel}>SPREAD TYPE</Text>
                  <View style={s.bracketLine} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
                  {SPREADS.map((sp) => (
                    <Pressable key={sp.id}
                      style={[s.tab, spreadId === sp.id && s.tabOn]}
                      onPress={() => setSpreadId(sp.id)}>
                      <Text style={[s.tabTxt, spreadId === sp.id && s.tabTxtOn]}>{sp.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={s.positionHint}>
                  {currentSpread.positions.map((p, i) => `${i + 1}·${p}`).join("  ")}
                </Text>
              </View>
            )}

            {/* Results */}
            {result?.kind === "cards" && (
              <View style={s.cards}>
                {result.spreadName && <Text style={s.spreadName}>{result.spreadName}</Text>}
                {result.cards.map((c, i) => (
                  <View key={i} style={[s.card, c.reversed && s.cardRev]}>
                    {c.position && <Text style={s.pos}>{c.position.toUpperCase()}</Text>}
                    <CardIcon name={c.art} size={36} color={T.yellow} strokeWidth={1.5} />
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
                <ChromaText tone={result.yes ? "yes" : "no"} style={s.chroma}>
                  {result.yes ? "YES" : "NO"}
                </ChromaText>
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

            {/* Session log accordion */}
            {log.length > 0 && (
              <View style={s.log}>
                <Pressable style={s.logHeader} onPress={() => setLogOpen((o) => !o)}>
                  <Text style={s.arcana}>SESSION LOG</Text>
                  <ChevronDown size={13} color={T.dim} style={logOpen ? s.chevronUp : undefined} />
                </Pressable>
                {logOpen && log.map((e, i) => (
                  <View key={i} style={s.logRow}>
                    <Text style={s.logT}>{e.t}</Text>
                    <Text style={s.logM}>{e.mode}</Text>
                    <Text style={s.logTxt}>{e.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Codex */}
        {op === "codex" && (
          <View style={s.codex}>
            {codexTab === "codes" && (
              <>
                <View style={s.codePanel}>
                  <Text style={s.arcana}>SELECTED CODE</Text>
                  <Text style={s.bigCode}>{cheatSel ? cheatSel.code : "·····"}</Text>
                  {cheatSel && <Text style={s.codeMeaning}>{cheatSel.meaning}</Text>}
                  <Text style={s.howTo}>
                    Hold your intent, gaze at the sequence, and repeat it silently — or write it,
                    trace it, or visualize each digit glowing.{"\n"}
                    Folk numerology (Grabovoi-style) — focus tool, not medicine.
                  </Text>
                </View>
                {CHEATCODES.map((cat) => (
                  <View key={cat.title} style={s.codexGroup}>
                    <Text style={s.codexGroupTitle}>{cat.title.toUpperCase()}</Text>
                    <View style={s.codexGrid}>
                      {cat.codes.map((cc) => (
                        <Pressable
                          key={cc.code}
                          style={[s.codeEntry, cheatSel?.code === cc.code && s.codeEntryOn]}
                          onPress={() => setCheatSel(cc)}
                        >
                          <Text style={s.codeNum}>{cc.code}</Text>
                          <Text style={s.codeMeaningSmall}>{cc.meaning}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
              </>
            )}

            {codexTab === "tarot" && CODEX_GROUPS.map((g) => (
              <View key={g.title} style={s.codexGroup}>
                <Text style={s.codexGroupTitle}>{g.title.toUpperCase()}</Text>
                <View style={s.codexGrid}>
                  {g.items.map((c) => {
                    const open = openEntry === c.name;
                    return (
                      <Pressable
                        key={c.name}
                        style={[s.entry, open && s.entryOpen]}
                        onPress={() => setOpenEntry(open ? null : c.name)}
                      >
                        {open ? (
                          <CodexCardFace card={c} />
                        ) : (
                          <>
                            <Text style={s.entryChip}>{c.chip}</Text>
                            <Text style={s.entryName}>{c.name}</Text>
                            <CardIcon name={SUIT_ICON[c.suit]} size={13} color={T.cyan} strokeWidth={1.5} />
                          </>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

            {codexTab === "runes" && (
              <View style={s.codexGrid}>
                {RUNES.map((rune) => {
                  const open = openEntry === rune.name;
                  return (
                    <Pressable
                      key={rune.name}
                      style={[s.entry, open && s.entryOpen]}
                      onPress={() => setOpenEntry(open ? null : rune.name)}
                    >
                      {open ? (
                        <CodexRuneFace rune={rune} />
                      ) : (
                        <>
                          <Text style={s.runeGlyph}>{rune.glyph}</Text>
                          <Text style={s.entryName}>{rune.name}</Text>
                          {rune.reversible
                            ? <RotateCcw size={13} color={T.cyan} />
                            : <Ban size={13} color={T.dim} />
                          }
                        </>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.void },

  // ── Layout ──
  header: { alignItems: "center", paddingTop: 40, paddingHorizontal: 20, zIndex: 50, overflow: "visible" },
  body: { flex: 1 },
  bodyContent: { alignItems: "center", padding: 20, paddingTop: 16, paddingBottom: 48 },

  // ── Top matter ──
  eyebrow: { color: T.dim, fontSize: 9, letterSpacing: 2, marginBottom: 6, width: "100%", textAlign: "center" },
  super: { color: T.dim, fontSize: 11, letterSpacing: 6 },
  title: { color: T.cyan, fontSize: 38, fontWeight: "700", letterSpacing: 8, marginBottom: 14 },

  // ── Operation menu ──
  menuWrap: { alignSelf: "center", marginBottom: 6, minWidth: 200, maxWidth: 320, width: "80%", zIndex: 50 },
  menuBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: T.panel, borderWidth: 1, borderColor: T.cyan,
    paddingVertical: 10, paddingHorizontal: 18,
  },
  menuBtnTxt: { color: T.cyan, fontSize: 12, letterSpacing: 2, flex: 1, textAlign: "center" },
  chevronUp: { transform: [{ rotate: "180deg" }] },
  menuDropdown: {
    backgroundColor: T.void, borderWidth: 1, borderColor: T.cyan, borderTopWidth: 0, zIndex: 50,
  },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 9, paddingHorizontal: 12 },
  menuItemOn: { backgroundColor: T.panel },
  menuItemTxt: { color: T.dim, fontSize: 11, letterSpacing: 1.5, flex: 1 },
  menuItemTxtOn: { color: T.cyan },
  phaseTxt: { color: T.red, fontSize: 9, letterSpacing: 1 },

  // ── Skill tree ──
  skillTree: { alignItems: "center", width: "100%", marginBottom: 10 },
  trunk: { width: 1, height: 12, backgroundColor: T.red },
  // paddingTop: 0 so stems connect flush to the horizontal bar
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

  // ── Ring row (ring centered, info button right) ──
  ringRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 6, marginBottom: 10 },
  ringRowSide: { width: 40, alignItems: "center", justifyContent: "flex-end", paddingBottom: 12 },
  infoBtn: { padding: 6 },

  // ── Stir ring ──
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

  // ── Info modal ──
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "center" },
  modalCard: {
    width: "82%", maxWidth: 360, backgroundColor: T.panel,
    borderWidth: 1, borderColor: T.cyan, borderRadius: 6, padding: 20, gap: 12,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { color: T.cyan, fontSize: 11, letterSpacing: 3 },
  modalBody: { color: T.dim, fontSize: 12, lineHeight: 19 },

  // ── Spread sub-picker ──
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

  // ── Cards / results ──
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

  // ── Session log ──
  log: { width: "100%", maxWidth: 560, borderTopWidth: 1, borderTopColor: T.line, paddingTop: 10, marginTop: 16, gap: 4 },
  logHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 },
  logRow: { flexDirection: "row", gap: 10 },
  logT: { color: T.dim, fontSize: 10, minWidth: 64 },
  logM: { color: T.red, fontSize: 10, minWidth: 48 },
  logTxt: { color: T.bone, fontSize: 10.5, flex: 1 },

  // ── Codex ──
  codex: { width: "100%", maxWidth: 600, gap: 14, alignItems: "center" },
  codexGroup: { width: "100%" },
  codexGroupTitle: { color: T.yellow, fontSize: 9, letterSpacing: 2.5, marginBottom: 8, marginTop: 4 },
  codexGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7, justifyContent: "center", width: "100%" },

  // Tarot / Rune entries (half-width, horizontal layout)
  entry: {
    backgroundColor: T.panel, borderWidth: 1, borderColor: T.line, borderRadius: 4,
    padding: 9, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 7,
    width: "47%",
  },
  entryOn: { borderColor: T.cyan },
  entryOpen: { width: "100%", padding: 0, borderColor: T.yellow, flexDirection: "column" },
  entryChip: {
    color: T.cyan, borderWidth: 1, borderColor: T.cyan, borderRadius: 999,
    minWidth: 22, textAlign: "center", fontSize: 9, paddingHorizontal: 5, paddingVertical: 2,
  },
  entryName: { color: T.bone, fontSize: 11.5, flex: 1 },
  runeGlyph: { color: T.yellow, fontSize: 18 },

  // Cheatcode entries — stacked (number above meaning), one-third width
  codeEntry: {
    backgroundColor: T.panel, borderWidth: 1, borderColor: T.line, borderRadius: 4,
    padding: 10, flexDirection: "column", alignItems: "center", gap: 4,
    width: "30%",
  },
  codeEntryOn: { borderColor: T.cyan, backgroundColor: "rgba(5,240,255,0.06)" },
  codeNum: { color: T.yellow, fontSize: 13, letterSpacing: 1.5, textAlign: "center" },
  codeMeaningSmall: { color: T.dim, fontSize: 10, textAlign: "center", lineHeight: 14 },

  // Cheatcode selected panel
  codePanel: {
    width: "100%", backgroundColor: T.panel, borderWidth: 1, borderColor: T.line,
    borderTopWidth: 2, borderTopColor: T.yellow, borderRadius: 6,
    padding: 16, alignItems: "center", gap: 8,
  },
  bigCode: {
    color: T.bone, fontSize: 30, letterSpacing: 5,
    textShadowColor: T.cyan, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14,
  },
  codeMeaning: { color: T.yellow, fontSize: 12, letterSpacing: 1.5 },
  howTo: { color: T.dim, fontSize: 10, lineHeight: 16, textAlign: "center", maxWidth: 360 },
});

// ── Codex face styles ────────────────────────────────────────────────────────

const cx = StyleSheet.create({
  face: { padding: 14, alignItems: "center", gap: 6, width: "100%" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap", justifyContent: "center" },
  chip: {
    color: T.cyan, borderWidth: 1, borderColor: T.cyan, borderRadius: 999,
    minWidth: 22, textAlign: "center", fontSize: 9, paddingHorizontal: 5, paddingVertical: 2,
  },
  name: { color: T.bone, fontSize: 14, fontWeight: "600" },
  arcana: { color: T.dim, fontSize: 8, letterSpacing: 2 },
  metaRow: { flexDirection: "row", gap: 5 },
  metaIcon: { padding: 3, borderWidth: 1, borderRadius: 3 },
  metaSuit: { borderColor: T.line },
  metaElem: { borderColor: T.line },
  metaCourt: { borderColor: T.line },
  bothMeanings: { gap: 5, width: "100%" },
  meaningUp: { color: T.dim, fontSize: 11, lineHeight: 17 },
  meaningDn: { color: T.dim, fontSize: 11, lineHeight: 17 },
  labelUp: { color: T.cyan, fontWeight: "600" },
  labelDn: { color: T.red, fontWeight: "600" },
  bigrune: { color: T.yellow, fontSize: 44 },
  meaning: { color: T.dim, fontSize: 12, lineHeight: 18, textAlign: "center" },
  mkRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  mkTxt: { color: T.cyan, fontSize: 10, letterSpacing: 0.5 },
});
