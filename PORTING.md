# WyrDeck Expo port — status

## Done (this drop)
- `src/engine/random.ts` — CSPRNG (expo-crypto) + rejection sampling + Fisher–Yates; verified: χ²=88.4/77dof, reversals 29.7%, no-replacement OK
- `src/engine/entropy.ts` — FNV-1a touch-stir pool hook
- `src/data/` — full 78-card deck, Elder Futhark, spreads, ops, cheatcodes (icons as string names, no native deps)
- `App.tsx` — working tarot / spreads / binary / runes with stir ring, in theme colors
- `expo-crypto@~56.0.4` pinned (SDK 56)

## First run
    npm install
    npx expo start        # press w for web, or scan QR in Expo Go

## Next port targets (from plan)
1. Sigil creator + Grimoire → `npx expo install expo-sqlite`
2. Icon art → `npx expo install react-native-svg` + `npm i lucide-react-native`, resolve `card.art` names
3. Crackle/scanlines/chroma effects, operation dropdown + skill-tree connectors
4. Pam-A scans → `assets/cards/`
