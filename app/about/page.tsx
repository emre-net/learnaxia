import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
            <Navbar />
            <main className="flex-1 pt-32 pb-16">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <h1 className="text-4xl font-black mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Hakkımızda
                    </h1>
                    <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h2 className="text-2xl font-bold mb-4">Misyonumuz</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Learnaxia, öğrenme sürecini daha verimli, eğlenceli ve erişilebilir kılmak amacıyla yola çıktı.
                                Geleneksel yöntemlerin yavaşlığını modern yapay zeka teknolojileriyle aşarak, herkesin kendi hızında
                                ve tarzında öğrenebileceği bir ekosistem inşa ediyoruz.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">Neden Learnaxia?</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Bilginin katlanarak arttığı bir çağda, en büyük yetenek "nasıl öğrenileceğini bilmek"tir.
                                Learnaxia, Spaced Repetition (Aralıklı Tekrar) gibi bilimsel yöntemleri AI destekli içerik üretimiyle
                                birleştirerek size sadece bir araç değil, bir öğrenme arkadaşı sunar.
                            </p>
                        </section>

                        <section className="bg-muted/50 p-8 rounded-3xl border-2 border-dashed">
                            <h2 className="text-2xl font-black mb-2">Tek Kişilik Dev Kadro</h2>
                            <p className="text-sm text-muted-foreground italic mb-4">
                                "Yargılamaz, Sadece İlerletir."
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                Learnaxia, büyük kurumsal yapılar yerine, tek bir yazılım mühendisinin tutkusu ve vizyonuyla
                                geliştirilmiştir. Bu sayede kullanıcı geri bildirimlerine hızlıca yanıt verebiliyor,
                                en yeni teknolojileri anında entegre edebiliyoruz. Her kod satırında daha iyi bir öğrenme
                                deneyimi hedefi yatmaktadır.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
