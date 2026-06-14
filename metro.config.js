const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// lucide-react-native@1.x ships a broken `exports` field (points to a .mjs
// that doesn't exist). Disabling package-exports resolution causes Metro to
// fall back to the `main` field, which correctly resolves the CJS build.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
