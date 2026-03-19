import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Mail, Github, MessageSquare } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
            <Navbar />
            <main className="flex-1 pt-32 pb-16">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <h1 className="text-4xl font-black mb-8">İletişim</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <p className="text-muted-foreground leading-relaxed">
                                Görüşleriniz, önerileriniz veya destek talepleriniz bizim için değerlidir.
                                En kısa sürede dönüş sağlamaya çalışıyoruz.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border hover:border-primary/50 transition-all group">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">E-posta</p>
                                        <p className="font-bold">learnaxia@gmail.com</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border hover:border-primary/50 transition-all group">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Github className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">GitHub</p>
                                        <p className="font-bold">github.com/emre-net/learnaxia</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600/5 to-purple-600/5 p-8 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center text-center">
                            <div className="h-16 w-16 rounded-full bg-white dark:bg-zinc-900 shadow-xl flex items-center justify-center mb-6">
                                <MessageSquare className="h-8 w-8 text-purple-600" />
                            </div>
                            <h2 className="text-xl font-black mb-2">Hızlı Destek</h2>
                            <p className="text-sm text-muted-foreground mb-6">
                                Acil teknik sorunlar için e-posta kanalını tercih ediniz.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
