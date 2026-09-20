const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, '../..')];
// Native React must resolve from this project, never the web application's copy.
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules'), path.resolve(__dirname, '../../node_modules')];
config.resolver.extraNodeModules = {
  react: path.resolve(__dirname, 'node_modules/react'),
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
};
module.exports = config;
