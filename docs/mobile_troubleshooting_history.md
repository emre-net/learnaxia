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


## 5. Multi-Agent Tutarsızlıkları ve Faz 1 Stabilizasyon Çözümleri

### 5.1 DrawingCanvas `PanResponder` Stale Closure & SVG Ölçekleme Sorunu
* **Sorun:** Çizim ekranında parmak kaldırıldığında çizgiler kayboluyor ve araç/renk seçimi geçersiz kalıyordu; Web ve Mobil genişlik farkından çizimler taşıyordu.
* **Neden:** `PanResponder.create(...)` React `useRef` içinde bir kez oluşturulup eski state değerlerini (`currentPath`, `activeTool`, `selectedColor`) yakalıyordu (stale closure). SVG kaydedilirken referans genişliği saklanmıyordu.
* **Çözüm:** `apps/mobile/components/drawing/drawing-canvas.tsx` içinde tüm canlı çizim durumu mutable `ref`'lere taşındı; `onLayout` ile `canvasWidth` ölçülüp `DrawingCanvasData` (`canvasWidth` + SVG `viewBox`) içinde saklanarak Web/Mobil arası orantılı ölçekleme sağlandı.

### 5.2 Study Motorunda Çift Sayım, Yanlış SM-2 Puanı ve Günlük Oturum Eşleşmesi
* **Sorun:** `MC`, `TRUE_FALSE` ve `GAP` sorularında yanlış cevaplar dahi SM-2 sistemine `quality: 3` (doğru) olarak kaydediliyor, doğruluk istatistiği çift sayılıyor; `TRUE_FALSE` cevaplarında `false` değeri `||` yüzünden yutuluyordu; `GAP` değerlendirmesi boş listede doğru dönüp Türkçe `İ/ı` harflerinde şaşıyordu.
* **Neden:** Etkileşimli kartlar cevabı `onAnswer` içinde saydıktan sonra sonraki karta geçerken `nextCard(3)` çağrısıyla ikinci kez logluyordu. Günlük karma tekrarda farklı modüllerin kartları tek bir sessionId'ye gönderiliyordu.
* **Çözüm:** `packages/shared/src/utils/content.ts` içinde `resolveTrueFalseAnswer`, `parseGapSegments` ve Türkçe locale (`'tr'`) duyarlı `evaluateGapAnswers` merkezileştirildi. Etkileşimli kartlarda loglama `onAnswer` içinde tek sefere (`isCorrect ? 4 : 1`) indirildi; `FLASHCARD` için 4'lü SM-2 (**Tekrar 1 / Zor 2 / İyi 4 / Kolay 5**) + Reanimated yatay kaydırma kısayolu eklendi; `/api/mobile/study/start-daily` her modül için `sessionMap[moduleId]` döndürecek şekilde güncellendi.

### 5.3 Web BlockNote + Mobil Hibrit Not Çizim Uyumu & LaTeX Ayrıştırıcı
* **Sorun:** Mobilde sadece çizim düzenlenen bir Web BlockNote notu, BlockNote JSON yapısını kaybedip düz metne dönüşüyordu. `formatLatexToUnicode` iç içe süslü parantezlerde (`\sqrt{x^{2}}`) bozuluyor ve `\alpha_{1}` alt simgesinde `\b` kelime sınırı `_` ile eşleşmediği için sembolü çeviremiyordu.
* **Neden:** `\b` regex'i alt çizgi (`_`) öncesi tetiklenmez; basit regex iç içe `{}` bloklarını ilk `}` karakterinde keser.
* **Çözüm:** `@learnaxia/shared` içinde `parseNoteContent`/`serializeNoteContent` (`textWasEdited: false` iken `rawRichText` BlockNote JSON'unu korur) ve dengeli parantez taramalı + `(?![a-zA-Z])` lookahead'li `formatLatexToUnicode` yazıldı (`apps/mobile/components/ui/rich-math-text.tsx` ile 60fps offline render).

### 5.4 `OfflineStorageService` Yarış Durumu (Race Condition), Dead-Letter & Logout Temizliği
* **Sorun:** Paralel `queueStudyAnswer` / `cacheModule` yazımları AsyncStorage read-modify-write çakışmasına yol açabiliyordu; hatalı istekler 3 denemeden sonra sessizce siliniyordu; kullanıcı çıkışında eski kullanıcıya ait önbellek cihazda kalıyordu.
* **Çözüm:** `withLock` async mutex tüm AsyncStorage mutasyonlarını sıraya soktu, `400`/`403`/`404` veya `retryCount >= 5` hataları `retryDeadLetters()` destekli dead-letter kuyruğuna alındı ve çıkış/oturum yenileme hatasında `clearAllUserData()` bağlandı.

### 5.5 Windows PowerShell `[id]` Dosya Yolu Kuralı
* **Sorun:** PowerShell'de `Get-Content` / `Select-String` komutlarına verilen `app/notes/[id].tsx` gibi Next.js/Expo dinamik rota yolları wildcard olarak yorumlanıp dosya bulunamıyor.
* **Çözüm:** Windows PowerShell'de dinamik `[...]` rotaları okurken/ararken her zaman `-LiteralPath` parametresi kullanılmalıdır.

---
*Not: Bu dosya ileride projeye katılacak yeni geliştiriciler veya yapay zeka asistanları için referans noktası olarak oluşturulmuştur.*
