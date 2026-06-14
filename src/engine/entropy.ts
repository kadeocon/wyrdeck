/**
 * Ritual entropy pool — FNV-1a hash of touch-stir coordinates + timing.
 * XOR'd with the CSPRNG at draw time (see random.ts). Additive-only.
 * App build later adds accelerometer shake + mic noise sources.
 */
import { useCallback, useRef } from "react";

export const STIR_CAP = 120; // ~3 stirs charges the ring

const now = (): number =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

export function useEntropyPool() {
  const pool = useRef<number>(0x811c9dc5 >>> 0); // FNV offset basis
  const stirs = useRef<number>(0);

  const mix = useCallback((x: number, y: number) => {
    let h = pool.current;
    const t = now();
    const data = [
      x & 0xff, y & 0xff,
      (x >> 8) & 0xff, (y >> 8) & 0xff,
      t & 0xff, (t * 1000) & 0xff,
    ];
    for (const b of data) {
      h ^= b;
      h = Math.imul(h, 0x01000193) >>> 0; // FNV prime
    }
    pool.current = h;
    stirs.current = Math.min(stirs.current + 1, STIR_CAP);
  }, []);

  const drain = useCallback((): number => {
    const v = pool.current >>> 0;
    stirs.current = 0;
    return v;
  }, []);

  return { mix, drain, stirs };
}
