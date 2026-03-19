const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Resolve modules from both local and root node_modules
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Ensure NativeWind and other critical packages resolve correctly
config.resolver.extraNodeModules = {
    '@learnaxia/shared': path.resolve(workspaceRoot, 'packages/shared'),
};

const finalConfig = withNativeWind(config, { 
    input: './app/global.css',
    inlineRequires: true 
});

module.exports = finalConfig;
