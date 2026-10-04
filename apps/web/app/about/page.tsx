import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import { ArrowRight, Brain, Clock, ShieldCheck, Heart, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Hakkımızda & Hikayemiz | Learnaxia",
    description: "Learnaxia'nın ortaya çıkış hikayesi, öğrenme felsefesi ve arkasındaki kurucu vizyonu.",
};

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-sky-500/20">
            <Navbar />
            
            <main className="flex-1 pt-32 pb-24">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    {/* Header Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-xs font-mono mb-6">
                        <span>KURUCU MANİFESTOSU & VİZYON</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-100 leading-[1.1] mb-6">
                        Öğrenmek bir eziyet değil, <br className="hidden sm:inline" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                            sistematik bir ustalaşma süreci
                        </span>{" "}
                        olmalıdır.
                    </h1>

                    <p className="text-lg text-zinc-400 leading-relaxed font-normal mb-12">
                        Gecelerce kahve eşliğinde fosforlu kalemle sayfalarca altı çizilen kitaplar, sınavdan 1 hafta sonra
                        hafızadan silinen formüller ve boşa harcanan yüzlerce saat... Learnaxia, tam olarak bu kısır döngüyü kırmak için doğdu.
                    </p>

                    <div className="space-y-12 text-zinc-300 leading-relaxed">
                        {/* Section 1: The Problem */}
                        <section className="p-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
                            <h2 className="text-xl font-bold text-zinc-100 mb-3 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-rose-400" />
                                Geleneksel Çalışma Neden İflas Ediyor?
                            </h2>
                            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                                Çoğu insan çalışırken "pasif okuma" yapar. Bir konuyu tekrar tekrar okumak, zihinde o konuyu bildiğimize dair sahte bir aşinalık (fluency illusion) oluşturur. Oysa bilişsel psikoloji onlarca yıldır şunu kanıtlamıştır: <strong>Öğrenme, bilgiyi kafaya sokmaya çalışırken değil; kafadan zorlayarak geri çağırmaya (Active Recall) çalışırken gerçekleşir.</strong>
                            </p>
                        </section>

                        {/* Section 2: The Solution */}
                        <section className="p-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
                            <h2 className="text-xl font-bold text-zinc-100 mb-3 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-sky-400" />
                                Learnaxia Felsefesi: Bilim + Teknoloji
                            </h2>
                            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-4">
                                Biz yapay zekayı öğrencinin yerine düşünen bir mekanizma olarak değil; öğrencinin en sıkıcı işlerini (kart hazırlama, soru çıkarma, özetleme) üstlenip zihnini sadece öğrenmeye odaklayan bir asistan olarak konumluyoruz:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                                    <h3 className="font-semibold text-zinc-100 text-sm mb-1">SM-2 Algoritması</h3>
                                    <p className="text-xs text-zinc-400">
                                        Her kart hafızanızdaki sağlamlığına göre puanlanır. Bildiklerinize vakit kaybetmez, unuttuklarınızı tam zamanında tekrar edersiniz.
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                                    <h3 className="font-semibold text-zinc-100 text-sm mb-1">Hızlı İçerik Üretimi</h3>
                                    <p className="text-xs text-zinc-400">
                                        100 sayfalık bir tıp veya hukuk PDF&apos;ini elle karta dönüştürmek günler sürer. Learnaxia bunu dakikalara indirir.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: The Solo Founder Story */}
                        <section className="p-8 sm:p-10 rounded-3xl border border-sky-950/60 bg-gradient-to-br from-zinc-900/80 via-zinc-900/40 to-sky-950/20">
                            <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-3 uppercase tracking-wider">
                                <Heart className="w-4 h-4 text-sky-400" />
                                Bağımsız & Kullanıcı Odaklı
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-100 mb-4">
                                Tek Bir Geliştiricinin Tutkusuyla İnşa Edildi
                            </h2>
                            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-4">
                                Learnaxia, büyük ve hantal kurumsal şirketlerin yatırımcı baskısıyla reklam panolarına çevirdiği platformlara tepki olarak doğdu. 
                                Bu platform tek bir yazılım mühendisi tarafından, bizzat öğrencilerin ve kendini geliştirmek isteyen insanların gerçek ihtiyaçları gözetilerek kodlandı.
                            </p>
                            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                                Bu bağımsız yapı sayesinde hiçbir kurumsal bürokrasiye takılmadan, doğrudan kullanıcıların geri bildirimleriyle haftalık olarak geliştiriliyor ve güncelleniyor. Her satır kodda daha hızlı, daha akıcı ve daha kalıcı bir çalışma deneyimi hedefi var.
                            </p>
                        </section>

                        {/* CTA */}
                        <div className="pt-8 text-center flex flex-col items-center">
                            <h3 className="text-2xl font-bold text-zinc-100 mb-3">
                                Bu deneyimi kendiniz test edin.
                            </h3>
                            <p className="text-zinc-400 text-sm max-w-md mb-6">
                                İlk çalışma setinizi saniyeler içinde oluşturun ve farkı hissedin.
                            </p>
                            <Button
                                size="lg"
                                className="bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold px-8 rounded-xl"
                                asChild
                            >
                                <Link href="/login?tab=register">
                                    Ücretsiz Başla <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
