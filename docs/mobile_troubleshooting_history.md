# Learnaxia Mobile App - Mimari ve Sorun Giderme Notları

Bu doküman, geliştirme süreci boyunca karşılaşılan kritik hataları, nedenlerini ve projede uygulanan mimari çözümleri gelecekteki geliştirmelere ışık tutması amacıyla kayıt altına almaktadır.

## 1. Monorepo ve Tailwind/NativeWind Çakışması

**Sorun:**
Metro Bundler başlatıldığında PostCSS Async Pipeline ve `react-native-css-interop/jsx-dev-runtime` hataları alındı.

**Neden:**
Learnaxia bir monorepo yapısına sahiptir ve ana dizinde (web projesi için) TailwindCSS v4 barındırmaktadır. Ancak mobil uygulama (Expo) tarafında kullanılan NativeWind v2, yalnızca Tailwind v3'ün senkron (synchronous) yapısını destekler. Metro çözücüsü (resolver), üst dizindeki asenkron Tailwind v4'ü bulmaya çalıştığı için paketleme işleminde çökme yaşandı. Ayrıca `babel.config.js` içinde yanlışlıkla NativeWind v4'e ait `jsxImportSource: "nativewind"` tanımı kalmıştı.

**Çözüm:**
* `babel.config.js` dosyası güncellenerek NativeWind v2 formatına geri dönüldü (`nativewind/babel` eklentisi kullanıldı).
* `metro.config.cjs` içine özel bir resolver yazıldı. Bu sayede NativeWind'in sadece `apps/mobile/node_modules` içerisindeki Tailwind v3 kütüphanesini kullanması garanti altına alındı ve ana dizindeki v4 sürümünü görmesi engellendi.
* `tailwind.config.js` yapılandırması tamamen v3 standartlarına uygun hale getirildi.

## 2. React Hooks Kural İhlali (Rules of Hooks)

**Sorun:**
`Rendered more hooks than during the previous render.` hatası ile uygulamanın çökmesi.

**Neden:**
`app/(tabs)/index.tsx` sayfasında veriler yüklenirken yazılan `if (loading) return ...` kodundan *sonra* `useState` ve `useRef` gibi bazı hook'lar tanımlanmıştı. React mimarisinde hook'lar, herhangi bir koşullu çıkıştan (early return) önce çağrılmalıdır.

**Çözüm:**
Bileşen içerisindeki tüm hook kullanımları sayfanın en üstüne, `if` bloklarının öncesine taşındı.

## 3. Windows Üzerinde Expo C++ (Native) Derleme Çökmeleri

**Sorun:**
`npm run android` komutu sırasında Gradle derlemesinin aniden kopması: `Gradle build daemon disappeared unexpectedly (JVM crash)`.

**Neden:**
Expo'nun C++ tabanlı çekirdek eklentileri (`expo-modules-core` vb.) Windows üzerinde CMake ile derlenirken yoğun RAM tüketir. Gradle varsayılan olarak yalnızca 2 GB bellek ayırdığı için ( `org.gradle.jvmargs=-Xmx2048m` ), işlem sırasında bellek yetersizliğinden (Out of Memory) arka plan servisi çöküyordu.

**Çözüm:**
`apps/mobile/android/gradle.properties` dosyası güncellendi ve JVM için ayrılan maksimum bellek kapasitesi **4 GB'a** yükseltildi (`org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m`).

## 4. Eksik Bağımlılıklar ve Tip Hataları

**Sorunlar ve Çözümler:**
* `use-language.ts` hook'u `@react-native-async-storage/async-storage` paketine ihtiyaç duyuyordu ancak kurulu değildi. Monorepo kök dizinindeki işletim sistemi çakışmalarını atlamak için `npm install @react-native-async-storage/async-storage --force` komutu ile mobile özel kurulum yapıldı.
* TypeScript derleme (tsc) sürecinde `camera-screen.tsx` dosyasında hatalı bir type import (`import type React as ReactType from 'react';`) tespit edildi ve standart `React.RefObject` kullanımına çevrildi.
* 3D Card çevirme (Flip) işlemi yapan animasyonda `<TouchableOpacity style={{ perspective: 1200 }}>` gibi geçersiz bir stil objesi vardı. React Native standartlarına uyumlu olması için `{ transform: [{ perspective: 1200 }] }` olarak değiştirildi.


---
*Not: Bu dosya ileride projeye katılacak yeni geliştiriciler veya yapay zeka asistanları için referans noktası olarak oluşturulmuştur.*
