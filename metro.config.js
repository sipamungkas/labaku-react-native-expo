const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql'); // <--- add this

// Configure resolver for mobile-only development (iOS and Android only)
config.resolver.platforms = ['ios', 'android', 'native'];
config.resolver.resolverMainFields = ['react-native', 'main'];

// Block all web-related SQLite files and dependencies
config.resolver.blockList = [
  /node_modules\/expo-sqlite\/web\/.*$/,
  /\.web\.(js|jsx|ts|tsx)$/,
  /\.wasm$/,
];

// Exclude web platform completely
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: false,
};

module.exports = config;
