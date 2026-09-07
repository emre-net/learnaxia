const { withAndroidStyles, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const VECTOR_XML = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="288dp"
    android:height="288dp"
    android:viewportWidth="200"
    android:viewportHeight="200">
    <!-- BACKGROUND -->
    <path android:pathData="M0,0 h200 v200 h-200 z" android:fillColor="#000000" />
    
    <group android:name="all_elements" android:pivotX="100" android:pivotY="100">
        
        <!-- ARMS -->
        <group android:name="arms" android:pivotX="100" android:pivotY="100">
            <!-- Left Arm -->
            <path android:pathData="M100,105 Q60,105 30,85" android:strokeColor="#F8FAFC" android:strokeWidth="4" android:strokeLineCap="round"/>
            <!-- Right Arm -->
            <path android:pathData="M100,105 Q140,105 170,85" android:strokeColor="#F8FAFC" android:strokeWidth="4" android:strokeLineCap="round"/>
        </group>

        <!-- LEFT CARD -->
        <group android:name="left_card" android:pivotX="100" android:pivotY="100">
            <!-- Card Body -->
            <path android:pathData="M70,70 h40 v60 h-40 z" android:fillColor="#0A0A0A" android:strokeColor="#2563EB" android:strokeWidth="3"/>
            <!-- Lines -->
            <path android:pathData="M80,85 h20" android:strokeColor="#333333" android:strokeWidth="3"/>
            <path android:pathData="M80,95 h30" android:strokeColor="#333333" android:strokeWidth="3"/>
            <path android:pathData="M80,105 h25" android:strokeColor="#333333" android:strokeWidth="3"/>
            <path android:pathData="M105,120 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0" android:fillColor="#F8FAFC"/>
        </group>

        <!-- RIGHT CARD -->
        <group android:name="right_card" android:pivotX="100" android:pivotY="100">
            <!-- Card Body -->
            <path android:pathData="M90,70 h40 v60 h-40 z" android:fillColor="#0A0A0A" android:strokeColor="#2563EB" android:strokeWidth="3"/>
            <!-- Lines -->
            <path android:pathData="M100,85 h30" android:strokeColor="#333333" android:strokeWidth="3"/>
            <path android:pathData="M100,95 h20" android:strokeColor="#333333" android:strokeWidth="3"/>
            <path android:pathData="M100,105 h25" android:strokeColor="#333333" android:strokeWidth="3"/>
            <path android:pathData="M95,120 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0" android:fillColor="#F8FAFC"/>
        </group>

        <!-- BULB CENTER -->
        <group android:name="bulb" android:pivotX="100" android:pivotY="100">
            <path android:pathData="M85,85 h30 v30 h-30 z" android:fillColor="#000000" />
            <path android:pathData="M95,115 c0,2.75 2.25,5 5,5 h0 c2.75,0 5,-2.25 5,-5 v-5 h-10 z" android:strokeColor="#F8FAFC" android:strokeWidth="2"/>
            <path android:pathData="M100,70 c-10,0 -18,8 -18,18 c0,6 3,11 8,14 v13 c0,2.75 2.25,5 5,5 h0 c2.75,0 5,-2.25 5,-5 v-13 c5,-3 8,-8 8,-14 c0,-10 -8,-18 -18,-18 z" android:strokeColor="#F8FAFC" android:strokeWidth="2"/>
            <!-- Spark -->
            <group android:name="spark" android:pivotX="100" android:pivotY="90">
                <path android:pathData="M100,70 l6,19 h20 l-16,11 l6,19 l-16,-11 l-16,11 l6,-19 l-16,-11 h20 z" android:fillColor="#2563EB"/>
            </group>
        </group>
    </group>
</vector>`;

const ANIMATED_VECTOR_XML = `<?xml version="1.0" encoding="utf-8"?>
<animated-vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:drawable="@drawable/ic_splash_logo">

    <!-- Spark Scale Up -->
    <target android:name="spark">
        <aapt:attr name="android:animation">
            <set>
                <objectAnimator
                    android:propertyName="scaleX"
                    android:valueFrom="0.0" android:valueTo="1.0"
                    android:duration="400"
                    android:interpolator="@android:interpolator/overshoot" />
                <objectAnimator
                    android:propertyName="scaleY"
                    android:valueFrom="0.0" android:valueTo="1.0"
                    android:duration="400"
                    android:interpolator="@android:interpolator/overshoot" />
                <objectAnimator
                    android:propertyName="alpha"
                    android:valueFrom="0.0" android:valueTo="1.0"
                    android:duration="400" />
            </set>
        </aapt:attr>
    </target>

    <!-- Bulb Alpha -->
    <target android:name="bulb">
        <aapt:attr name="android:animation">
            <objectAnimator
                android:propertyName="alpha"
                android:valueFrom="0.0" android:valueTo="1.0"
                android:startOffset="250"
                android:duration="500" />
        </aapt:attr>
    </target>

    <!-- Left Card Translate & Rotate -->
    <target android:name="left_card">
        <aapt:attr name="android:animation">
            <set>
                <objectAnimator
                    android:propertyName="alpha"
                    android:valueFrom="0.0" android:valueTo="1.0"
                    android:startOffset="600"
                    android:duration="400" />
                <objectAnimator
                    android:propertyName="translateX"
                    android:valueFrom="0" android:valueTo="-55"
                    android:startOffset="600"
                    android:duration="600"
                    android:interpolator="@android:interpolator/overshoot" />
                <objectAnimator
                    android:propertyName="rotation"
                    android:valueFrom="0" android:valueTo="-15"
                    android:startOffset="600"
                    android:duration="600"
                    android:interpolator="@android:interpolator/overshoot" />
            </set>
        </aapt:attr>
    </target>

    <!-- Right Card Translate & Rotate -->
    <target android:name="right_card">
        <aapt:attr name="android:animation">
            <set>
                <objectAnimator
                    android:propertyName="alpha"
                    android:valueFrom="0.0" android:valueTo="1.0"
                    android:startOffset="600"
                    android:duration="400" />
                <objectAnimator
                    android:propertyName="translateX"
                    android:valueFrom="0" android:valueTo="55"
                    android:startOffset="600"
                    android:duration="600"
                    android:interpolator="@android:interpolator/overshoot" />
                <objectAnimator
                    android:propertyName="rotation"
                    android:valueFrom="0" android:valueTo="15"
                    android:startOffset="600"
                    android:duration="600"
                    android:interpolator="@android:interpolator/overshoot" />
            </set>
        </aapt:attr>
    </target>

    <!-- Arms Alpha -->
    <target android:name="arms">
        <aapt:attr name="android:animation">
            <objectAnimator
                android:propertyName="alpha"
                android:valueFrom="0.0" android:valueTo="1.0"
                android:startOffset="600"
                android:duration="400" />
        </aapt:attr>
    </target>

    <!-- Heartbeat & Exit -->
    <target android:name="all_elements">
        <aapt:attr name="android:animation">
            <set>
                <!-- Pulse Up -->
                <objectAnimator
                    android:propertyName="scaleX"
                    android:valueFrom="1.0" android:valueTo="1.15"
                    android:startOffset="1400"
                    android:duration="150" />
                <objectAnimator
                    android:propertyName="scaleY"
                    android:valueFrom="1.0" android:valueTo="1.15"
                    android:startOffset="1400"
                    android:duration="150" />
                <!-- Pulse Down -->
                <objectAnimator
                    android:propertyName="scaleX"
                    android:valueFrom="1.15" android:valueTo="1.0"
                    android:startOffset="1550"
                    android:duration="150" />
                <objectAnimator
                    android:propertyName="scaleY"
                    android:valueFrom="1.15" android:valueTo="1.0"
                    android:startOffset="1550"
                    android:duration="150" />
                
                <!-- Exit Scale Down to 0 -->
                <objectAnimator
                    android:propertyName="scaleX"
                    android:valueFrom="1.0" android:valueTo="0.0"
                    android:startOffset="2300"
                    android:duration="400" />
                <objectAnimator
                    android:propertyName="scaleY"
                    android:valueFrom="1.0" android:valueTo="0.0"
                    android:startOffset="2300"
                    android:duration="400" />
                <objectAnimator
                    android:propertyName="alpha"
                    android:valueFrom="1.0" android:valueTo="0.0"
                    android:startOffset="2300"
                    android:duration="400" />
            </set>
        </aapt:attr>
    </target>
</animated-vector>`;


const withNativeSplashScreen = (config) => {
    // 1. Yazılacak dosyaları ayarlama
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const resDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'drawable');
            if (!fs.existsSync(resDir)) {
                fs.mkdirSync(resDir, { recursive: true });
            }
            fs.writeFileSync(path.join(resDir, 'ic_splash_logo.xml'), VECTOR_XML);
            fs.writeFileSync(path.join(resDir, 'ic_splash_animated.xml'), ANIMATED_VECTOR_XML);
            return config;
        },
    ]);
};

// 2. Styles.xml içine Animated Vector Drawable'ı (AVD) bağlama
const withSplashStyles = (config) => {
    return withAndroidStyles(config, (config) => {
        const styles = config.modResults.resources.style;
        const splashScreenTheme = styles.find(s => s.$ && s.$.name === 'Theme.App.SplashScreen');
        
        if (splashScreenTheme) {
            // Animasyon dosyasını kullan (önceki transparent/icon yerine)
            let iconItem = splashScreenTheme.item.find(i => i.$.name === 'windowSplashScreenAnimatedIcon');
            if (!iconItem) {
                splashScreenTheme.item.push({
                    $: { name: 'windowSplashScreenAnimatedIcon' },
                    _: '@drawable/ic_splash_animated'
                });
            } else {
                iconItem._ = '@drawable/ic_splash_animated';
            }

            // Animasyon süresi bildirme
            let durationItem = splashScreenTheme.item.find(i => i.$.name === 'windowSplashScreenAnimationDuration');
            if (!durationItem) {
                splashScreenTheme.item.push({
                    $: { name: 'windowSplashScreenAnimationDuration' },
                    _: '2700'
                });
            } else {
                durationItem._ = '2700';
            }
        }
        return config;
    });
};

module.exports = (config) => {
    config = withNativeSplashScreen(config);
    config = withSplashStyles(config);
    return config;
};
