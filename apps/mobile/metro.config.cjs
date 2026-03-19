const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Resolve modules from both local and root node_modules
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// Ensure NativeWind and other critical packages resolve correctly
config.resolver.extraNodeModules = {
    '@learnaxia/shared': path.resolve(workspaceRoot, 'packages/shared'),
};

// Fix for Windows path issues - convert to file:// URLs for ESM compatibility
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName.startsWith('@learnaxia/shared')) {
        return {
            filePath: path.resolve(workspaceRoot, 'packages/shared/src/index.ts'),
            type: 'sourceFile',
        };
    }
    return context.resolveRequest(context, moduleName, platform);
};

const finalConfig = withNativeWind(config, { 
    input: './app/global.css',
    inlineRequires: true 
});

module.exports = finalConfig;
