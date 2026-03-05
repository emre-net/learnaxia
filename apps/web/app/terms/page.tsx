import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default function TermsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
            <Navbar />
            <main className="flex-1 pt-32 pb-16">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <h1 className="text-4xl font-black mb-8">Kullanım Şartları</h1>
                    <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-muted-foreground">
                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">1. Hizmet Kullanımı</h2>
                            <p>
                                Learnaxia platformunu kullanarak, bu şartlara uymayı kabul etmiş sayılırsınız.
                                Platformun yasa dışı amaçlarla kullanılması veya sistem güvenliğine zarar verecek
                                faaliyetlerde bulunulması yasaktır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">2. Hesap Güvenliği</h2>
                            <p>
                                Hesabınızın ve parolanızın (veya sosyal giriş yöntemlerinizin) güvenliğinden siz sorumlusunuz.
                                Yetkisiz kullanım durumunda bizi derhal bilgilendirmelisiniz.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">3. Fikri Mülkiyet</h2>
                            <p>
                                Learnaxia yazılımı, tasarımı ve markası üzerindeki tüm haklar saklıdır.
                                İçeriklerin kopyalanması veya izinsiz dağıtılması yasaktır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground mb-4">4. Sorumluluk Sınırı</h2>
                            <p>
                                Learnaxia, sistem kesintilerinden veya veri kayıplarından kaynaklanabilecek doğrudan
                                veya dolaylı zararlardan sorumlu tutulamaz. Hizmet "olduğu gibi" sunulmaktadır.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
