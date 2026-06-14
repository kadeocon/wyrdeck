/**
 * SpreadMap — positional card-layout renderer.
 *
 * Renders any spread that supplies a `grid` field as a tabletop-style map.
 * Spreads without a grid fall back to the stacked-column display in App.tsx.
 *
 * Extensibility: add positions[] + grid[] to any Spread — nothing here changes.
 *
 * Layout maths
 * ─────────────
 * Column scheme (mirrors the Celtic Cross CSS grid from the web reference):
 *   cols 1-3  = cross  |  col 4 = 8 px spacer (no cards)  |  col 5 = staff
 * Card width is derived from the measured container so it fills the screen.
 * Aspect ratio 0.62 (portrait tarot).
 *
 * Cross card (cross:true)
 * ──────────────────────
 * Same (left,top,width,height) as the center card; React Native's
 * transform rotates around the element's own center, which is identical to
 * the center card's center — so they share a pivot with no manual offset.
 * The whole Pressable (including content) rotates 90°; no counter-rotation
 * of children, so the icon/name stack stays intact.
 *
 * Red connector
 * ─────────────
 * Card centers are computed mathematically (not via DOM measurement) from
 * the same col/row → x/y formula used to place the cards. SVG Polyline
 * is drawn at z-index 0 behind all cards. Consecutive coincident points
 * (cards 1 & 2 share a center) are deduplicated so no doubled-back segment.
 */
import { useState, useCallback } from "react";
import {
  View, Text, Pressable, StyleSheet, Modal,
  LayoutChangeEvent, useWindowDimensions,
} from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { RotateCcw, X, Info } from "lucide-react-native";
import { T } from "../theme";
import { CardIcon } from "../CardIcon";
import type { Card } from "../data/tarot";
import type { GridCell } from "../data/spreads";

// ── Layout constants ─────────────────────────────────────────────────────────

const COL_GAP  = 8;   // px between regular columns
const ROW_GAP  = 12;  // px between rows
const SPACER_W = 8;   // px for the blank col-4 gap between cross and staff
const ASPECT   = 0.62; // card width ÷ height

// ── Types ────────────────────────────────────────────────────────────────────

export type MapCard = Card & { reversed: boolean; position: string };

interface Placed extends MapCard {
  n: number;     // reading order (1-indexed)
  cell: GridCell;
  left: number;
  top: number;
  cx: number;    // center x — used for polyline
  cy: number;    // center y
}

interface Props {
  cards: MapCard[];
  grid: GridCell[];
}

// ── Geometry helpers ─────────────────────────────────────────────────────────

/**
 * Compute the left edge of a card in `col` given `cardW`.
 * Col 4 is a spacer — no cards land there.
 * Col 5 (staff) is offset past 3 regular cols + spacer.
 */
function colLeft(col: number, cardW: number): number {
  if (col <= 3) return (col - 1) * (cardW + COL_GAP);
  if (col === 5) return 3 * (cardW + COL_GAP) + SPACER_W;
  return 0; // col 4 spacer — should not be used
}

function rowTop(row: number, cardH: number): number {
  return (row - 1) * (cardH + ROW_GAP);
}

/**
 * Derive card width from the available container width and the maximum
 * column index used by this spread's grid.
 */
function deriveCardW(containerW: number, maxCol: number): number {
  // Count "real" (non-spacer) columns
  const nCols  = maxCol >= 5 ? 4 : maxCol;
  const nGaps  = nCols - 1 + (maxCol >= 5 ? 1 : 0); // +1 for the spacer slot
  const spacer = maxCol >= 5 ? SPACER_W : 0;
  const raw    = (containerW - spacer - nGaps * COL_GAP) / nCols;
  return Math.min(76, Math.max(52, Math.floor(raw)));
}

// ── Sub-components ───────────────────────────────────────────────────────────

/** Thumbnail content — whole Pressable is rotated for the cross card. */
function ThumbInner({ card, cardW }: { card: Placed; cardW: number }) {
  const iconSz  = Math.round(cardW * 0.30);
  const nameSz  = Math.max(7, Math.round(cardW * 0.105));
  const lineH   = Math.max(9,  Math.round(cardW * 0.135));
  return (
    <>
      <Text style={[sm.tnum, card.reversed && sm.tnumRev]}>{card.n}</Text>
      <View style={sm.tart}>
        <CardIcon name={card.art} size={iconSz} color={T.yellow} strokeWidth={1.5} />
      </View>
      <Text style={[sm.tname, { fontSize: nameSz, lineHeight: lineH }]} numberOfLines={2}>
        {card.name}
      </Text>
      {card.reversed && (
        <View style={sm.trevIcon}><RotateCcw size={8} color={T.red} /></View>
      )}
    </>
  );
}

/** Full-detail expand sheet shown in a Modal. */
function ExpandSheet({ card, onClose }: { card: Placed; onClose: () => void }) {
  const rev = card.reversed;
  return (
    <Modal
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessible
      accessibilityViewIsModal
    >
      <Pressable style={sm.scrim} onPress={onClose} accessibilityRole="none">
        {/* Inner View stops tap propagation to scrim */}
        <View
          style={[sm.sheet, rev && sm.sheetRev]}
          accessibilityRole="none"
          onStartShouldSetResponder={() => true}
        >
          {/* Close */}
          <Pressable
            style={sm.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={16} color={T.dim} />
          </Pressable>

          {/* Position header */}
          <View style={sm.sheetPosRow}>
            <View style={[sm.sheetNBadge, rev && sm.sheetNBadgeRev]}>
              <Text style={[sm.sheetNTxt, rev && sm.sheetNTxtRev]}>{card.n}</Text>
            </View>
            <Text style={[sm.sheetPosTxt, rev && sm.sheetPosTxtRev]}>
              {card.position.toUpperCase()}
            </Text>
          </View>

          {/* Art */}
          <CardIcon name={card.art} size={36} color={T.yellow} strokeWidth={1.5} />

          {/* Title row */}
          <View style={sm.sheetTitleRow}>
            <Text style={[sm.sheetChip, rev && sm.sheetChipRev]}>{card.chip}</Text>
            <Text style={sm.sheetName}>{card.name}</Text>
          </View>

          <Text style={sm.sheetArcana}>
            {card.arcana.toUpperCase()} · {card.element.toUpperCase()}
          </Text>

          {rev && (
            <View style={sm.revBadge}>
              <RotateCcw size={11} color={T.red} />
              <Text style={sm.revBadgeTxt}>REVERSED</Text>
            </View>
          )}

          <Text style={sm.sheetMean}>{rev ? card.rev : card.up}</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function SpreadMap({ cards, grid }: Props) {
  const { width: screenW } = useWindowDimensions();
  // Seed with a reasonable estimate; onLayout corrects immediately.
  const [containerW, setContainerW] = useState(screenW - 40);
  const [open,       setOpen]       = useState<Placed | null>(null);
  const [infoOpen,   setInfoOpen]   = useState(false);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerW(e.nativeEvent.layout.width);
  }, []);

  // ── Geometry ──────────────────────────────────────────────────────────────

  const maxCol = Math.max(...grid.map(g => g.col));
  const maxRow = Math.max(...grid.map(g => g.row));
  const cardW  = deriveCardW(containerW, maxCol);
  const cardH  = Math.round(cardW / ASPECT);
  const totalH = maxRow * cardH + (maxRow - 1) * ROW_GAP;

  const placed: Placed[] = cards.map((card, i) => {
    const cell = grid[i];
    const left = colLeft(cell.col, cardW);
    const top  = rowTop(cell.row, cardH);
    return {
      ...card,
      n: i + 1,
      cell,
      left,
      top,
      cx: left + cardW / 2,
      cy: top  + cardH / 2,
    };
  });

  // ── Polyline: reading order, deduplicate coincident centers ───────────────
  const sorted = [...placed].sort((a, b) => a.n - b.n);
  const pts    = sorted.map(c => ({ x: c.cx, y: c.cy }));
  const dedup  = pts.filter(
    (p, i) => i === 0 || Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > 1,
  );
  const pointsStr = dedup.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // ── Partition cards ───────────────────────────────────────────────────────
  const centerCard = placed.find(c => c.cell.center);
  const crossCard  = placed.find(c => c.cell.cross);
  const restCards  = placed.filter(c => !c.cell.center && !c.cell.cross);

  // ── Render ────────────────────────────────────────────────────────────────

  const thumbBase = [sm.thumb, { width: cardW, height: cardH }] as const;

  return (
    <View style={sm.root}>

      {/* ── Header + info toggle ── */}
      <View style={sm.headerRow}>
        <Text style={sm.headerLabel} numberOfLines={1} adjustsFontSizeToFit>
          SPREAD MAP · {cards.length} CARDS
        </Text>
        <Pressable
          style={[sm.infoBtn, infoOpen && sm.infoBtnOn]}
          onPress={() => setInfoOpen(o => !o)}
          accessibilityRole="button"
          accessibilityLabel="How to read this spread"
          accessibilityState={{ expanded: infoOpen }}
        >
          <Info size={13} color={infoOpen ? T.cyan : T.dim} />
        </Pressable>
      </View>

      {/* ── Info pop-out ── */}
      {infoOpen && (
        <View style={sm.infoPop} accessibilityRole="none">
          <Text style={sm.infoTitle}>READING THE SPREAD</Text>
          <Text style={sm.infoBody}>
            The <Text style={sm.infoB}>cross</Text> (1–6) maps the situation;
            the <Text style={sm.infoB}>staff</Text> (7–10) maps where it's heading.
            {"\n\n"}
            Card 2 lies across card 1 — the heart of the matter and what crosses it.
            {"\n\n"}
            Follow the <Text style={sm.infoRed}>red line</Text> in number order.
            Tap any card for its full meaning.
          </Text>
        </View>
      )}

      {/* ── Map ── */}
      <View
        style={[sm.map, { height: totalH }]}
        onLayout={onLayout}
        accessibilityRole="none"
        accessibilityLabel={`${cards.length}-card spread layout`}
      >
        {/* Red connector — behind all cards (z-index 0 via render order) */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={containerW} height={totalH}>
            {pointsStr ? (
              <Polyline
                points={pointsStr}
                fill="none"
                stroke={T.red}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </Svg>
        </View>

        {/* Non-center, non-cross cards */}
        {restCards.map(c => (
          <Pressable
            key={c.n}
            style={[...thumbBase, { left: c.left, top: c.top }, c.reversed && sm.thumbRev]}
            onPress={() => setOpen(c)}
            accessibilityRole="button"
            accessibilityLabel={`Card ${c.n}, ${c.position}: ${c.name}${c.reversed ? ", reversed" : ""}. Tap to read.`}
          >
            <ThumbInner card={c} cardW={cardW} />
          </Pressable>
        ))}

        {/* Center card (card 1 — upright) */}
        {centerCard && (
          <Pressable
            style={[...thumbBase, { left: centerCard.left, top: centerCard.top, zIndex: 2 }, centerCard.reversed && sm.thumbRev]}
            onPress={() => setOpen(centerCard)}
            accessibilityRole="button"
            accessibilityLabel={`Card ${centerCard.n}, ${centerCard.position}: ${centerCard.name}${centerCard.reversed ? ", reversed" : ""}. Tap to read.`}
          >
            <ThumbInner card={centerCard} cardW={cardW} />
          </Pressable>
        )}

        {/* Cross card (card 2) — same frame as center, rotated 90°.
            RN rotates around the element's own midpoint, which equals the
            center card's midpoint since left/top/width/height are identical.
            The whole Pressable (including ThumbInner) rotates — no counter-
            rotation of children, so icon + name remain legible. */}
        {crossCard && centerCard && (
          <Pressable
            style={[
              ...thumbBase,
              { left: centerCard.left, top: centerCard.top, zIndex: 3 },
              sm.thumbCross,
              crossCard.reversed && sm.thumbRev,
            ]}
            onPress={() => setOpen(crossCard)}
            accessibilityRole="button"
            accessibilityLabel={`Card ${crossCard.n}, ${crossCard.position}: ${crossCard.name}${crossCard.reversed ? ", reversed" : ""}. Tap to read.`}
          >
            <ThumbInner card={crossCard} cardW={cardW} />
          </Pressable>
        )}
      </View>

      {/* ── Expand sheet ── */}
      {open && <ExpandSheet card={open} onClose={() => setOpen(null)} />}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const sm = StyleSheet.create({
  root: { width: "100%", gap: 10, marginTop: 8 },

  // Header
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerLabel: { color: T.cyan, fontSize: 9, letterSpacing: 2.5, flex: 1 },
  infoBtn: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1, borderColor: T.line, backgroundColor: T.panel,
    alignItems: "center", justifyContent: "center",
  },
  infoBtnOn: { borderColor: T.cyan },

  // Info pop-out
  infoPop: {
    backgroundColor: T.void, borderWidth: 1, borderColor: T.cyan,
    borderRadius: 7, padding: 13, gap: 6,
  },
  infoTitle: { color: T.cyan, fontSize: 9, letterSpacing: 2.5 },
  infoBody:  { color: T.dim, fontSize: 11.5, lineHeight: 18 },
  infoB:     { color: T.bone, fontWeight: "600" },
  infoRed:   { color: T.red,  fontWeight: "600" },

  // Map container — cards are absolutely positioned inside
  map: { position: "relative", width: "100%" },

  // Card thumbnail
  thumb: {
    position: "absolute",
    backgroundColor: T.panel,
    borderWidth: 1,    borderColor: T.line,
    borderTopWidth: 2, borderTopColor: T.cyan,
    borderRadius: 5,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
    padding: 3,
  },
  thumbRev: { borderTopColor: T.red },
  // Cross card: same frame, rotated 90° around its own center (= center card's center).
  // elevation + shadow give it visual lift above neighbors.
  thumbCross: {
    transform: [{ rotate: "90deg" }],
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },

  // Thumbnail inner layout
  tnum:    { position: "absolute", top: 3, left: 4, color: T.cyan, fontSize: 9 },
  tnumRev: { color: T.red },
  tart:    { flex: 1, alignItems: "center", justifyContent: "center" },
  tname:   { color: T.dim, textAlign: "center", letterSpacing: 0.3, paddingHorizontal: 2 },
  trevIcon:{ position: "absolute", bottom: 3, right: 4 },

  // Scrim + sheet
  scrim: {
    flex: 1,
    backgroundColor: "rgba(9,6,18,0.78)",
    alignItems: "center", justifyContent: "center",
    padding: 24,
  },
  sheet: {
    width: "100%", maxWidth: 300,
    backgroundColor: T.panel,
    borderWidth: 1, borderColor: T.line,
    borderTopWidth: 2, borderTopColor: T.cyan,
    borderRadius: 8, padding: 20, paddingTop: 30,
    alignItems: "center", gap: 9,
  },
  sheetRev: { borderTopColor: T.red },

  closeBtn: {
    position: "absolute", top: 8, right: 8,
    width: 28, height: 28,
    borderWidth: 1, borderColor: T.line, borderRadius: 4,
    alignItems: "center", justifyContent: "center",
  },

  sheetPosRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sheetNBadge: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1, borderColor: T.cyan,
    alignItems: "center", justifyContent: "center",
  },
  sheetNBadgeRev: { borderColor: T.red },
  sheetNTxt:      { color: T.cyan, fontSize: 10 },
  sheetNTxtRev:   { color: T.red },
  sheetPosTxt:    { color: T.cyan, fontSize: 10, letterSpacing: 2 },
  sheetPosTxtRev: { color: T.red },

  sheetTitleRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    flexWrap: "wrap", justifyContent: "center",
  },
  sheetChip: {
    color: T.cyan, borderWidth: 1, borderColor: T.cyan, borderRadius: 999,
    minWidth: 24, textAlign: "center", fontSize: 10, paddingHorizontal: 6, paddingVertical: 3,
  },
  sheetChipRev: { color: T.red, borderColor: T.red },
  sheetName:    { color: T.bone, fontSize: 18, fontWeight: "600" },
  sheetArcana:  { color: T.dim, fontSize: 8.5, letterSpacing: 2 },

  revBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: T.red, borderRadius: 2,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  revBadgeTxt: { color: T.red, fontSize: 9, letterSpacing: 2 },
  sheetMean:   { color: T.dim, fontSize: 13, lineHeight: 20, textAlign: "center" },
});
