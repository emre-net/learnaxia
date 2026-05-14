// Define environment variables for Expo Router before Metro starts
process.env.EXPO_ROUTER_APP_ROOT = process.env.EXPO_ROUTER_APP_ROOT || './app';
process.env.EXPO_ROUTER_IMPORT_MODE = process.env.EXPO_ROUTER_IMPORT_MODE || 'sync';

const path = require('path');
const projectRoot = __dirname;

// Monorepo: root hoists Tailwind v4 (web). NativeWind only reads Tailwind v3 — resolve it from this app.
const Module = require('module');
const origResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  const parentFile = parent && parent.filename;
  const fromNativewind =
    typeof parentFile === 'string' && parentFile.includes(`${path.sep}nativewind${path.sep}`);
  if (fromNativewind && /^tailwindcss($|[\\/])/.test(request)) {
    return require.resolve(request.split('\\').join('/'), {
      paths: [path.join(projectRoot, 'node_modules')],
    });
  }
  return origResolveFilename.call(this, request, parent, isMain, options);
};

const { getDefaultConfig } = require('expo/metro-config');
// NativeWind v4+ uses this entrypoint. Using the dist/* path breaks with package "exports".
const { withNativeWind } = require('nativewind/metro');

const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch only the required packages in the monorepo instead of the entire root
config.watchFolders = [
    path.resolve(workspaceRoot, 'packages/shared'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// Resolve modules from both local and root node_modules
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// Ensure NativeWind and other critical packages resolve correctly
config.resolver.extraNodeModules = {
    '@learnaxia/shared': path.resolve(workspaceRoot, 'packages/shared'),
};

const finalConfig = withNativeWind(config, { 
    input: './app/global.css'
});

module.exports = finalConfig;
