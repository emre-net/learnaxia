module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }]
        ],
        plugins: [
            "react-native-reanimated/plugin",
            ["babel-plugin-transform-inline-environment-variables", {
                "include": [
                    "EXPO_ROUTER_APP_ROOT",
                    "EXPO_ROUTER_IMPORT_MODE",
                    "EXPO_PUBLIC_API_URL"
                ]
            }]
        ],
    };
};
