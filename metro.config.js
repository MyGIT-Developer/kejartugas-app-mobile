// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Prevent web-specific packages from being bundled
config.resolver.platforms = ['native', 'android', 'ios'];
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Block web-specific packages
config.resolver.blockList = [/react-dom/, /@iconify\/react/, /lucide-react$/];

module.exports = config;
