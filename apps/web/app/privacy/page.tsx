import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gizlilik Politikası | Learnaxia",
    description: "Learnaxia gizlilik politikası — kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgi.",
};

export default function PrivacyPage() {
    const lastUpdated = "17 Haziran 2026";

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground antialiased">
            <Navbar />
            <main className="flex-1 pt-32 pb-20">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <h1 className="text-4xl font-black mb-2">Gizlilik Politikası</h1>
                    <p className="text-muted-foreground mb-12 text-sm">Son güncelleme: {lastUpdated}</p>

                    <div className="space-y-10 text-muted-foreground leading-relaxed">

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">1. Genel Bilgi</h2>
                            <p>
                                Learnaxia (&quot;biz&quot;, &quot;platform&quot;) olarak kullanıcılarımızın gizliliğini en üst düzeyde korumayı taahhüt ediyoruz.
                                Bu Gizlilik Politikası, Learnaxia web sitesi (<strong>learnaxia.com</strong>) ve mobil uygulamasını
                                kullanırken hangi kişisel verilerin toplandığını, nasıl kullanıldığını ve haklarınızın neler olduğunu açıklamaktadır.
                            </p>
                            <p className="mt-3">
                                Bu politika; Türkiye Cumhuriyeti <strong>6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK)</strong> ve
                                Avrupa Birliği <strong>Genel Veri Koruma Yönetmeliği (GDPR)</strong> kapsamında hazırlanmıştır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">2. Veri Sorumlusu</h2>
                            <p>
                                Kişisel verilerinizin işlenmesinden sorumlu veri sorumlusu Learnaxia&apos;dır.
                                İletişim için: <strong>hello@learnaxia.com</strong>
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">3. Toplanan Kişisel Veriler</h2>
                            <p className="mb-3">Platformumuzu kullanırken aşağıdaki veriler toplanabilir:</p>

                            <h3 className="text-lg font-semibold text-foreground mb-2">a) Hesap Bilgileri</h3>
                            <ul className="list-disc list-inside space-y-1 mb-4">
                                <li>Ad ve soyad</li>
                                <li>E-posta adresi</li>
                                <li>Profil fotoğrafı (Google ile girişte)</li>
                                <li>Kullanıcı adı (handle)</li>
                                <li>Şifre (bcrypt ile şifrelenmiş — asla düz metin olarak saklanmaz)</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-foreground mb-2">b) Öğrenme Aktivite Verileri</h3>
                            <ul className="list-disc list-inside space-y-1 mb-4">
                                <li>Oluşturduğunuz modüller, koleksiyonlar, notlar ve journey içerikleri</li>
                                <li>Çalışma oturumu süreleri ve zamanlamaları</li>
                                <li>Kart tekrar sonuçları ve doğruluk oranları</li>
                                <li>SM-2 (spaced repetition) algoritması verileri</li>
                                <li>AI özelliklerini kullandığınızda girdiğiniz içerikler</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-foreground mb-2">c) Momentum (Puanlama) Sistemi Verileri</h3>
                            <ul className="list-disc list-inside space-y-1 mb-4">
                                <li>Aylık çalışma dakikaları, kart sayısı, doğruluk oranı</li>
                                <li>Aktif gün sayısı ve çalışma düzenliliği</li>
                                <li>İçerik üretim ve kullanım istatistikleri</li>
                                <li>Tier (seviye) ve rozet bilgileri</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-foreground mb-2">d) Teknik Veriler</h3>
                            <ul className="list-disc list-inside space-y-1">
                                <li>IP adresi (güvenlik ve rate limiting amacıyla)</li>
                                <li>Tarayıcı/cihaz bilgileri (hata günlükleri için)</li>
                                <li>Oturum çerezleri</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">4. Verilerin Kullanım Amaçları</h2>
                            <p className="mb-3">Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Hesabınızı oluşturmak ve güvenli tutmak</li>
                                <li>Öğrenme deneyiminizi kişiselleştirmek</li>
                                <li>SM-2 algoritmasıyla tekrar zamanlamalarını hesaplamak</li>
                                <li>Momentum puanı ve liderboard sıralamalarını hesaplamak</li>
                                <li>Platform güvenliğini sağlamak (fraud tespiti dahil)</li>
                                <li>Teknik sorunları tespit edip çözmek</li>
                                <li>Platformla ilgili kritik bildirimleri iletmek</li>
                                <li>Yasal yükümlülükleri yerine getirmek</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">5. Hukuki Dayanak</h2>
                            <p>Verilerinizin işlenmesi aşağıdaki hukuki dayanıklara sahiptir:</p>
                            <ul className="list-disc list-inside space-y-2 mt-3">
                                <li><strong>Sözleşmenin ifası:</strong> Hesap oluşturma ve platform hizmetlerinin sunulması</li>
                                <li><strong>Meşru menfaat:</strong> Platform güvenliği, hata yönetimi, sahtekarlık önleme</li>
                                <li><strong>Açık rıza:</strong> Liderboard profil görünürlüğü gibi opsiyonel özellikler</li>
                                <li><strong>Yasal yükümlülük:</strong> İlgili mevzuatın gerektirdiği durumlarda</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">6. Yapay Zeka (AI) ve Verileriniz</h2>
                            <p className="mb-3">
                                Learnaxia, içerik oluşturma özelliklerinde Groq AI API&apos;sini kullanmaktadır.
                                AI özelliklerini kullandığınızda girdiğiniz metin ve içerikler Groq&apos;un sunucularına iletilir.
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>AI modelleri içeriklerinizi model eğitimi için kullanmaz (Groq API koşullarına tabidir)</li>
                                <li>Üretilen içerikler doğrudan hesabınıza kaydedilir</li>
                                <li>Hassas kişisel bilgileri AI alanlarına girmemenizi öneririz</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">7. Üçüncü Taraf Hizmet Sağlayıcılar</h2>
                            <p className="mb-3">Aşağıdaki üçüncü taraf hizmetlerle çalışmaktayız:</p>
                            <div className="space-y-3">
                                <div>
                                    <strong className="text-foreground">Google OAuth</strong>
                                    <span className="text-sm ml-2">— Google hesabıyla giriş için; Google Gizlilik Politikası geçerlidir.</span>
                                </div>
                                <div>
                                    <strong className="text-foreground">Groq AI</strong>
                                    <span className="text-sm ml-2">— Yapay zeka içerik üretimi için.</span>
                                </div>
                                <div>
                                    <strong className="text-foreground">Resend</strong>
                                    <span className="text-sm ml-2">— E-posta bildirimleri ve şifre sıfırlama için.</span>
                                </div>
                                <div>
                                    <strong className="text-foreground">Railway</strong>
                                    <span className="text-sm ml-2">— Veritabanı hosting (PostgreSQL).</span>
                                </div>
                            </div>
                            <p className="mt-3 text-sm">
                                Bu hizmet sağlayıcılar yalnızca hizmet amaçlı veri işler; verilerinizi kendi amaçları için kullanamazlar.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">8. Veri Saklama Süreleri</h2>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Aktif hesap verileri: Hesap aktif olduğu sürece</li>
                                <li>Silinen hesap verileri: Silme talebinden 30 gün sonra kalıcı olarak kaldırılır</li>
                                <li>Sistem günlükleri (hata kayıtları): 90 gün</li>
                                <li>Çalışma oturumu logları: 12 ay (Momentum skoru hesabı için)</li>
                                <li>Yasal zorunluluk gerektirdiği durumlarda ilgili mevzuatta belirtilen süre</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">9. Çerezler (Cookies)</h2>
                            <p className="mb-3">Platformumuz yalnızca işlevsel çerezler kullanmaktadır:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li><strong>Oturum çerezi:</strong> Güvenli girişi sürdürmek için zorunludur</li>
                                <li><strong>Tema tercihi:</strong> Karanlık/aydınlık mod tercihini hatırlatır</li>
                                <li><strong>Dil tercihi:</strong> Seçtiğiniz dili kaydeder</li>
                            </ul>
                            <p className="mt-3">
                                Analitik veya reklam amacıyla üçüncü taraf çerez kullanılmamaktadır.
                                Tarayıcı ayarlarınızdan çerezleri engelleyebilirsiniz, ancak bu durumda oturum açma özelliği çalışmaz.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">10. Gizlilik Kontrolleri ve Liderboard</h2>
                            <p>
                                Hesap ayarlarınızdan liderboard görünürlüğünüzü kontrol edebilirsiniz:
                            </p>
                            <ul className="list-disc list-inside space-y-1 mt-3">
                                <li>Gizlilik modunda yalnızca Momentum puanı ve tier görünür; adınız/handle&apos;ınız gizlenir</li>
                                <li>Görünür metrikler (dakika, kart sayısı) isteğe bağlı paylaşılır</li>
                                <li>Algoritma ağırlıkları ve gizli sinyal skorları hiçbir zaman gösterilmez</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">11. Kullanıcı Hakları</h2>
                            <p className="mb-3">KVKK ve GDPR kapsamında aşağıdaki haklara sahipsiniz:</p>
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>Erişim hakkı:</strong> Hakkınızda işlenen verileri talep edebilirsiniz</li>
                                <li><strong>Düzeltme hakkı:</strong> Yanlış veya eksik verilerinizin düzeltilmesini isteyebilirsiniz</li>
                                <li><strong>Silme hakkı:</strong> Hesabınızı ve verilerinizi silebilirsiniz (uygulama ayarları veya hello@learnaxia.com üzerinden)</li>
                                <li><strong>Taşınabilirlik hakkı:</strong> Verilerinizin dışa aktarılmasını talep edebilirsiniz</li>
                                <li><strong>İtiraz hakkı:</strong> Meşru menfaate dayanan işlemlere itiraz edebilirsiniz</li>
                                <li><strong>Kısıtlama hakkı:</strong> Belirli durumlarda veri işlenmesinin kısıtlanmasını isteyebilirsiniz</li>
                            </ul>
                            <p className="mt-3">
                                Haklarınızı kullanmak için <strong>hello@learnaxia.com</strong> adresine e-posta gönderebilirsiniz.
                                Talepler en geç 30 gün içinde yanıtlanır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">12. Güvenlik</h2>
                            <p>
                                Verilerinizi korumak için sektör standardı güvenlik önlemleri uygulanmaktadır:
                            </p>
                            <ul className="list-disc list-inside space-y-1 mt-3">
                                <li>Tüm iletişim HTTPS/TLS ile şifrelenmektedir</li>
                                <li>Şifreler bcrypt ile hashlenerek saklanmaktadır</li>
                                <li>Mobile JWT tokenları güvenli şekilde imzalanmaktadır</li>
                                <li>Rate limiting ile kötüye kullanım önlenmektedir</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">13. Veri İhlali Bildirimi</h2>
                            <p>
                                Bir güvenlik ihlali tespit edilmesi durumunda, ilgili düzenlemelerin öngördüğü süre içinde
                                (GDPR kapsamında 72 saat) yetkili mercilere ve etkilenen kullanıcılara bildirimde bulunulacaktır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">14. Uluslararası Veri Transferi</h2>
                            <p>
                                Verileriniz, Railway (AB/ABD), Groq (ABD) ve Resend (ABD) altyapılarında işlenebilir.
                                Bu transferler, yeterlilik kararı, standart sözleşme maddeleri veya hizmet sağlayıcının
                                uluslararası veri koruma çerçevelerine uyumu kapsamında gerçekleştirilmektedir.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">15. Çocukların Gizliliği</h2>
                            <p>
                                Learnaxia, 13 yaşından küçük çocuklara yönelik değildir ve bilerek 13 yaş altı
                                kullanıcılardan veri toplamaz. Böyle bir durumdan haberdar olursak ilgili verileri
                                derhal sileriz.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">16. Politika Değişiklikleri</h2>
                            <p>
                                Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişiklikler e-posta ile bildirilir.
                                Platformu kullanmaya devam etmeniz güncel politikayı kabul ettiğiniz anlamına gelir.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">17. İletişim ve Şikayet</h2>
                            <p>
                                Gizlilik ile ilgili sorularınız için: <strong>hello@learnaxia.com</strong>
                            </p>
                            <p className="mt-3">
                                KVKK kapsamındaki şikayetlerinizi Kişisel Verileri Koruma Kurumu&apos;na (<a href="https://kvkk.gov.tr" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">kvkk.gov.tr</a>) iletebilirsiniz.
                                GDPR kapsamında AB&apos;de bulunuyorsanız yetkili veri koruma otoritesine başvurabilirsiniz.
                            </p>
                        </section>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
