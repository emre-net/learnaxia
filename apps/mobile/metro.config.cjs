// Define environment variables for Expo Router before Metro starts
process.env.EXPO_ROUTER_APP_ROOT = process.env.EXPO_ROUTER_APP_ROOT || './app';
process.env.EXPO_ROUTER_IMPORT_MODE = process.env.EXPO_ROUTER_IMPORT_MODE || 'sync';

const path = require('path');
const projectRoot = __dirname;

// Monorepo: root hoists Tailwind v4 (web). NativeWind v2 only reads Tailwind v3.
// Force any require() of 'tailwindcss' from nativewind to resolve from this app's local node_modules.
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

const exclusionList = require('metro-config/src/defaults/exclusionList');
config.resolver.blockList = exclusionList([
  /.*[/\\]node_modules[/\\]learnaxia-mobile[/\\]node_modules[/\\](?!\.bin).*/,
  /.*[/\\]node_modules[/\\]web[/\\]node_modules[/\\](?!\.bin).*/,
  /.*[/\\]node_modules[/\\]\@learnaxia[/\\]shared[/\\]node_modules[/\\](?!\.bin).*/,
]);

// Ensure critical packages resolve correctly in the monorepo
config.resolver.extraNodeModules = {
    '@learnaxia/shared': path.resolve(workspaceRoot, 'packages/shared'),
    'react-native-worklets': path.resolve(workspaceRoot, 'node_modules/react-native-worklets-core'),
    'react': path.resolve(projectRoot, 'node_modules/react'),
    'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
    // Pin NativeWind v2 to the local installation (not the hoisted v4)
    'nativewind': path.resolve(projectRoot, 'node_modules/nativewind'),
    'tailwindcss': path.resolve(projectRoot, 'node_modules/tailwindcss'),
};

// Force Metro to always resolve 'react' to the local React 18 version (not root's React 19)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('react-native-css-interop') || moduleName.startsWith('nativewind/jsx-')) {
    const localReactPath = path.resolve(projectRoot, 'node_modules/react');
    const runtimeName = moduleName.endsWith('jsx-runtime') ? 'jsx-runtime' : 'jsx-dev-runtime';
    return context.resolveRequest(context, path.join(localReactPath, runtimeName), platform);
  }
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    const localReactPath = path.resolve(projectRoot, 'node_modules/react');
    if (moduleName === 'react') {
      return context.resolveRequest(context, localReactPath, platform);
    } else {
      return context.resolveRequest(context, path.join(localReactPath, moduleName.substring(6)), platform);
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

// NativeWind v2 does NOT need a Metro wrapper — it works purely via the babel plugin.
module.exports = config;
