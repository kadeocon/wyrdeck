/**
 * WyrDeck randomness engine.
 * Never Math.random() for oracle outcomes (plan §Randomness architecture).
 * - expo-crypto getRandomValues: OS hardware-seeded CSPRNG (native);
 *   delegates to crypto.getRandomValues on web.
 * - Unbiased integers via rejection sampling.
 * - Fisher–Yates partial shuffle for spreads (no replacement).
 * - Ritual entropy is XOR-mixed in: XOR with any constant is a bijection
 *   on u32, so uniformity is preserved (additive-only, never reduces quality).
 */
import * as Crypto from "expo-crypto";

export const REVERSAL_PCT = 30; // % chance reversed — user setting in Phase 2

function randomU32(): number {
  const buf = new Uint32Array(1);
  Crypto.getRandomValues(buf);
  return buf[0] >>> 0;
}

/** Uniform integer in [0, max) via rejection sampling, XOR-mixed with ritual entropy. */
export function secureInt(max: number, entropy = 0): number {
  if (max <= 0) return 0;
  const range = 0x100000000;
  const limit = range - (range % max);
  let x: number;
  do {
    x = (randomU32() ^ entropy) >>> 0;
  } while (x >= limit);
  return x % max;
}

export const rollReversed = (entropy = 0): boolean =>
  secureInt(100, entropy) < REVERSAL_PCT;

/** Fisher–Yates over [0..n), return first `count` indices — draw without replacement. */
export function drawWithoutReplacement(n: number, count: number, entropy = 0): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = secureInt(i + 1, entropy);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, count);
}
