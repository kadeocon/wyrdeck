import { View, Text, Pressable, StyleSheet } from "react-native";
import { RotateCcw, Ban } from "lucide-react-native";
import { T } from "../theme";
import { CardIcon } from "../CardIcon";
import { CODEX_GROUPS, SUIT_ICON, ELEMENT_ICON, COURT_ICON, type Card } from "../data/tarot";
import { RUNES, type Rune } from "../data/runes";
import { CHEATCODES, type CheatCode } from "../data/spreads";
import type { CodexTab } from "../types";

// ── Expanded card face ───────────────────────────────────────────────────────

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

// ── Expanded rune face ───────────────────────────────────────────────────────

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

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  codexTab: CodexTab;
  openEntry: string | null;
  setOpenEntry: (s: string | null) => void;
  cheatSel: CheatCode | null;
  setCheatSel: (c: CheatCode | null) => void;
}

export function CodexOperation({ codexTab, openEntry, setOpenEntry, cheatSel, setCheatSel }: Props) {
  return (
    <View style={co.codex}>
      {/* Cheatcodes */}
      {codexTab === "codes" && (
        <>
          <View style={co.codePanel}>
            <Text style={co.arcana}>SELECTED CODE</Text>
            <Text style={co.bigCode}>{cheatSel ? cheatSel.code : "·····"}</Text>
            {cheatSel && <Text style={co.codeMeaning}>{cheatSel.meaning}</Text>}
            <Text style={co.howTo}>
              Hold your intent, gaze at the sequence, and repeat it silently — or write it,
              trace it, or visualize each digit glowing.{"\n"}
              Folk numerology (Grabovoi-style) — focus tool, not medicine.
            </Text>
          </View>
          {CHEATCODES.map((cat) => (
            <View key={cat.title} style={co.group}>
              <Text style={co.groupTitle}>{cat.title.toUpperCase()}</Text>
              <View style={co.grid}>
                {cat.codes.map((cc) => (
                  <Pressable
                    key={cc.code}
                    style={[co.codeEntry, cheatSel?.code === cc.code && co.codeEntryOn]}
                    onPress={() => setCheatSel(cc)}
                  >
                    <Text style={co.codeNum}>{cc.code}</Text>
                    <Text style={co.codeMeaningSmall}>{cc.meaning}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </>
      )}

      {/* Tarot guide */}
      {codexTab === "tarot" && CODEX_GROUPS.map((g) => (
        <View key={g.title} style={co.group}>
          <Text style={co.groupTitle}>{g.title.toUpperCase()}</Text>
          <View style={co.grid}>
            {g.items.map((c) => {
              const open = openEntry === c.name;
              return (
                <Pressable
                  key={c.name}
                  style={[co.entry, open && co.entryOpen]}
                  onPress={() => setOpenEntry(open ? null : c.name)}
                >
                  {open ? (
                    <CodexCardFace card={c} />
                  ) : (
                    <>
                      <Text style={co.entryChip}>{c.chip}</Text>
                      <Text style={co.entryName}>{c.name}</Text>
                      <CardIcon name={SUIT_ICON[c.suit]} size={13} color={T.cyan} strokeWidth={1.5} />
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {/* Rune guide */}
      {codexTab === "runes" && (
        <View style={co.grid}>
          {RUNES.map((rune) => {
            const open = openEntry === rune.name;
            return (
              <Pressable
                key={rune.name}
                style={[co.entry, open && co.entryOpen]}
                onPress={() => setOpenEntry(open ? null : rune.name)}
              >
                {open ? (
                  <CodexRuneFace rune={rune} />
                ) : (
                  <>
                    <Text style={co.runeGlyph}>{rune.glyph}</Text>
                    <Text style={co.entryName}>{rune.name}</Text>
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
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const co = StyleSheet.create({
  codex: { width: "100%", maxWidth: 600, gap: 14, alignItems: "center" },
  group: { width: "100%" },
  groupTitle: { color: T.yellow, fontSize: 9, letterSpacing: 2.5, marginBottom: 8, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 7, justifyContent: "center", width: "100%" },
  arcana: { color: T.dim, fontSize: 8.5, letterSpacing: 2 },

  entry: {
    backgroundColor: T.panel, borderWidth: 1, borderColor: T.line, borderRadius: 4,
    padding: 9, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 7,
    width: "47%",
  },
  entryOpen: { width: "100%", padding: 0, borderColor: T.yellow, flexDirection: "column" },
  entryChip: {
    color: T.cyan, borderWidth: 1, borderColor: T.cyan, borderRadius: 999,
    minWidth: 22, textAlign: "center", fontSize: 9, paddingHorizontal: 5, paddingVertical: 2,
  },
  entryName: { color: T.bone, fontSize: 11.5, flex: 1 },
  runeGlyph: { color: T.yellow, fontSize: 18 },

  codeEntry: {
    backgroundColor: T.panel, borderWidth: 1, borderColor: T.line, borderRadius: 4,
    padding: 10, flexDirection: "column", alignItems: "center", gap: 4,
    width: "30%",
  },
  codeEntryOn: { borderColor: T.cyan, backgroundColor: "rgba(5,240,255,0.06)" },
  codeNum: { color: T.yellow, fontSize: 13, letterSpacing: 1.5, textAlign: "center" },
  codeMeaningSmall: { color: T.dim, fontSize: 10, textAlign: "center", lineHeight: 14 },

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
