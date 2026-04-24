const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Make 'src' resolvable from anywhere (fixes deep app/ imports)
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  src: path.resolve(__dirname, 'src'),
};

// Web-compatible module resolution
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // Replace native-only modules with web fallbacks
    if (moduleName === 'react-native-maps') {
      return {
        filePath: require.resolve('./src/components/web/MapViewWeb.tsx'),
        type: 'sourceFile',
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
