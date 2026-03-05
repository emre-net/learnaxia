import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default function PrivacyPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
            <Navbar />
            <main className="flex-1 pt-32 pb-16">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <h1 className="text-4xl font-black mb-8">Gizlilik Politikası</h1>
                    <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-muted-foreground">
                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">1. Veri Toplama</h2>
                            <p>
                                Learnaxia olarak, hizmetlerimizi sunabilmek ve geliştirebilmek amacıyla e-posta adresiniz,
                                adınız gibi sınırlı kişisel verileri topluyoruz. Google ile giriş yapmanız durumunda,
                                Google profil bilgilerinizden (ad, e-posta, profil fotoğrafı) yararlanıyoruz.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">2. Verilerin Kullanımı</h2>
                            <p>
                                Toplanan veriler sadece; oturum yönetimi, size özel öğrenme istatistiklerinin takibi
                                ve platformla ilgili kritik güncellemelerin iletilmesi amacıyla kullanılır.
                                Verileriniz asla üçüncü taraflara reklam amaçlı satılmaz.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">3. Çerezler (Cookies)</h2>
                            <p>
                                Oturum güvenliğini sağlamak ve tercihlerinizi hatırlamak için temel çerezleri kullanıyoruz.
                                Tarayıcı ayarlarınızdan çerezleri engelleyebilirsiniz ancak bu durum platformun bazı
                                özelliklerinin çalışmasını engelleyebilir.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">4. İletişim</h2>
                            <p>
                                Gizlilik politikamız hakkında sorularınız için <strong>learnaxia@gmail.com</strong>
                                adresi üzerinden bizimle iletişime geçebilirsiniz.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
