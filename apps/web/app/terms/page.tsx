import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Kullanım Şartları | Learnaxia",
    description: "Learnaxia kullanım şartları ve koşulları.",
};

export default function TermsPage() {
    const lastUpdated = "17 Haziran 2026";

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground antialiased">
            <Navbar />
            <main className="flex-1 pt-32 pb-20">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <h1 className="text-4xl font-black mb-2">Kullanım Şartları</h1>
                    <p className="text-muted-foreground mb-12 text-sm">Son güncelleme: {lastUpdated}</p>

                    <div className="space-y-10 text-muted-foreground leading-relaxed">

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">1. Kabul</h2>
                            <p>
                                Learnaxia web sitesini (<strong>learnaxia.com</strong>) veya mobil uygulamasını (&quot;Platform&quot;) kullanarak
                                bu Kullanım Şartları&apos;nı okuduğunuzu, anladığınızı ve bağlayıcı olduğunu kabul etmiş sayılırsınız.
                                Bu şartları kabul etmiyorsanız platformu kullanmayınız.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">2. Hizmet Tanımı</h2>
                            <p>
                                Learnaxia; flashcard oluşturma, spaced repetition (aralıklı tekrar), AI destekli içerik üretimi,
                                öğrenme analitiği ve gamifikasyon özelliklerini bir arada sunan bir öğrenme platformudur.
                                Hizmet &quot;olduğu gibi&quot; (as-is) sunulmaktadır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">3. Yaş Sınırı</h2>
                            <p>
                                Platformumuzu kullanmak için <strong>en az 13 yaşında</strong> olmanız gerekmektedir.
                                13-18 yaş arası kullanıcıların ebeveyn veya yasal vasi onayı alması önerilir.
                                13 yaşından küçük kullanıcıların kaydını tespit etmemiz durumunda hesap derhal kapatılır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">4. Hesap Oluşturma ve Güvenlik</h2>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Hesap oluşturmak için doğru ve güncel bilgi vermeniz zorunludur.</li>
                                <li>Her kullanıcı yalnızca bir hesap açabilir.</li>
                                <li>Hesabınızın güvenliğinden (şifre, üçüncü taraf giriş yöntemleri dahil) siz sorumlusunuz.</li>
                                <li>Yetkisiz erişim şüphesi durumunda derhal <strong>hello@learnaxia.com</strong> adresine bildirin.</li>
                                <li>Hesabınızı başkasına devredemez veya kiralayamazsınız.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">5. Kullanıcı Tarafından Oluşturulan İçerik</h2>
                            <p className="mb-3">
                                Platform üzerinde oluşturduğunuz içerikler (modüller, kartlar, notlar, journey&apos;ler) size aittir.
                                Ancak bu içerikleri platforma yükleyerek bize aşağıdaki lisansı vermiş olursunuz:
                            </p>
                            <p className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm">
                                Platform hizmetlerini sunmak, teknik altyapıyı işletmek ve (kamuya açık olarak paylaştıysanız)
                                diğer kullanıcılara göstermek amacıyla içeriklerinizi kullanmak için münhasır olmayan,
                                dünya genelinde geçerli, telif ücretsiz bir lisans.
                            </p>
                            <p className="mt-3">
                                Hesabınızı sildiğinizde bu lisans sona erer. Kamuya paylaşılan içerikler 30 gün içinde kaldırılır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">6. Yasak İçerik ve Davranışlar</h2>
                            <p className="mb-3">Platformda aşağıdaki içerikleri yayınlamak veya faaliyetleri gerçekleştirmek kesinlikle yasaktır:</p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Yasa dışı, hakaret içerikli, tehdit edici, pornografik veya zararlı içerikler</li>
                                <li>Başkalarının fikri mülkiyet haklarını ihlal eden materyaller</li>
                                <li>Spam, otomatik bot trafiği veya kötüye kullanım</li>
                                <li>Platform güvenliğini tehdit edecek her türlü saldırı girişimi</li>
                                <li>Momentum sistemini manipüle etmeye yönelik sahte aktivite (farming)</li>
                                <li>Kötü amaçlı yazılım veya zararlı kod içeren içerikler</li>
                                <li>Başkalarını taklit etmek veya yanıltıcı kimlik oluşturmak</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">7. Fikri Mülkiyet</h2>
                            <p className="mb-3">
                                Learnaxia platformu (yazılım, tasarım, marka, logo, kullanıcı arayüzü, algoritma) üzerindeki
                                tüm fikri mülkiyet hakları Learnaxia&apos;ya aittir. İzinsiz kopyalama, dağıtım veya tersine mühendislik yasaktır.
                            </p>
                            <p>
                                Fikri mülkiyet ihlali iddiasında bulunmak için <strong>hello@learnaxia.com</strong> adresine
                                ihlal edilen eserin tanımı ve talebinizi içeren bir e-posta gönderin.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">8. Ücretsiz ve Ücretli Hizmetler</h2>
                            <p className="mb-3">
                                Learnaxia hem ücretsiz hem de (ilerleyen dönemde) ücretli abonelik planları sunabilir.
                                Ücretli hizmetler için geçerli koşullar:
                            </p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Abonelik ücretleri, seçilen plana ve ödeme dönemine göre değişir ve önceden bildirilir.</li>
                                <li>Ücretlendirme, abonelik başlangıcında veya yenileme tarihinde gerçekleşir.</li>
                                <li>İptal, bir sonraki fatura döneminden önce yapılmalıdır.</li>
                                <li>Dijital içerik niteliğindeki hizmetler için yasal istisnalar saklı kalmak kaydıyla iade yapılmaz.</li>
                                <li>Teknik bir hata nedeniyle fazla tahsilat durumunda 14 iş günü içinde iade gerçekleştirilir.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">9. Hesap Askıya Alma ve Sonlandırma</h2>
                            <p className="mb-3">Aşağıdaki durumlarda hesabınız uyarısız askıya alınabilir veya kapatılabilir:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Bu şartların ihlali</li>
                                <li>Platform güvenliğini tehdit eden davranışlar</li>
                                <li>Uzun süreli (24 ay+) inaktiflik</li>
                                <li>Yasal zorunluluk</li>
                            </ul>
                            <p className="mt-3">
                                Kendi isteğinizle hesabınızı silmek için Ayarlar &gt; Hesabım &gt; Hesabı Sil bölümünü kullanabilirsiniz.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">10. Sorumluluk Reddi</h2>
                            <p className="mb-3">
                                Platform &quot;olduğu gibi&quot; sunulmaktadır. Learnaxia:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Hizmetin kesintisiz veya hatasız çalışacağını garanti etmez</li>
                                <li>Platform üzerindeki içeriklerin doğruluğunu garanti etmez</li>
                                <li>AI tarafından üretilen içeriklerin doğruluğundan sorumlu tutulamaz</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">11. Sorumluluk Sınırı</h2>
                            <p>
                                Learnaxia&apos;nın herhangi bir davadan doğacak toplam sorumluluğu,
                                olaya konu olan hizmet için son 12 ayda ödediğiniz ücret ile sınırlıdır.
                                Learnaxia; veri kaybı, kar kaybı veya dolaylı zararlardan sorumlu tutulamaz.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">12. Hizmet Değişiklikleri</h2>
                            <p>
                                Learnaxia, özellikleri değiştirme, kaldırma veya platforma yeni özellikler ekleme hakkını saklı tutar.
                                Önemli değişiklikler en az <strong>30 gün öncesinden</strong> e-posta veya platform bildirimi ile duyurulur.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">13. Anlaşmazlık Çözümü</h2>
                            <p>
                                Bu şartlardan doğacak anlaşmazlıklarda öncelikle <strong>hello@learnaxia.com</strong> adresi
                                üzerinden dostane çözüm yolu aranır. Çözüme kavuşturulamazsa Türk hukuku geçerli olup
                                uyuşmazlıklar Türk mahkemelerinde görülür.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">14. Geçerli Hukuk</h2>
                            <p>
                                Bu şartlar Türkiye Cumhuriyeti kanunlarına tabidir. AB kullanıcıları için GDPR ve
                                AB tüketici koruma mevzuatı da geçerlidir.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">15. İletişim</h2>
                            <p>
                                Bu şartlarla ilgili sorularınız için: <strong>hello@learnaxia.com</strong>
                            </p>
                        </section>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
