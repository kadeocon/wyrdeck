/**
 * Shared Info button + card popout — used throughout the app wherever the ⓘ
 * pattern appears (stir ring, SpreadMap, future Settings hints, etc.).
 *
 * Pattern: toggle `open` state with InfoButton; render <InfoCard> conditionally
 * inline below. Both the button and card carry consistent border/color language.
 *
 * Body text helpers (ip.body, ip.bold, ip.red) are exported as a StyleSheet so
 * callers can compose rich Text nodes without re-specifying sizes.
 */
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Info } from "lucide-react-native";
import { T } from "../theme";
import type { ReactNode } from "react";

interface BtnProps {
  open: boolean;
  onToggle: () => void;
  label?: string;
}

export function InfoButton({ open, onToggle, label = "More information" }: BtnProps) {
  return (
    <Pressable
      style={[ip.btn, open && ip.btnOn]}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded: open }}
    >
      <Info size={13} color={open ? T.cyan : T.dim} />
    </Pressable>
  );
}

interface CardProps {
  title: string;
  children: ReactNode;
}

export function InfoCard({ title, children }: CardProps) {
  return (
    <View style={ip.card}>
      <Text style={ip.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export const ip = StyleSheet.create({
  // Button
  btn:       { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: T.line, backgroundColor: T.panel, alignItems: "center", justifyContent: "center" },
  btnOn:     { borderColor: T.cyan },
  // Card container
  card:      { width: "100%", backgroundColor: T.void, borderWidth: 1, borderColor: T.cyan, borderRadius: 7, padding: 13, gap: 6 },
  cardTitle: { color: T.cyan, fontSize: 9, letterSpacing: 2.5 },
  // Shared body text styles — import `ip` and use on <Text> nodes inside InfoCard
  body:  { color: T.dim,  fontSize: 11.5, lineHeight: 18 },
  bold:  { color: T.bone, fontWeight: "600" },
  red:   { color: T.red,  fontWeight: "600" },
});
