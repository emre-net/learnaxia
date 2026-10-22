# LearnAxia Çapraz Platform ve Mimari Bütünlük Kuralı (Cross-Platform Guard)

Bu kural; birden fazla yapay zeka ajanının veya geliştiricinin projede çalışırken Web (`apps/web`) ve Mobil (`apps/mobile`) platformları arasında uyumsuzluk yaratmasını, soru tiplerini budamasını ve veri modellerini bozmasını kesin olarak engeller.

---

## 1. Dört Temel Soru Tipi Dokunulmazlığı

Platform her iki tarafta da şu 4 soru tipini **eksiksiz ve ödünsüz** desteklemek zorundadır:

1. **`FLASHCARD`:** Çift yüzlü kart (Ön: `front`/`question`, Arka: `back`/`answer`).
2. **`MC` (Multiple Choice):** Soru, 4 seçenek (`options: string[]`), doğru cevap (`correctAnswer`) ve opsiyonel açıklama (`explanation`).
3. **`TRUE_FALSE` / `TF`:** Önerme metni ve iki seçenekli (Doğru / Yanlış) karar yapısı.
4. **`GAP` (Gap Fill):** Cümle içinde `[boşluk]` içeren metin ve tamamlama alanı.

### 🚫 KESİN YASAKLAR:
- Hiçbir ajan mobil veya web çalışma ekranında soru tiplerini tek tipleştiremez (örneğin `MC` tipini flashcard'a çeviremez).
- Mobil oluşturma ekranı (`modules/new.tsx`) sadece flashcard ile sınırlandırılamaz; diğer tiplerin de eklenmesine imkan tanınmalıdır.
- Kod refactoring sırasında `MC`, `TF` veya `GAP` renderer bileşenleri basitleştirme bahanesiyle silinemez.

---

## 2. Kimlik, Profil ve Ad-Soyad / Nickname Ayrımı

Kullanıcı modeli daima şu iki alanı birbirinden bağımsız tutmalıdır:
- **`name` (Ad Soyad):** Kullanıcının gerçek adıdır. Türkçe karakter (`ç, ğ, ı, ö, ş, ü`) ve **boşluk içerebilir**. UI etiketinde "Ad Soyad" yazıyorsa doğrulama şeması asla boşluğu yasaklayamaz.
- **`handle` (Kullanıcı Adı / Nickname):** Kullanıcının sistemdeki tekil rumuzudur (`@handle`). Alfanumerik ve alt çizgi (`/^[a-zA-Z0-9_]+$/`) kuralına tabidir.

### 🚫 KESİN YASAKLAR:
- Mobil kayıt ekranında "Ad Soyad" isteyip regex ile kullanıcı adı zorlamak yasaktır.
- Kayıt olan kullanıcının `handle` alanını boş bırakıp ismini rumuz formatında saklamak yasaktır.
- Web'de min 6 karakter parola isterken mobilde min 8 karakter isteyerek kullanıcıları kilitlemek yasaktır; parola politikası `@learnaxia/shared` üzerinde ortak olmalıdır.

---

## 3. Not Modülü ve Çevrimdışı (Offline-First) Prensibi

- Mobil not görüntüleme ve düzenleme ekranı **asla harici bir webview sayfasına (`/mobile-editor`) bağımlı olamaz**.
- Cihazda depolanan notlar internet bağlantısı olmasa dahi yerel önbellekten (AsyncStorage / SQLite) okunabilmelidir.
- İnternet yokken online senkronizasyon gerektiren kısımlarda *"Bu kısımlar çevrimdışı güncellenememektedir"* uyarısı gösterilmeli, kullanıcı uygulamadan atılmamalıdır.
- Not editörü sadece klavye metnini değil, çizim/el yazısı bloklarını da desteklemelidir.

---

## 4. Kategori Senkronizasyonu

- `apps/web/lib/constants/categories.ts` içinde tanımlanan ana kategoriler ve alt kategoriler, mobil Keşfet (`explore.tsx`) ve Modül Oluşturucu ekranlarında da birebir yer almalıdır.
- Mobilde kategoriler silinerek `"Genel"` varsayılanına indirgenemez.

---

## 5. UI/UX ve Responsive Standartları

- **Hesap Silme (Danger Zone):** Profil ana ekranında çıkış butonunun altında doğrudan "Hesabı Sil" butonu bulunamaz. Yalnızca Ayarlar menüsü altındaki onaylı güvenlik sekmesinde yer alabilir.
- **Tablet Desteği:** Kartlar (`flashcard`, `quiz-card` vb.) tablet ekranlarında sınırsız esneyemez; `maxWidth: 580` ve responsive padding kurallarına uymak zorundadır.
- **Loader Standartları:** Ucuz, dönen daire spinner'lar yerine LearnAxia geometrisiyle uyumlu premium vektörel `BrandLoader` kullanılmalıdır.
