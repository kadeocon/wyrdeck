/**
 * Static atmospheric overlays — faithful React Native ports of the v0.5 web effects.
 * IMPORTANT: all three are STATIC, exactly like the original. No animation, no flicker.
 * Requires: npx expo install react-native-svg
 */
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextStyle, StyleProp, useWindowDimensions, AccessibilityInfo } from "react-native";
import Svg, { Defs, Pattern, Path, Rect, G } from "react-native-svg";
import { T } from "../theme";

// Precomputed Voronoi crackle geometry from v0.5 (homage to the Pam-A card back).
// 160x160 tile, wrap-aligned so it repeats seamlessly. Do not regenerate — these
// are fixed coordinates from the original computation.
const CRACKLE_PATH =
  "M0.0 10.5 L9.3 19.5 M0.0 26.5 L9.3 19.5 M0.0 52.3 L3.5 54.8 M0.0 78.2 L1.6 78.0 M0.0 89.8 L15.9 88.4 M0.0 102.2 L14.5 97.2 M0.0 125.5 L14.0 115.7 M0.0 139.8 L18.9 150.7 M1.6 78.0 L3.5 54.8 M1.6 78.0 L15.9 88.4 M3.5 54.8 L40.4 63.2 M9.3 19.5 L16.5 16.2 M14.0 115.7 L14.5 97.2 M14.0 115.7 L24.0 121.1 M14.5 97.2 L19.4 90.1 M15.9 88.4 L19.4 90.1 M16.5 16.2 L21.1 10.0 M16.5 16.2 L40.4 63.2 M18.9 150.7 L20.0 160.0 M18.9 150.7 L20.9 148.8 M19.4 90.1 L41.5 81.7 M20.0 0.0 L21.1 10.0 M20.9 148.8 L24.0 121.1 M20.9 148.8 L71.3 125.8 M21.1 10.0 L36.4 12.1 M24.0 121.1 L61.6 105.8 M36.4 12.1 L53.6 47.1 M36.4 12.1 L60.9 6.2 M40.4 63.2 L41.0 63.7 M41.0 63.7 L41.5 81.7 M41.0 63.7 L54.1 51.6 M41.5 81.7 L61.6 105.8 M53.6 47.1 L54.1 51.6 M53.6 47.1 L60.9 6.2 M54.1 51.6 L78.8 46.3 M60.9 6.2 L70.3 0.0 M61.6 105.8 L70.9 112.5 M70.3 160.0 L75.8 156.4 M70.9 112.5 L71.3 125.8 M70.9 112.5 L90.7 99.1 M71.3 125.8 L78.7 143.6 M75.8 156.4 L77.4 160.0 M75.8 156.4 L78.7 143.6 M77.4 0.0 L92.1 33.9 M78.7 143.6 L105.0 147.1 M78.8 46.3 L92.1 33.9 M78.8 46.3 L93.1 90.2 M90.7 99.1 L91.8 99.3 M90.7 99.1 L93.1 90.2 M91.8 99.3 L108.6 98.6 M91.8 99.3 L130.4 131.1 M92.1 33.9 L101.9 35.6 M93.1 90.2 L116.7 62.9 M101.9 35.6 L116.7 62.9 M101.9 35.6 L118.7 26.2 M105.0 147.1 L111.7 160.0 M105.0 147.1 L119.5 142.6 M108.6 98.6 L139.4 80.4 M108.6 98.6 L143.0 111.6 M111.7 0.0 L113.1 2.7 M113.1 2.7 L118.7 26.2 M113.1 2.7 L135.8 3.3 M116.7 62.9 L134.4 65.9 M118.7 26.2 L134.5 24.4 M119.5 142.6 L130.4 131.1 M119.5 142.6 L133.2 160.0 M130.4 131.1 L144.1 125.6 M133.2 0.0 L135.8 3.3 M134.4 65.9 L139.4 80.4 M134.4 65.9 L151.4 46.2 M134.5 24.4 L136.0 3.5 M134.5 24.4 L150.4 33.7 M135.8 3.3 L136.0 3.5 M136.0 3.5 L140.7 -0.0 M139.4 80.4 L139.8 80.9 M139.8 80.9 L143.1 91.3 M139.8 80.9 L160.0 78.2 M140.7 160.0 L145.5 156.5 M143.0 111.6 L144.1 125.6 M143.0 111.6 L144.7 107.6 M143.1 91.3 L144.7 107.6 M143.1 91.3 L160.0 89.8 M144.1 125.6 L151.9 131.2 M144.7 107.6 L160.0 102.2 M145.5 156.5 L149.2 160.0 M145.5 156.5 L155.4 137.2 M149.2 0.0 L160.0 10.5 M150.4 33.7 L151.4 46.2 M150.4 33.7 L160.0 26.5 M151.4 46.2 L160.0 52.3 M151.9 131.2 L155.4 137.2 M151.9 131.2 L160.0 125.5 M155.4 137.2 L160.0 139.8";

const TILE = 160;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

/** Seamless Voronoi crackle, tiled. Static, opacity 0.09 like the original. */
export function CrackleOverlay() {
  if (useReducedMotion()) return null;
  const { width, height } = useWindowDimensions();
  const cols = Math.ceil(width / TILE) + 1;
  const rows = Math.ceil(height / TILE) + 1;
  const tiles: { tx: number; ty: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push({ tx: c * TILE, ty: r * TILE });
    }
  }
  return (
    <View style={st.fill} pointerEvents="none">
      <Svg width={width} height={height} style={{ opacity: 0.35 }}>
        {tiles.map(({ tx, ty }, i) => (
          <G key={i} x={tx} y={ty}>
            <Path d={CRACKLE_PATH} fill="none" stroke={T.brick} strokeWidth={1.5} strokeLinecap="round" />
          </G>
        ))}
      </Svg>
    </View>
  );
}

/** CRT scanlines: 1px dark line every 3px. Static, opacity 0.35 like the original. */
export function Scanlines() {
  if (useReducedMotion()) return null;
  const { width, height } = useWindowDimensions();
  return (
    <View style={[st.fill, { opacity: 0.35 }]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <Pattern id="scan" width={1} height={3} patternUnits="userSpaceOnUse">
            <Rect x={0} y={2} width={1} height={1} fill="rgba(0,0,0,0.6)" />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#scan)" />
      </Svg>
    </View>
  );
}

/**
 * Chromatic-aberration text. RN allows only one textShadow, so we stack offset
 * copies: red shifted +2px, cyan shifted -2px, bone on top with a cyan glow.
 * Reproduces the RGB-split look of the original CSS text-shadow stack.
 */
export function ChromaText({
  children, style, tone = "bone",
}: {
  children: string;
  style?: StyleProp<TextStyle>;
  tone?: "bone" | "yes" | "no";
}) {
  const reduced = useReducedMotion();
  const glow = tone === "no" ? T.red : T.cyan;
  const top = tone === "yes" ? T.cyan : tone === "no" ? T.red : T.bone;
  if (reduced) {
    return (
      <Text style={[style, { color: top, textShadowColor: glow, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }]}>
        {children}
      </Text>
    );
  }
  return (
    <View>
      <Text style={[style, st.ghost, { color: T.red, left: 2 }]}>{children}</Text>
      <Text style={[style, st.ghost, { color: T.cyan, left: -2 }]}>{children}</Text>
      <Text style={[style, {
        color: top,
        textShadowColor: glow,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 14,
      }]}>{children}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  ghost: { position: "absolute", top: 0, left: 0, opacity: 0.55 },
});
