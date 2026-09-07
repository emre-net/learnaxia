# Learnaxia — Görsel Akış Şemaları

> Her tuş, her geçiş, her API çağrısı haritası. Son güncelleme: 17 Haziran 2026.
> 🟦 Ekran · 🟧 AI İşlemi · 🟩 Başarı · 🟥 Hata/Tehlike · ⬜ Aksiyon

---

## 1️⃣ AUTHENTICATION AKIŞI

```mermaid
flowchart TD
    APP([🚀 Uygulama Açılır]) --> TOKEN{Token\nvar mı?}

    TOKEN -->|Evet| PROFIL[Profil Fetch\n/mobile/user/profile]
    TOKEN -->|Hayır| LOGIN

    PROFIL -->|Başarılı| HOME[🏠 Ana Sayfa]
    PROFIL -->|Hata / Süresi dolmuş| REFRESH[Token Yenileme\n/mobile/refresh]
    REFRESH -->|Başarılı| HOME
    REFRESH -->|Hata| LOGIN

    LOGIN([🔐 Login Ekranı])
    LOGIN --> FORM_LOGIN[E-posta + Şifre Girişi]
    FORM_LOGIN --> BTN_LOGIN[Giriş Yap]
    BTN_LOGIN --> API_LOGIN[API: /mobile/login]
    API_LOGIN -->|✅ Başarılı| SAVE_TOKEN[JWT + RefreshToken\nSecureStore'a Kaydet]
    SAVE_TOKEN --> HOME
    API_LOGIN -->|❌ Hata| ERR_LOGIN[Alert: Geçersiz bilgiler]
    ERR_LOGIN --> FORM_LOGIN

    LOGIN --> TOGGLE[Hesap Oluştur'a Geç]
    TOGGLE --> FORM_REG[Ad + E-posta + Şifre]
    FORM_REG --> BTN_REG[Kayıt Ol]
    BTN_REG --> VAL{Validasyon\nmin 8 karakter}
    VAL -->|❌ Hata| ERR_VAL[Alert: Şifre 8 karakter]
    VAL -->|✅ Geçerli| API_REG[API: /mobile/register]
    API_REG -->|✅ Başarılı| SAVE_TOKEN
    API_REG -->|❌ Kullanıcı var| ERR_EXISTS[Alert: E-posta kayıtlı]

    LOGIN --> FORGOT[Şifremi Unuttum]
    FORGOT --> CHK_EMAIL{E-posta\ngirilmiş mi?}
    CHK_EMAIL -->|Hayır| ERR_NOEMAIL[Alert: Önce e-posta girin]
    CHK_EMAIL -->|Evet| API_FORGOT[API: /mobile/forgot-password]
    API_FORGOT --> MAIL_SENT[✅ Mail gönderildi]
```

---

## 2️⃣ MOBİL — ANA SAYFA & GÜNLÜK TEKRAR

```mermaid
flowchart TD
    HOME([🏠 Ana Sayfa])
    HOME --> STATS[4 İstatistik Kartı\nSüre · Modül · Soru · Doğruluk]
    HOME --> FOCUS[🎯 Focus Widget\nGünlük hedef / ilerleme]
    HOME --> DAILY_W[📅 Daily Review Widget\nBekleyen kart sayısı]
    HOME --> RECENT[Son Çalışılan Modüller\nYatay scroll]
    HOME --> PULL[Pull-to-Refresh]
    PULL --> RELOAD_API[API: /mobile/analytics\n+ /mobile/library/recent]

    DAILY_W --> BTN_DAILY[Başla]
    BTN_DAILY --> DAILY_SCR[📅 Günlük Tekrar\n/study/daily]
    DAILY_SCR --> SM2[SM-2 Vadesi Gelmiş\nKartlar Sıralanır]
    SM2 --> CARD_FLIP

    RECENT --> MODULE_CARD[Modül Kartına Bas]
    MODULE_CARD --> STUDY_SCR

    subgraph STUDY_SCR [📖 Çalışma Oturumu /study/id]
        CARD_FLIP[🎴 Kart Gösterilir\nSoru Yüzü]
        CARD_FLIP --> TAP_CARD[Karta / Ekrana Bas]
        TAP_CARD --> FLIP_ANIM[3D Flip Animasyonu 380ms]
        FLIP_ANIM --> ANS[Cevap Gösterilir]
        ANS --> Q1[❌ Bilmiyorum\nquality=1]
        ANS --> Q3[— Zordu\nquality=3]
        ANS --> Q5[✓✓ Kolay\nquality=5]
        Q1 --> SM2_UPDATE[API: /mobile/study/log\nSM-2 Güncellenir]
        Q3 --> SM2_UPDATE
        Q5 --> SM2_UPDATE
        SM2_UPDATE --> NEXT_CARD{Sonraki\nkart var mı?}
        NEXT_CARD -->|Evet| CARD_FLIP
        NEXT_CARD -->|Hayır| SESSION_END[🎉 Oturum Tamamlandı]
        SESSION_END --> SUMMARY[Doğru/Toplam/Doğruluk %]
        SUMMARY --> RETRY[Tekrar Çalış]
        SUMMARY --> BACK_LIB[Kütüphaneye Dön]
        RETRY --> CARD_FLIP
    end
```

---

## 3️⃣ MOBİL — KÜTÜPHANe

```mermaid
flowchart TD
    LIB([📚 Kütüphane])
    LIB --> TAB_M[Modüller Tab]
    LIB --> TAB_C[Koleksiyonlar Tab]
    LIB --> TAB_N[Notlar Tab]

    TAB_M --> SEARCH_M[Arama Çubuğu\nAnlık filtreleme]
    TAB_M --> MOD_CARD[Modül Kartı]
    MOD_CARD --> GO_STUDY[/study/id]
    TAB_M --> LOAD_MORE[Sonsuz Scroll\n12'şer yükleme]

    TAB_C --> COL_CARD[Koleksiyon Kartı]
    COL_CARD --> COL_DETAIL[/collections/id\nİçindeki modüller]
    COL_DETAIL --> MOD_IN_COL[Modül Kartı]
    MOD_IN_COL --> GO_STUDY
    TAB_C --> BTN_NEW_COL[+ Yeni Koleksiyon]
    BTN_NEW_COL --> NEW_COL_SCR[/collections/new\nBaşlık + Açıklama]
    NEW_COL_SCR --> CREATE_COL[Oluştur]
    CREATE_COL --> API_COL[API: POST /mobile/collections]
    API_COL -->|✅| BACK_LIB_COL[Kütüphaneye Dön]

    TAB_N --> NOTE_CARD[Not Kartı]
    NOTE_CARD --> NOTE_DETAIL[/notes/id\nİçerik görüntüle]
    NOTE_DETAIL --> EDIT_NOTE[Düzenle]
    NOTE_DETAIL --> DEL_NOTE[Sil]
    DEL_NOTE --> API_DEL_NOTE[API: DELETE /mobile/notes/id]
    TAB_N --> BTN_NEW_NOTE[+ Yeni Not]
    BTN_NEW_NOTE --> NEW_NOTE_SCR[/notes/new\nBaşlık + İçerik]
    NEW_NOTE_SCR --> SAVE_NOTE[Kaydet]
    SAVE_NOTE --> API_NOTE[API: POST /mobile/notes]
```

---

## 4️⃣ MOBİL — OLUŞTUR (AI Merkezi)

```mermaid
flowchart TD
    CREATE([➕ Oluştur Ekranı])

    CREATE --> CAM_BTN[📷 Fotoğraf Çek / Yükle]
    CAM_BTN --> PERM{Kamera\nİzni?}
    PERM -->|Verildi| CAM_OPEN[Kamera Açılır]
    PERM -->|Reddedildi| ERR_PERM[Alert: Kamera erişimi\ngerekli]
    CAM_OPEN --> TAKE_PHOTO[📸 Çek]
    CAM_OPEN --> GALLERY[Galeriden Seç]
    TAKE_PHOTO --> PREVIEW[Önizleme]
    GALLERY --> PREVIEW
    PREVIEW --> SEND_PHOTO[Gönder]
    SEND_PHOTO --> API_VISION[API: POST /mobile/ai/solve-photo\nGroq Vision]
    API_VISION -->|✅| SOLUTION_MODAL[SolutionModal\nSoru + AI Çözümü]
    API_VISION -->|❌ Rate Limit| ERR_RATE[Alert: Çok fazla istek]
    API_VISION -->|❌ Hata| ERR_VIS[Alert: Görüntü analiz edilemedi]
    SOLUTION_MODAL --> SAVE_AS_NOTE[Not Olarak Kaydet]
    SAVE_AS_NOTE --> NOTE_SCREEN[/notes/id]
    SOLUTION_MODAL --> CLOSE_MODAL[Kapat]

    CREATE --> DOC_BTN[📄 Belge Yükle]
    DOC_BTN --> DOC_PICK[DocumentPicker\nPDF / TXT]
    DOC_PICK --> API_EXTRACT[API: POST /mobile/file/extract\nMetin çıkar]
    API_EXTRACT --> API_GENNOTE[API: POST /mobile/ai/generate-note\nAI Not Üret]
    API_GENNOTE -->|✅| NOTE_SCREEN
    API_GENNOTE -->|❌| ERR_NOTE[Alert: Not üretilemedi]

    CREATE --> TOPIC_BTN[🧭 Konu Gir]
    TOPIC_BTN --> TOPIC_MODAL[TopicModal\nKonu başlığı gir min 3 karakter]
    TOPIC_MODAL --> BTN_CREATE_J[Oluştur]
    BTN_CREATE_J --> VAL_TOPIC{3 karakter\nvar mı?}
    VAL_TOPIC -->|Hayır| ERR_TOPIC[Alert: En az 3 karakter]
    VAL_TOPIC -->|Evet| API_GEN[API: /ai/learning-path/generate\nSyllabus üretilir]
    API_GEN --> API_START[API: /ai/learning-path/start\nYolculuk başlatılır]
    API_START -->|✅| JOURNEY_SCR[🧭 Journey Player\n/journey/id]
    API_START -->|❌| ERR_J[Alert: Yolculuk başlatılamadı]
```

---

## 5️⃣ MOBİL — PROFİL & AYARLAR

```mermaid
flowchart TD
    PROFILE([👤 Profil])
    PROFILE --> AVATAR[Avatar + Ad + E-posta]
    PROFILE --> SCORE_CARD[💎 Puan & Tier Kartı\nBu ay / Rozet]
    PROFILE --> STATS_P[İstatistikler\nSüre · Modül · Koleksiyon]
    PROFILE --> BTN_ANALYTICS[Detaylı Analiz]
    BTN_ANALYTICS --> ANALYTICS_SCR[📊 Analiz Ekranı\nGrafik + Modül bazlı]

    PROFILE --> SETTINGS_SECTION[⚙️ Ayarlar]

    SETTINGS_SECTION --> LANG_BTN[Dil]
    LANG_BTN --> LANG_SHEET[ActionSheetIOS/Alert\nTürkçe · English]
    LANG_SHEET --> SET_LANG[Dil Güncellenir]
    SET_LANG --> API_LANG[API: PATCH /mobile/user/account/language]

    SETTINGS_SECTION --> NOTIF_BTN[Bildirimler]
    NOTIF_BTN --> PERM_CHECK{Bildirim\nİzni?}
    PERM_CHECK -->|Verilmiş| SYS_SETTINGS[Sistem Ayarlarına Aç]
    PERM_CHECK -->|Reddedilmiş| NOTIF_ALERT[Alert: Ayarları Aç]
    NOTIF_ALERT --> SYS_SETTINGS

    SETTINGS_SECTION --> PRIVACY_BTN[Gizlilik Politikası]
    PRIVACY_BTN --> OPEN_URL[learnaxia.com/privacy]
    SETTINGS_SECTION --> TERMS_BTN[Kullanım Şartları]
    TERMS_BTN --> OPEN_URL2[learnaxia.com/terms]

    PROFILE --> LOGOUT_BTN[🚪 Çıkış Yap]
    LOGOUT_BTN --> LOGOUT_CONFIRM[Onay Alert]
    LOGOUT_CONFIRM -->|İptal| PROFILE
    LOGOUT_CONFIRM -->|Onayla| CLEAR_TOKEN[Token Silinir\nSecureStore temizlenir]
    CLEAR_TOKEN --> LOGIN_SCR[🔐 Login Ekranı]

    PROFILE --> DELETE_BTN[🗑️ Hesabı Sil]
    DELETE_BTN --> DEL_WARN[⚠️ Uyarı Alert\nGeri alınamaz!]
    DEL_WARN -->|İptal| PROFILE
    DEL_WARN -->|Onayla| API_DEL[API: DELETE /mobile/user/account\nSoft delete 30 gün]
    API_DEL -->|✅| CLEAR_TOKEN
    API_DEL -->|❌| ERR_DEL[Alert: Hesap silinemedi]
```

---

## 6️⃣ WEB — DASHBOARD

```mermaid
flowchart TD
    LANDING([🌐 Landing Page /])
    LANDING --> BTN_LOGIN_W[Giriş Yap]
    LANDING --> BTN_TRY[Başla / Ücretsiz Dene]
    BTN_LOGIN_W --> LOGIN_W[/login]
    BTN_TRY --> LOGIN_W

    LOGIN_W --> CRED[E-posta + Şifre]
    LOGIN_W --> GOOGLE[Google ile Giriş]
    CRED --> NEXTAUTH[NextAuth Credentials]
    GOOGLE --> OAUTH[Google OAuth Callback]
    NEXTAUTH --> DASH
    OAUTH --> DASH

    LOGIN_W --> FORGOT_W[Şifremi Unuttum\n/forgot-password]
    FORGOT_W --> RESET_MAIL[Resend → Doğrulama maili]
    RESET_MAIL --> VERIFY[/auth/verify?token=...]
    VERIFY --> DASH

    LOGIN_W --> REGISTER_W[Kayıt Ol]
    REGISTER_W --> REG_FORM[Kullanıcı adı + E-posta + Şifre]
    REG_FORM --> VERIFY_MAIL[Doğrulama maili gönderilir]
    VERIFY_MAIL --> VERIFY

    DASH([🏠 Dashboard\n/dashboard])
    DASH --> ONBOARDING{İlk giriş\nmi?}
    ONBOARDING -->|Evet| ONBOARD_MODAL[4 Adımlı Onboarding Modal]
    ONBOARD_MODAL --> CLOSE_ONBOARD[Başla → Modal kapanır\nonboardingComplete=true API'ye]
    ONBOARDING -->|Hayır| DASH_CONTENT

    DASH --> DASH_CONTENT[4 İstatistik · Focus Widget\nDaily Review · Score Card]
    DASH_CONTENT --> DAILY_BTN_W[Günlük Tekrarı Başlat]
    DAILY_BTN_W --> STUDY_DAILY_W[/study/daily]
    DASH_CONTENT --> LEADERBOARD_BTN[Liderboard]
    LEADERBOARD_BTN --> LEADER_W[/dashboard/leaderboard]
```

---

## 7️⃣ WEB — MODÜL OLUŞTURMA & YÖNETİM

```mermaid
flowchart TD
    CREATE_W([✏️ Modül Oluştur\n/dashboard/create])

    CREATE_W --> MANUAL_W[Manuel Ekle\nSoru + Cevap formu]
    MANUAL_W --> SAVE_ITEM[Kaydet]
    SAVE_ITEM --> API_ITEM[API: POST /modules/id/items]

    CREATE_W --> AI_W[AI ile Üret]
    AI_W --> TOPIC_W[Konu gir]
    TOPIC_W --> API_GEN_W[API: /ai/generate\nGroq LLaMA]
    API_GEN_W --> CHECKER[Checker AI\nKalite Doğrulama max 3 tur]
    CHECKER --> PREVIEW_W[Kartlar Önizleme]
    PREVIEW_W --> ACCEPT[Kabul Et]
    ACCEPT --> API_SAVE_W[API: POST /modules/id/items]

    CREATE_W --> PDF_W[PDF Yükle]
    PDF_W --> API_EXT_W[API: /file/extract\nMetin çıkar]
    API_EXT_W --> AI_W

    CREATE_W --> VIS[Görünürlük\nPRIVATE / PUBLIC]
    CREATE_W --> PUBLISH[Yayınla]
    PUBLISH --> API_MOD[API: POST /modules]
    API_MOD -->|✅| LIB_W[Kütüphane'ye gider]

    LIB_W --> MOD_DETAIL_W[Modül Detay\n/dashboard/modules/id]
    MOD_DETAIL_W --> EDIT_CARD[Kart Düzenle → inline]
    MOD_DETAIL_W --> DEL_CARD[Kart Sil\nAPI DELETE /modules/id/items/itemId]
    MOD_DETAIL_W --> ADD_CARD[+ Kart Ekle]
    MOD_DETAIL_W --> FORK_W[Fork → Kütüphaneye kopyala\nSAVED rolü]
    MOD_DETAIL_W --> DEL_MOD[Modülü Sil\nOnay → API DELETE]
    MOD_DETAIL_W --> STUDY_W[Çalış → Study Player]
```

---

## 8️⃣ WEB — JOURNEY PLAYER & KEŞFEt

```mermaid
flowchart TD
    LEARNING_W([🧭 Öğrenme\n/dashboard/learning])
    LEARNING_W --> JOURNEY_LIST[Yolculuk Listesi]
    JOURNEY_LIST --> JOURNEY_DETAIL[Journey Player]

    LEARNING_W --> NEW_JOURNEY[+ Yeni Yolculuk]
    NEW_JOURNEY --> TOPIC_J[Konu gir]
    NEW_JOURNEY --> DEPTH[Derinlik Seç\nbasic / standard / deep]
    TOPIC_J --> API_JOUR[API: /ai/learning-path/generate\nSyllabus üretilir]
    API_JOUR --> API_START_J[API: /ai/learning-path/start\nYolculuk kaydedilir]
    API_START_J --> JOURNEY_DETAIL

    JOURNEY_DETAIL --> SYLLABUS[Syllabus görünümü\nKonu başlıkları]
    JOURNEY_DETAIL --> SLIDE_VIEW[Slayt Okuyucu\nHTML içerik]
    SLIDE_VIEW --> PREV[← Önceki]
    SLIDE_VIEW --> NEXT[→ Sonraki Slayt]
    SLIDE_VIEW --> PEEK[Peeking Sorusu]
    PEEK --> SHOW_ANS_J[Cevabı Gör]
    SLIDE_VIEW --> REGEN[Slaydı Yeniden Oluştur\nAPI: /ai/learning-path/generate-slide]
    SLIDE_VIEW --> MODIFY[Konuyu Değiştir\nAPI: /ai/learning-path/modify]
    SLIDE_VIEW --> COMPLETE[Tamamla\nAPI: /ai/learning-path/complete]
    COMPLETE --> SCORE_UP[Puan Güncellenir]

    DISCOVER_W([🔍 Keşfet\n/dashboard/discover])
    DISCOVER_W --> SEARCH_W[Arama 300ms debounce]
    DISCOVER_W --> FILTER_W[Tür / Sıralama Filtresi]
    DISCOVER_W --> DISC_CARD[İçerik Kartı]
    DISC_CARD --> SAVE_DISC[Kaydet\nAPI: /modules/id/save]
    DISC_CARD --> STUDY_DISC[Çalış → Study Player]
    DISC_CARD --> FORK_DISC[Fork → Düzenlenebilir kopya]
```

---

## 9️⃣ WEB — LIDERBOARD, ANALİTİK, AYARLAR

```mermaid
flowchart TD
    LEADER_W([🏆 Liderboard\n/dashboard/leaderboard])
    LEADER_W --> TIME_FILTER[Bu Ay / Tüm Zamanlar]
    LEADER_W --> RANK_TABLE[Sıralama Tablosu\nfinalScore'a göre]
    RANK_TABLE --> USER_ROW[Kullanıcı satırına bas]
    USER_ROW --> USER_PROFILE_W[Profil Sayfası]
    LEADER_W --> MY_RANK[Kendi sıran\ngösterilir]

    ANALYTICS_W([📊 Analitik\n/dashboard/analytics])
    ANALYTICS_W --> SUMMARY_W[Süre · Çözülen · Doğruluk · Streak]
    ANALYTICS_W --> DAILY_CHART[Günlük Aktivite Grafiği\nson 30 gün]
    ANALYTICS_W --> MOD_STATS[Modül Bazlı Performans]
    MOD_STATS --> GO_MOD[Modüle git]

    SETTINGS_W([⚙️ Ayarlar\n/dashboard/settings])
    SETTINGS_W --> PROF_EDIT[Profil Düzenleme]
    PROF_EDIT --> UPDATE_AVATAR[Avatar değiştir]
    PROF_EDIT --> UPDATE_HANDLE[Kullanıcı adı güncelle]
    PROF_EDIT --> UPDATE_LANG[Dil: TR / EN]
    PROF_EDIT --> SAVE_PROF[Kaydet\nAPI: PATCH /user/profile]

    SETTINGS_W --> ACC_EDIT[Hesap]
    ACC_EDIT --> CHANGE_EMAIL[E-posta değiştir]
    ACC_EDIT --> CHANGE_PASS[Şifre değiştir]

    SETTINGS_W --> DANGER_W[⚠️ Tehlike Bölgesi]
    DANGER_W --> DELETE_ACC_W[Hesabı Sil]
    DELETE_ACC_W --> CONFIRM_DEL_W[Onay]
    CONFIRM_DEL_W --> API_DEL_W[API: DELETE /user/account]
    API_DEL_W --> LOGOUT_W[Oturum sonlandırılır]
```

---

## 🔟 AI KATMANI — TAM AKIŞ

```mermaid
flowchart TD
    AI_ENTRY([🤖 AI İstek Gelir])

    AI_ENTRY --> RL_CHECK{Rate Limit\nKontrolü}
    RL_CHECK -->|❌ Aşıldı| HTTP_429[429 Too Many Requests]
    RL_CHECK -->|✅ Geçti| AUTH_CHECK{Auth\nKontrolü}
    AUTH_CHECK -->|❌ Yetkisiz| HTTP_401[401 Unauthorized]
    AUTH_CHECK -->|✅ Yetkili| AI_ROUTE{Hangi AI?}

    AI_ROUTE --> GEN_FLASH[Flashcard Üretimi\n/ai/generate]
    AI_ROUTE --> GEN_NOTE[Not Üretimi\n/ai/generate-note]
    AI_ROUTE --> SOLVE_PH[Soru Çözümü\n/ai/solve-photo]
    AI_ROUTE --> JOURNEY[Yolculuk Oluşturma\n/ai/learning-path/generate]

    GEN_FLASH --> GROQ_1[Groq API\nLLaMA 3.1]
    GROQ_1 --> PARSE_1[JSON Parse]
    PARSE_1 --> CHECKER_AI{Checker AI\nKalite Kontrol}
    CHECKER_AI -->|✅ Onay| RETURN_ITEMS[Kartlar Döndürülür]
    CHECKER_AI -->|❌ Red| REGEN_AI[Yeniden Üret feedback ile]
    REGEN_AI --> GROQ_1
    CHECKER_AI -->|Max 3 tur| RETURN_ITEMS

    GEN_NOTE --> GROQ_2[Groq API\nÖzetleme prompt]
    GROQ_2 --> NOTE_HTML[HTML Not içeriği]
    NOTE_HTML --> SAVE_DB_NOTE[DB'ye kaydedilir]

    SOLVE_PH --> GROQ_VIS[Groq Vision\nllava/mixtral-vision]
    GROQ_VIS --> SOLUTION[Çözüm metni]
    SOLUTION --> SAVE_SOLVED[SolvedQuestion DB kaydı]

    JOURNEY --> GROQ_J[Groq API\nSyllabus üretimi]
    GROQ_J --> SYLLABUS_J[Syllabus JSON]
    SYLLABUS_J --> SAVE_JOURNEY[LearningJourney DB kaydı]
    SAVE_JOURNEY --> GEN_SLIDES[Slaytlar Arka Planda Üretilir]
    GEN_SLIDES --> SLIDE_SAVE[LearningSlide kayıtları]

    HTTP_429 --> LOG_SYS[SystemLog'a Yaz]
    HTTP_401 --> LOG_SYS
```

---

## 1️⃣1️⃣ PUANLAMA SİSTEMİ — ARKA PLAN

```mermaid
flowchart TD
    CRON([⏰ Gece 02:00 UTC\nCron Tetiklenir])
    CRON --> AUTH_CRON{x-cron-secret\nDoğru mu?}
    AUTH_CRON -->|❌| BLOCK_CRON[403 Forbidden]
    AUTH_CRON -->|✅| FIND_USERS[Dün aktif kullanıcılar bulunur\nStudySessionLog + LearningSession]

    FIND_USERS --> BATCH[50'şer Batch İşleme]

    BATCH --> CALC[saveAndRecalculate per user]

    subgraph CALC [Her Kullanıcı İçin Hesaplama]
        V1[Çalışma Süresi]
        V2[İncelenen Kart]
        V3[Doğruluk Oranı]
        V4[SM-2 Uyum Skoru]
        V5[Oturum Yayılımı]
        V6[Content Adoption]
        V7[İçerik Kalitesi]
        AG1[Hız Penaltısı]
        AG2[Desen Penaltısı]
        AG1 --> ANTI[Anti-Gaming Faktörü\n= 1 - hız - desen]
        AG2 --> ANTI
        V1 --> RAW[rawScore]
        V2 --> RAW
        V3 --> RAW
        V4 --> RAW
        V5 --> RAW
        V6 --> RAW
        V7 --> RAW
        RAW --> QUALITY[× qualityMultiplier]
        QUALITY --> CONSIST[× consistencyCoef]
        CONSIST --> ANTI2[× antiGamingFactor]
        ANTI --> ANTI2
        ANTI2 --> FINAL[finalScore]
        FINAL --> TIER{Tier Belirle}
        TIER --> SEED[🌱 seed]
        TIER --> SPROUT[🌿 sprout]
        TIER --> SAPLING[🌳 sapling]
        TIER --> OAK[🌲 oak]
        TIER --> PEAK[⭐ peak]
        TIER --> APEX[👑 apex]
    end

    CALC --> UPSERT[UserScore DB Upsert\nuserId + period]
    UPSERT --> NEXT_BATCH{Sonraki\nbatch?}
    NEXT_BATCH -->|Evet| WAIT_200MS[200ms bekleme\nDB throttle koruması]
    WAIT_200MS --> BATCH
    NEXT_BATCH -->|Hayır| DONE[✅ Cron Tamamlandı]
```

---

## 📌 EKSİKLİK / GELİŞTİRME İPUÇLARI

---

## 1️⃣2️⃣ WEB — ATÖlye (Create Hub)

```mermaid
flowchart TD
    ATOLYE([🔧 Atölye\n/dashboard/create])

    ATOLYE --> MOD_SEC[📚 Modüller Bölümü]
    MOD_SEC --> MANUAL_MOD[Manuel Oluştur\n→ /dashboard/create/manual]
    MOD_SEC --> AI_MOD[Zeka ile Üret\n→ /dashboard/create/ai]

    MANUAL_MOD --> FORM_MOD[Başlık + Tür seç\nFlashcard / Quiz / Reading]
    FORM_MOD --> ADD_ITEMS[Kart Ekle\nSoru + Cevap]
    ADD_ITEMS --> PUB_PRIV[Görünürlük: PRIVATE / PUBLIC]
    PUB_PRIV --> PUBLISH_MOD[Yayınla → API POST /modules]

    AI_MOD --> AI_INPUT[Metin veya PDF gir / yükle]
    AI_INPUT --> API_GEN_AI[API: /ai/generate\nGroq LLaMA + Checker AI]
    API_GEN_AI --> PREVIEW_AI[Kartlar önizleme]
    PREVIEW_AI --> ACCEPT_AI[Kabul Et → modüle eklenir]
    PREVIEW_AI --> REJECT_AI[Reddet → yeniden üret]

    ATOLYE --> COL_SEC[📁 Koleksiyonlar Bölümü]
    COL_SEC --> NEW_COL_W[Yeni Koleksiyon\n→ /dashboard/collections/new]
    NEW_COL_W --> COL_FORM[Başlık + Açıklama\n+ Görünürlük]
    COL_FORM --> CREATE_COL_W[Oluştur → API POST /collections]

    ATOLYE --> NOTE_SEC[📝 Notlar Bölümü]
    NOTE_SEC --> MANUAL_NOTE[Not Yaz\n→ /dashboard/create/manual-note]
    NOTE_SEC --> AI_NOTE_W[PDF'den Not Çıkar\n→ /dashboard/create/ai-notes]

    MANUAL_NOTE --> EDITOR[Zengin Metin Editörü]
    EDITOR --> SAVE_NOTE_W[Kaydet → API POST /notes]

    AI_NOTE_W --> UPLOAD_PDF[PDF Yükle]
    UPLOAD_PDF --> API_EXT_W2[API: /file/extract\nMetin çıkar]
    API_EXT_W2 --> API_NOTE_W2[API: /ai/generate-note\nAI Not Üret]
    API_NOTE_W2 --> NOTE_DETAIL_W[Not Detayına Git]

    ATOLYE --> QUICK_TOOLS[⚡ Hızlı Araçlar]
    QUICK_TOOLS --> SOLVE_PHOTO_W[📷 Fotoğraftan Soru Çöz\n→ /dashboard/create/solve-photo]
    QUICK_TOOLS --> JOURNEY_W2[🧭 Öğrenme Rotası\n→ /dashboard/learning/create]

    SOLVE_PHOTO_W --> UPLOAD_IMG[Görüntü Yükle]
    UPLOAD_IMG --> API_VIS_W[API: /ai/solve-photo\nGroq Vision]
    API_VIS_W --> SHOW_SOL[Çözüm Gösterilir]
    SHOW_SOL --> SAVE_SOL_NOTE[Not Olarak Kaydet]
```

---

## 1️⃣3️⃣ WEB — PROFİL SAYFASI

```mermaid
flowchart TD
    PROF_W([👤 Profil\n/dashboard/profile])

    PROF_W --> AVATAR_W[Avatar + Handle + Katılma Tarihi]
    PROF_W --> STATS_CARDS[3 İstatistik Kartı\nÜretimler · Koleksiyonlar · Başarı Puanı]

    PROF_W --> EDIT_BTN[Profili Düzenle]
    EDIT_BTN --> EDIT_DIALOG[EditProfileDialog Modal]
    EDIT_DIALOG --> UPD_HANDLE[Handle güncelle]
    EDIT_DIALOG --> UPD_AVATAR_W[Avatar güncelle]
    EDIT_DIALOG --> SAVE_PROF_W[Kaydet → API PATCH /user/profile]

    PROF_W --> SHARE_BTN[Paylaş]
    SHARE_BTN --> SHARE_URL[Profil URL kopyalanır\nlearnaxia.com/@handle]

    PROF_W --> PROF_TABS[3 Tab]
    PROF_TABS --> TAB_MOD_P[Üretimlerim\nRole=OWNER modüller]
    PROF_TABS --> TAB_COL_P[Koleksiyonlarım]
    PROF_TABS --> TAB_NOTE_P[Notlarım]

    TAB_MOD_P --> MOD_CARD_P[Modül Kartına Bas]
    MOD_CARD_P --> MOD_DETAIL_P[Modül Detay / Study]
    TAB_MOD_P --> EMPTY_MOD[Boşsa → Atölye'ye Git]
    EMPTY_MOD --> ATOLYE_LINK[/dashboard/create]

    TAB_NOTE_P --> NOTE_CARD_P[Not Kartı]
    NOTE_CARD_P --> NOTE_DETAIL_P[Not Detay]
    TAB_NOTE_P --> EMPTY_NOTE[Boşsa → Not Yaz]
    EMPTY_NOTE --> MANUAL_NOTE_LINK[/dashboard/create/manual-note]
```

---

## 1️⃣4️⃣ WEB — KOLEKSİYON AKIŞI

```mermaid
flowchart TD
    COL_W([📁 Koleksiyonlar\n/dashboard/collections])

    COL_W --> COL_LIST_W[Koleksiyon Listesi]
    COL_LIST_W --> COL_CARD_W[Koleksiyon Kartına Bas]
    COL_CARD_W --> COL_DETAIL_W[/dashboard/collections/id\nİçindeki modüller]
    COL_DETAIL_W --> ADD_MOD_COL[Modül Ekle]
    COL_DETAIL_W --> REM_MOD_COL[Modülü Kaldır]
    COL_DETAIL_W --> MOD_IN_COL_W[Modüle Bas → Study Player]
    COL_DETAIL_W --> DEL_COL_W[Koleksiyonu Sil]
    DEL_COL_W --> CONFIRM_COL[Onay → API DELETE /collections/id]

    COL_W --> NEW_COL_BTN[+ Yeni Koleksiyon]
    NEW_COL_BTN --> NEW_COL_FORM[/dashboard/collections/new\nBaşlık + Açıklama + Görünürlük]
    NEW_COL_FORM --> CREATE_COL_BTN[Oluştur → API POST /collections]
    CREATE_COL_BTN --> COL_DETAIL_W
```

---

## 1️⃣5️⃣ WEB — ADMİN PANELİ (/admin)

```mermaid
flowchart TD
    ADMIN_GATE{ADMIN\nRolü Kontrolü}
    ADMIN_GATE -->|❌ Yetkisiz| REDIRECT_DASH[/dashboard'a yönlendir]
    ADMIN_GATE -->|✅ ADMIN| ADMIN_HOME

    ADMIN_HOME([🔧 Admin Dashboard\n/admin])
    ADMIN_HOME --> ADMIN_STATS[4 Kart\nKullanıcı · Modül · Kart · Kütüphane]
    ADMIN_HOME --> HEALTH[Sistem Sağlığı\nDB Bağlantı · Auth · Environment]

    ADMIN_HOME --> NAV_MODULES[Modüller]
    NAV_MODULES --> ADMIN_MODS[/admin/modules\nTüm modüller listesi]
    ADMIN_MODS --> MOD_DELETE_A[Modül Sil]
    ADMIN_MODS --> MOD_TOGGLE_PUB[Görünürlük Değiştir]

    ADMIN_HOME --> NAV_USERS[Kullanıcılar]
    NAV_USERS --> ADMIN_USERS[/admin/users\nKullanıcı listesi]
    ADMIN_USERS --> CHANGE_ROLE[Rol Değiştir\nUSER → ADMIN]
    ADMIN_USERS --> BAN_USER[Kullanıcı Banlama]

    ADMIN_HOME --> NAV_SYSTEM[Sistem]
    NAV_SYSTEM --> ADMIN_SYSTEM[/admin/system\nLogs + AI Logs]
    ADMIN_SYSTEM --> VIEW_LOGS[/admin/system/logs\nSystemLog kayıtları]
    ADMIN_SYSTEM --> VIEW_AI_LOGS[/admin/system/ai-logs\nAI istek logları]
    VIEW_LOGS --> FILTER_LOGS[Level filtresi\nERROR · WARN · INFO]
    VIEW_LOGS --> CLEAR_LOGS[Logları Temizle]

    ADMIN_HOME --> NAV_TOOLS[Araçlar]
    NAV_TOOLS --> ADMIN_TOOLS[/admin/tools\nBakım araçları]
    ADMIN_TOOLS --> REPAIR_BTN[🔧 Reputation Repair\nEksik kütüphane kayıtlarını onar]
    REPAIR_BTN --> CONFIRM_REPAIR[Onayla → repairLibrariesAction]
    CONFIRM_REPAIR --> REPAIR_DONE[✅ Kütüphaneler onarıldı]

    ADMIN_TOOLS --> RESET_BTN[🗑️ Veritabanını Sıfırla\nKullanıcılar hariç]
    RESET_BTN --> CONFIRM_RESET[⚠️ Onayla → resetContentAction]
    CONFIRM_RESET --> RESET_DONE[✅ İçerik silindi]

    ADMIN_TOOLS --> SEED_BTN[🌱 Test Verisi Üret\n6 modül + 5 koleksiyon + 3 not]
    SEED_BTN --> CONFIRM_SEED[Onayla → seedTestDataAction]
    CONFIRM_SEED --> SEED_DONE[✅ Test verisi eklendi]
```

---

## 📌 EKSİKLİK / GELİŞTİRME İPUÇLARI

> Bu şemalar üzerinden eksikleri kolayca görebilirsin:

| Alan | Mevcut | Eksik / Geliştirilebilir |
|------|--------|---------------------------|
| 📱 Mobil Auth | E-posta + Şifre, Şifre sıfırlama | Google ile Giriş (mobilde yok) |
| 📱 Create Tab | PDF, Fotoğraf, Konu | Ses kaydından not üretimi |
| 📱 Study | Flashcard (SM-2) | Quiz modu mobilde eksik |
| 📱 Profile | Analitik bağlantısı | Rozet detay ekranı yok |
| 📱 modal.tsx | Mevcut ama boş | Henüz kullanılmıyor, placeholder |
| 🌐 Atölye | 6 aksiyon tam | — |
| 🌐 Profil | 3 tab + paylaş + düzenle | Başarı Puanı kartı "çok yakında" |
| 🌐 Koleksiyonlar | CRUD tam | Koleksiyona toplu modül ekleme yok |
| 🌐 Web Keşfet | Modül + Koleksiyon | Kullanıcı profili görüntüleme yok |
| 🌐 Notlar | AI + Manuel | Notlar arası bağlantı/etiket yok |
| 🤖 AI | 4 farklı özellik | Push bildirim sistemi yok |
| 💎 Skor | Aylık hesaplama | Gerçek zamanlı güncelleme yok |
| 📊 Analitik | Grafik + modül bazlı | Zayıflık analizi eksik |
| 🔧 Admin | Dashboard + 4 bölüm | Admin activity log boş (placeholder) |

