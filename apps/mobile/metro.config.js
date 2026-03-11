const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 2. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 3. Resolve modules from both local and root node_modules
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// 4. Force hierarchical lookup
config.resolver.disableHierarchicalLookup = false;

// 5. Force singleton React/React-Native instances
config.resolver.extraNodeModules = {
    react: path.resolve(workspaceRoot, 'node_modules/react'),
    'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
    'react-native-safe-area-context': path.resolve(workspaceRoot, 'node_modules/react-native-safe-area-context'),
};

module.exports = withNativeWind(config, { input: './app/global.css' });
