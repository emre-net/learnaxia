# Learnaxia Proje Kurallari

## Calisma Akisi

- Terminal komutlarini **her zaman zincirleme** calistir: `git add -A; git commit -m '...'; git push` gibi tek blok.
- `git add`, `git commit`, `git push` komutlarini **asla ayri ayri** calistirma, hepsini tek run_command cagrisinda birlestir.
- Birden fazla bagimsiz islem varsa (lint + build gibi) **ayni anda** baslat, sonuclari bekle.
- Railway deploy sonrasi `railway status` kontrolunu **ayni komut zincirinde** yap.
- Build/deploy basarisiz oldugunda hata loglarini **tek seferde** cek, teshis et, duzelt, push et, redeploy et.
- Dosya duzenleme + lint + test adimlarini **tek seferde** zincirle.

## Genel Kurallar

- Buyuk refactor yapma; kucuk ve guvenli degisiklikler uygula.
- Gizli bilgileri (.env, secret) commit etme.
- Mevcut endpoint isimlerini ve API sozlesmesini bozma.
- Her degisiklikten sonra ilgili dosya icin lint/typecheck calistir (zincirde).
- Kodu koru korune degistirme; once mevcut dosyalari dogrula.
