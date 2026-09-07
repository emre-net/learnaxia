# 🔍 Learnaxia – Kapsamlı Proje Analiz Raporu

> Bu rapor tüm proje (web + mobil + shared) üzerinde kod kalitesi, güvenlik, UX/UI, mimari ve performans açısından yapılan incelemenin sonuçlarını içermektedir.

---

## 🚨 KRİTİK HATALAR (Hemen Düzeltilmeli)

### 1. AuthContext İçinde Mock (Sahte) Kullanıcı Verisi Bırakılmış
**Dosya:** [`apps/mobile/context/AuthContext.tsx` (L27-35)](file:///C:/lrx/apps/mobile/context/AuthContext.tsx#L27-L35)

```tsx
// ❌ YANLIŞ – Production kodda sahte kullanıcı hardcode bırakılmış!
const [user, setUser] = useState<UserProfile | null>({
    id: 'mock-123',
    name: 'Test User',
    email: 'test@learnaxia.com',
    ...
} as any);
```

Uygulama açıldığında gerçek bir token kontrolü yapılmıyor. `loadUser` fonksiyonu sadece `setIsLoading(false)` yapıp çıkıyor. Bu, herkesin token olmadan uygulamaya giriş yapabildiği anlamına gelir. **Güvenlik açığı.**

---

### 2. `refreshProfile` Fonksiyonu Devre Dışı
**Dosya:** [`apps/mobile/context/AuthContext.tsx` (L47-56)](file:///C:/lrx/apps/mobile/context/AuthContext.tsx#L47-L56)

```tsx
const refreshProfile = useCallback(async () => {
    try {
        // Mock skipping real API call ← YORUM SATIRI YAPILMIŞ!
        // const res = await api.get('/mobile/user/profile');
        // setUser(res.data);
    } catch (error) { ... }
}, [logout]);
```

Kullanıcı profili hiçbir zaman API'den yenilenmediği için kullanıcı her zaman mock veriyle oturum açmış sayılıyor.

---

### 3. `forgotPassword` Butonu Anlamsız – Hiçbir Şey Yapmıyor
**Dosya:** [`apps/mobile/app/login.tsx` (L163-165)](file:///C:/lrx/apps/mobile/app/login.tsx#L163-L165)

```tsx
<TouchableOpacity>  {/* onPress YOK! */}
    <Text style={styles.forgotPassword}>{t('auth.forgotPassword', currentLang)}</Text>
</TouchableOpacity>
```

Butona dokunulduğunda hiçbir şey olmaz, kullanıcı kaybolup gidiyor.

---

### 4. Yıldız (Bookmark) Butonu İşlevsiz
**Dosya:** [`apps/mobile/app/study/[id].tsx` (L285-294)](file:///C:/lrx/apps/mobile/app/study/%5Bid%5D.tsx#L285-L294)

```tsx
<TouchableOpacity
    onPress={() => {
         Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
         // Bookmark or star functionality ← YORUM, KOD YOK!
    }}
>
    <MaterialIcons name="star-outline" size={28} color="white" />
</TouchableOpacity>
```

"More" (üç nokta) butonu da tamamen devre dışı (`opacity-50` ile görsel olarak pasif gösterilmiş).

---

### 5. API Timeout Çok Kısa
**Dosya:** [`apps/mobile/lib/api.ts` (L24-28)](file:///C:/lrx/apps/mobile/lib/api.ts#L24-L28)

```ts
const apiClient = axios.create({
    timeout: 10000, // 10 saniye
```

AI ile içerik üretimi, PDF işleme ve görüntü analizi gibi uzun süren işlemler için 10 saniye yeterli değil. Kullanıcılar zaman aşımı hatası alıyor olabilir.

---

## ⚠️ ORTA SEVİYE SORUNLAR

### 6. Dil Seçimi Her Dosyada Hardcode Bırakılmış
**Dosyalar:** Neredeyse tüm mobil ekranlar

```tsx
const currentLang = 'tr'; // "Default to Turkish for now" yazıyor ama değişmemiş
```

Bu satır library.tsx, explore.tsx, create.tsx, analytics.tsx, focus-widget.tsx'te tekrar tekrar yazılmış. Kullanıcı profilinden ya da cihaz dilinden alınması gerekirken hardcode bırakılmış. Yeni bir kullanıcı dil değiştirdiğinde hiçbir şey olmaz.

---

### 7. TypeScript Güvenliği Zayıf – Çok Fazla `as any`
**Dosyalar:** library.tsx, explore.tsx, create.tsx, profile.tsx, journey/[id].tsx

```tsx
data={currentData as any[]}                    // library.tsx
renderItem={... (renderNoteItem as any)}        // library.tsx  
router.push(`/collections/${item.id}` as any)  // explore.tsx
const [data, setData] = useState<any>(null)    // analytics.tsx
const [profileData, setProfileData] = useState<any>(null) // profile.tsx
```

`as any` kullanmak TypeScript'in tüm korumalarını devre dışı bırakır. Özellikle FlatList için union type veya discriminated union kullanılmalıydı.

---

### 8. `analytics.tsx` İçinde NativeWind ve StyleSheet Karışık Kullanılmış
**Dosya:** [`apps/mobile/app/analytics.tsx`](file:///C:/lrx/apps/mobile/app/analytics.tsx)

Diğer ekranlarda `StyleSheet.create` kullanılırken analytics ekranı tamamen `className="..."` ile yazılmış. Bu tutarsızlık karışıklık yaratır ve NativeWind çalışmadığında tüm ekran stil kaybeder.

---

### 9. `study/[id].tsx` Karma Stil Kullanımı
**Dosya:** [`apps/mobile/app/study/[id].tsx`](file:///C:/lrx/apps/mobile/app/study/%5Bid%5D.tsx)

Aynı dosyada `className="..."` (NativeWind) ve `style={StyleSheet.create(...)}` birlikte kullanılmış. Bazı yerlerde `className` bazı yerlerde inline style. Bu büyük dosyalarda bakımı zorlaştırır.

---

### 10. Web Layout'ta Yorum Satırı Halinde Bırakılmış Font
**Dosya:** [`apps/web/app/layout.tsx` (L2-19)](file:///C:/lrx/apps/web/app/layout.tsx#L2-L19)

```tsx
// import { Inter as FontSans } from "next/font/google";
// const fontSans = FontSans({...})
```

Bu yorum satırları iki farklı yerde tekrarlanmış. Font yüklenmediği için `font-sans` class'ı tarayıcının varsayılan fontuyla çalışıyor. Uygulama görsel tasarımında büyük fark yaratır.

---

### 11. Profil Ekranında 3 Stat Kart, Grid 2'li Tasarlanmış
**Dosya:** [`apps/mobile/app/(tabs)/profile.tsx` (L91-106)](file:///C:/lrx/apps/mobile/app/(tabs)/profile.tsx#L91-L106)

```tsx
<View style={[styles.statCard, { marginRight: i % 2 === 0 ? '4%' : 0 }]}>
```

3 kart var, grid 2'li düzenlenmiş. 3. kart yarım satırda tek başına kalıyor ve görsel açıdan çirkin görünüyor. Ya 4. kart eklenmelidir ya da tek sütuna geçilmelidir.

---

### 12. `BrandLoader` Bileşeni `showBlur` Prop'unu Kullanmıyor
**Dosya:** [`apps/mobile/components/ui/brand-loader.tsx`](file:///C:/lrx/apps/mobile/components/ui/brand-loader.tsx)

```tsx
export function BrandLoader({ size = 'md', label, className }: BrandLoaderProps) {
    // showBlur prop tanımlanmış ama destructure edilmemiş ve kullanılmıyor!
```

Prop arayüzde var (`showBlur?: boolean`) ama fonksiyon parametrelerinde yok. Yanlış destructure.

---

### 13. Çalışma Ekranında Sadece İki Rating Butonu
**Dosya:** [`apps/mobile/app/study/[id].tsx` (L248-264)](file:///C:/lrx/apps/mobile/app/study/%5Bid%5D.tsx#L248-L264)

SM-2 algoritması 0-5 arası kalite puanı kullanıyor, ancak kullanıcıya yalnızca "Biliyorum (5)" ve "Bilmiyorum (1)" seçenekleri sunuluyor. "Zor / Orta / Kolay" gibi ara seçenekler eksik. Bu algoritmanın etkinliğini düşürür.

---

### 14. Journey Player Ekranında Progress Kayıt Edilmiyor
**Dosya:** [`apps/mobile/app/journey/[id].tsx`](file:///C:/lrx/apps/mobile/app/journey/%5Bid%5D.tsx)

Journey slide'ları arasında geçiş yapılırken backend'e herhangi bir progress kaydı yapılmıyor. Kullanıcı kapattığında sıfırdan başlamak zorunda kalıyor.

---

### 15. Logout Onayı Yok
**Dosya:** [`apps/mobile/app/(tabs)/profile.tsx` (L159-170)](file:///C:/lrx/apps/mobile/app/(tabs)/profile.tsx#L159-L170)

```tsx
<TouchableOpacity onPress={logout}>
```

Butona basıldığında herhangi bir "Çıkış yapmak istediğinize emin misiniz?" onayı olmadan direkt çıkış yapılıyor. UX best practice'e aykırı.

---

## 🎨 UX / UI İYİLEŞTİRME ÖNERİLERİ

### 16. Ana Ekran (Home) Çok Sade – Aksiyon Eksik
**Dosya:** [`apps/mobile/app/(tabs)/index.tsx`](file:///C:/lrx/apps/mobile/app/(tabs)/index.tsx)

Mevcut ekranda yalnızca 2 widget ve 4 stat kart var. Kullanıcıyı "devam et" veya "bugünkü hedef" gibi bir aksiyon almaya yönlendiren hiçbir element yok. Web versiyonundaki gibi "Son çalışılan modüller" veya "Önerilen çalışmalar" bölümü eksik.

---

### 17. Explore Ekranı Arama Gerçek Zamanlı Değil
**Dosya:** [`apps/mobile/app/(tabs)/explore.tsx` (L37-57)](file:///C:/lrx/apps/mobile/app/(tabs)/explore.tsx#L37-L57)

Arama her harf girişinde API çağrısı yapıyor (`onChangeText → fetchDiscover`). Debounce (500ms gecikme) olmadığından kullanıcı her harf bastığında bir istek gidiyor. Bu hem gereksiz yük hem de düşük kaliteli UX.

---

### 18. Library Ekranı Tüm İçeriği Tek Seferde Yüklüyor
**Dosya:** [`apps/mobile/app/(tabs)/library.tsx` (L55-67)](file:///C:/lrx/apps/mobile/app/(tabs)/library.tsx#L55-L67)

```tsx
const response = await api.get('/mobile/library');
setModules(response.data.modules || []);
setCollections(response.data.collections || []);
setNotes(response.data.notes || []);
```

Tüm modüller, koleksiyonlar ve notlar tek bir istekte çekiliyor. Yüzlerce öğe olan bir kullanıcıda bu ciddi yavaşlık yaratır. Sayfalama (pagination) veya sekmeye göre lazy load gerekli.

---

### 19. Create Ekranı Çok Uzun – Kaydırma Zorunlu
**Dosya:** [`apps/mobile/app/create.tsx`](file:///C:/lrx/apps/mobile/app/create.tsx)

826 satırlık tek bir dosya. 4 farklı "atölye" bölümü var ama kullanıcı hepsini görmek için kaydırmak zorunda. Küçük ekranlarda "Notlar Atölyesi" görünmeyebilir bile. Bottom sheet veya horizontal scroll'lu kategori sistemi daha iyi olur.

---

### 20. Google ile Giriş Butonu Görünür ama Devre Dışı
**Dosya:** [`apps/mobile/app/login.tsx` (L217-224)](file:///C:/lrx/apps/mobile/app/login.tsx#L217-L224)

```tsx
<TouchableOpacity activeOpacity={0.8} disabled style={styles.googleButton}>
```

`disabled` prop'u var ama görsel olarak pasif gösterilmiyor (gri renk vs.). Kullanıcı tıklıyor, bir şey olmuyor, kafası karışıyor. Ya kaldırılmalı ya da "Yakında" etiketi ile görsel olarak pasif yapılmalı.

---

### 21. Tab Bar'da Orta Butona (Create) Tıklandığında Geçiş Animasyonu Yok
**Dosya:** [`apps/mobile/app/(tabs)/_layout.tsx` (L78-98)](file:///C:/lrx/apps/mobile/app/(tabs)/_layout.tsx#L78-L98)

Orta floating button'a basıldığında `router.push('/create')` yapılıyor. Ama diğer sekmelere geçiş tab animasyonu varken, create ekranı "modal" olarak açılıyor ve animasyon tutarsız.

---

### 22. Profil Ayarlar Menüsündeki Her Şey "Çok Yakında"
**Dosya:** [`apps/mobile/app/(tabs)/profile.tsx`](file:///C:/lrx/apps/mobile/app/(tabs)/profile.tsx)

Dil, Bildirimler, Hakkında – 3 menü öğesi de `Alert.alert("Çok Yakında", ...)` gösteriyor. Bu kullanıcıyı hayal kırıklığına uğratır. Hakkında sayfası statik içerik olduğu için en azından o çalışabilir olmalıydı.

---

### 23. Çalışma Bitince Sadece `router.back()` Yapılıyor
**Dosya:** [`apps/mobile/app/study/[id].tsx` (L71-77)](file:///C:/lrx/apps/mobile/app/study/%5Bid%5D.tsx#L71-L77)

```tsx
} else {
    router.back(); // Sessizce geri dönüyor
}
```

Son karta gelindiğinde herhangi bir "Tebrikler! X soruyu tamamladın" gibi bir sonuç ekranı ya da özet gösterilmiyor. Bu öğrenme motivasyonunu öldürür.

---

### 24. Web 404 Sayfası Çok Basit
**Dosya:** [`apps/web/app/not-found.tsx`](file:///C:/lrx/apps/web/app/not-found.tsx)

18 satır, sadece düz metin + buton. Marka kimliğinden hiç iz yok, animasyon yok, öneri yok. "Ne arıyordunuz?" veya popüler bağlantılar gibi yönlendirmeler olmalı.

---

### 25. Web Root Layout'ta Font Yüklenmemiş
**Dosya:** [`apps/web/app/layout.tsx`](file:///C:/lrx/apps/web/app/layout.tsx)

`body` sınıfı `font-sans` kullanıyor ama hiçbir Google Font ya da özel font tanımlanmamış. Tailwind'in varsayılan `font-sans` değeri system font stack kullanır. Farklı cihazlarda farklı fontlar görünür.

---

## 🏗️ MİMARİ / KOD KALİTESİ

### 26. Relative Import Tutarsızlığı
**Dosyalar:** library.tsx, profile.tsx vs.

```tsx
import api from '../../lib/api';    // library.tsx - relative path
import api from '@/lib/api';         // index.tsx   - alias
```

Bazı dosyalar `@/` alias, bazıları `../../` relative path kullanıyor. Tutarsız.

---

### 27. `create.tsx` Dev Dosyası Parçalanmalı
**Dosya:** [`apps/mobile/app/create.tsx`](file:///C:/lrx/apps/mobile/app/create.tsx)

826 satır, 4 farklı feature (PDF işleme, kamera, galeri, AI üretimi), 2 modal, 1 tam kamera ekranı aynı dosyada. Bileşenlere ayrılmalı:
- `components/create/camera-screen.tsx`
- `components/create/solution-modal.tsx`
- `components/create/topic-modal.tsx`

---

### 28. `setState` Bağımlılık Eksikliği
**Dosya:** [`apps/mobile/app/study/[id].tsx` (L50-53)](file:///C:/lrx/apps/mobile/app/study/%5Bid%5D.tsx#L50-L53)

```tsx
const handleFlip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAnswer(!showAnswer);  // ← showAnswer dependency var ama fonksiyonel güncelleme yok
}, [showAnswer]);
```

`setShowAnswer(!showAnswer)` yerine `setShowAnswer(prev => !prev)` kullanılmalı ve `showAnswer` dependency'den çıkarılmalı.

---

### 29. Logout Sonrası Token Temizleme Sırası
**Dosya:** [`apps/mobile/context/AuthContext.tsx` (L41-45)](file:///C:/lrx/apps/mobile/context/AuthContext.tsx#L41-L45)

```tsx
const logout = useCallback(async () => {
    await clearAuthToken();
    setUser(null);           // State güncelleniyor
    router.replace('/login'); // Hemen yönlendirme
}, [router]);
```

`clearAuthToken` async'tir ve başarısız olsa bile `setUser(null)` çalışıyor. Hata yönetimi yok.

---

### 30. API Hata Mesajları Kullanıcıya Hiç Gösterilmiyor
**Dosyalar:** library.tsx, explore.tsx, analytics.tsx vb.

```tsx
} catch (error) {
    console.error('Failed to fetch library', error);
    // Kullanıcıya hiçbir bilgi verilmiyor!
}
```

İnternet kesildiğinde veya sunucu hata döndürdüğünde kullanıcı sadece boş ekran görür. Error state ve retry butonu yok.

---

## 📊 ÖZET TABLO

| Kategori | Sorun Sayısı | Aciliyet |
|----------|-------------|----------|
| 🔴 Kritik Bug | 5 | Hemen |
| 🟠 Orta Hata | 10 | Bu Hafta |
| 🎨 UX/UI | 10 | Önümüzdeki Sprint |
| 🏗️ Mimari | 5 | Refactoring |
| **Toplam** | **30** | |

---

## ✅ İYİ YAPILAN ŞEYLER

- **Renk sistemi tutarlı:** `#050A14`, `#090F1D`, `#182234` gibi renkler tutarlı kullanılmış.
- **Haptic feedback:** Tüm butonlarda dokunsal geri bildirim var, çok iyi hissettiriyor.
- **Token refresh mekanizması:** `lib/api.ts` içindeki queue tabanlı token yenileme mantığı profesyonelce yazılmış.
- **Zod validasyonu login'de:** Form validasyonu shared paketten geliyor, doğru yaklaşım.
- **FocusWidget tasarımı:** Pomodoro zamanlayıcı görsel olarak çok başarılı.
- **Brand Loader:** Logo + ActivityIndicator kombinasyonu güzel bir marka detayı.
- **Monorepo yapısı:** Shared paket fikri doğru, i18n ve tipler ortak yerde.
