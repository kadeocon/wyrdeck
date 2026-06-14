import { useEffect, useState, useCallback } from "react";
import {
  View, Text, Pressable, TextInput, StyleSheet, Alert,
} from "react-native";
import { Trash2, ChevronDown, RotateCcw } from "lucide-react-native";
import { useSQLiteContext } from "expo-sqlite";
import { T } from "../theme";
import {
  getReadings, updateNote, deleteReading,
  type GrimoireReading,
} from "../db/grimoire";
import type { Result, DrawnCard } from "../types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    + " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function modeLabel(mode: string): string {
  return ({ tarot: "TAROT", spread: "SPREAD", coin: "BINARY", rune: "RUNE" }[mode] ?? mode.toUpperCase());
}

function modeColor(mode: string): string {
  return ({ tarot: T.cyan, spread: T.yellow, coin: T.dim, rune: T.red }[mode] ?? T.dim);
}

function parsedResult(reading: GrimoireReading): Result | null {
  try { return JSON.parse(reading.cards_json) as Result; }
  catch { return null; }
}

function summary(reading: GrimoireReading): string {
  const r = parsedResult(reading);
  if (!r) return "—";
  if (r.kind === "coin") return r.yes ? "YES" : "NO";
  if (r.kind === "rune") return r.rune.name + (r.reversed ? " (merkstave)" : "");
  const names = r.cards.slice(0, 3).map((c) => c.name + (c.reversed ? " ⟲" : ""));
  return names.join(" · ") + (r.cards.length > 3 ? ` +${r.cards.length - 3}` : "");
}

// ── Expanded detail ───────────────────────────────────────────────────────────

function ReadingDetail({ reading }: { reading: GrimoireReading }) {
  const r = parsedResult(reading);
  if (!r) return <Text style={g.detailDim}>Could not parse reading.</Text>;

  if (r.kind === "coin") {
    return <Text style={[g.detailBig, { color: r.yes ? T.cyan : T.red }]}>{r.yes ? "YES" : "NO"}</Text>;
  }

  if (r.kind === "rune") {
    return (
      <View style={g.detailRow}>
        <Text style={g.detailRune}>{r.rune.glyph}</Text>
        <View style={g.detailText}>
          <Text style={g.detailName}>{r.rune.name}{r.reversed ? " (merkstave)" : ""}</Text>
          <Text style={g.detailMean}>{r.rune.meaning}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={g.detailCards}>
      {r.cards.map((c: DrawnCard, i: number) => (
        <View key={i} style={[g.detailCard, c.reversed && g.detailCardRev]}>
          {c.position && <Text style={g.detailPos}>{c.position.toUpperCase()}</Text>}
          <View style={g.detailCardTitle}>
            {c.reversed && <RotateCcw size={9} color={T.red} />}
            <Text style={g.detailName}>{c.name}</Text>
          </View>
          <Text style={g.detailMean}>{c.reversed ? c.rev : c.up}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Entry row ─────────────────────────────────────────────────────────────────

function Entry({
  reading,
  onDelete,
  onNoteChange,
}: {
  reading: GrimoireReading;
  onDelete: () => void;
  onNoteChange: (note: string) => void;
}) {
  const [open, setOpen]     = useState(false);
  const [note, setNote]     = useState(reading.user_note ?? "");

  const color = modeColor(reading.mode);

  const handleDeletePress = () =>
    Alert.alert("Delete reading?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);

  return (
    <View style={g.entry}>
      {/* Header row */}
      <Pressable style={g.entryHeader} onPress={() => setOpen((o) => !o)}>
        <View style={[g.modeBadge, { borderColor: color }]}>
          <Text style={[g.modeTxt, { color }]}>{modeLabel(reading.mode)}</Text>
        </View>
        <Text style={g.timestamp}>{formatDate(reading.timestamp)}</Text>
        <ChevronDown size={12} color={T.dim} style={open ? g.chevronUp : undefined} />
        <Pressable onPress={handleDeletePress} hitSlop={12} style={g.deleteBtn}>
          <Trash2 size={13} color={T.dim} />
        </Pressable>
      </Pressable>

      {/* Summary — always visible */}
      <Text style={g.summary} numberOfLines={open ? undefined : 1}>{summary(reading)}</Text>

      {/* Expanded detail */}
      {open && (
        <>
          <View style={g.divider} />
          <ReadingDetail reading={reading} />
          <TextInput
            style={g.noteInput}
            value={note}
            onChangeText={setNote}
            onEndEditing={() => onNoteChange(note)}
            placeholder="add a note…"
            placeholderTextColor={T.line}
            multiline
            returnKeyType="done"
            blurOnSubmit
          />
        </>
      )}
    </View>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function GrimoireOperation() {
  const db = useSQLiteContext();
  const [readings, setReadings] = useState<GrimoireReading[]>([]);

  const load = useCallback(async () => {
    setReadings(await getReadings(db));
  }, [db]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    await deleteReading(db, id);
    setReadings((prev) => prev.filter((r) => r.id !== id));
  };

  const handleNote = async (id: number, note: string) => {
    await updateNote(db, id, note);
    setReadings((prev) => prev.map((r) => r.id === id ? { ...r, user_note: note } : r));
  };

  return (
    <View style={g.root}>
      <View style={g.headerRow}>
        <Text style={g.heading}>GRIMOIRE</Text>
        <View style={g.countBadge}>
          <Text style={g.countTxt}>{readings.length}</Text>
        </View>
      </View>

      {readings.length === 0 ? (
        <View style={g.empty}>
          <Text style={g.emptyGlyph}>☽</Text>
          <Text style={g.emptyTxt}>No readings yet.{"\n"}Draw a card to begin the archive.</Text>
        </View>
      ) : (
        readings.map((r) => (
          <Entry
            key={r.id}
            reading={r}
            onDelete={() => handleDelete(r.id)}
            onNoteChange={(note) => handleNote(r.id, note)}
          />
        ))
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const g = StyleSheet.create({
  root: { width: "100%", maxWidth: 560, gap: 8 },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  heading: { color: T.cyan, fontSize: 11, letterSpacing: 3 },
  countBadge: {
    backgroundColor: T.panel, borderWidth: 1, borderColor: T.line,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  countTxt: { color: T.dim, fontSize: 10 },

  empty: { alignItems: "center", gap: 10, paddingVertical: 40 },
  emptyGlyph: { color: T.line, fontSize: 36 },
  emptyTxt: { color: T.dim, fontSize: 12, textAlign: "center", lineHeight: 19 },

  entry: {
    width: "100%", backgroundColor: T.panel,
    borderWidth: 1, borderColor: T.line,
    borderTopWidth: 2, borderTopColor: T.cyan,
    borderRadius: 6, padding: 12, gap: 6,
  },
  entryHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  modeBadge: { borderWidth: 1, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 2 },
  modeTxt: { fontSize: 9, letterSpacing: 2 },
  timestamp: { color: T.dim, fontSize: 10, flex: 1 },
  chevronUp: { transform: [{ rotate: "180deg" }] },
  deleteBtn: { padding: 2 },

  summary: { color: T.bone, fontSize: 11.5, lineHeight: 17 },

  divider: { height: 1, backgroundColor: T.line, marginVertical: 4 },

  detailCards: { gap: 8 },
  detailCard: {
    backgroundColor: T.void, borderWidth: 1, borderColor: T.line,
    borderLeftWidth: 2, borderLeftColor: T.cyan,
    borderRadius: 4, padding: 8, gap: 3,
  },
  detailCardRev: { borderLeftColor: T.red },
  detailPos: { color: T.dim, fontSize: 8, letterSpacing: 2 },
  detailCardTitle: { flexDirection: "row", alignItems: "center", gap: 5 },
  detailName: { color: T.bone, fontSize: 13, fontWeight: "600" },
  detailMean: { color: T.dim, fontSize: 11, lineHeight: 16 },
  detailDim: { color: T.dim, fontSize: 11 },
  detailBig: { fontSize: 28, fontWeight: "700", letterSpacing: 4, textAlign: "center", paddingVertical: 8 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailRune: { color: T.yellow, fontSize: 40 },
  detailText: { flex: 1, gap: 4 },

  noteInput: {
    backgroundColor: T.void, borderWidth: 1, borderColor: T.line,
    borderRadius: 4, padding: 8,
    color: T.bone, fontSize: 11.5, lineHeight: 17,
    minHeight: 38,
  },
});
