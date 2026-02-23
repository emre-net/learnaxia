import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Sparkles, BookOpen, FolderPlus, BrainCircuit, Camera, FileText, Zap, Layout, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function AtölyePage() {
    return (
        <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-16 animate-in fade-in duration-700 pb-20">
            {/* Header Area */}
            <div className="text-center space-y-4">
                <Badge variant="outline" className="px-4 py-1 text-xs font-black uppercase tracking-[0.2em] border-primary/20 bg-primary/5 text-primary mb-2">
                    Yaratıcılık Merkezi
                </Badge>
                <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-zinc-300 dark:to-white">
                    Atölye
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
                    Bilgiyi modüllere dönüştür, zekayla çöz ve akıllı notlar al. Öğrenme yolculuğunu burada inşa et.
                </p>
            </div>

            {/* === ÜRETİM KATMANI === */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-1 px-0 bg-blue-600 rounded-full" />
                    <div>
                        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <Layout className="h-7 w-7 text-blue-600" /> Üretim
                        </h2>
                        <p className="text-muted-foreground font-medium">Sıfırdan veya koleksiyon halinde içerikler tasarla.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {/* Manual Creation Card */}
                    <Link href="/dashboard/create/manual" className="group">
                        <Card className="h-full border-2 border-slate-100 dark:border-zinc-800/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 cursor-pointer flex flex-col rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900/50">
                            <CardHeader className="p-8">
                                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <PenTool className="h-7 w-7" />
                                </div>
                                <CardTitle className="text-2xl font-black mb-2">Manuel Modül</CardTitle>
                                <CardDescription className="text-base">
                                    Flashcard veya testleri tek tek, tam kontrolle oluştur.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 flex-1">
                                <ul className="space-y-3 text-sm font-medium text-muted-foreground">
                                    <li className="flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Her öğe üzerinde tam hakimiyet
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Çoklu tür (Flashcard, Test, Boşluk Doldurma)
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter className="p-8 pt-0 mt-auto">
                                <Button className="w-full h-12 rounded-xl font-bold bg-slate-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                                    Hemen Başla <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </Link>

                    {/* Collection Creation Card */}
                    <Link href="/dashboard/collections/new" className="group">
                        <Card className="h-full border-2 border-slate-100 dark:border-zinc-800/50 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/5 cursor-pointer flex flex-col rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900/50">
                            <CardHeader className="p-8">
                                <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <FolderPlus className="h-7 w-7" />
                                </div>
                                <CardTitle className="text-2xl font-black mb-2">Kitap Koleksiyonu</CardTitle>
                                <CardDescription className="text-base">
                                    Modülleri birleştirerek sıralı bir öğrenme yolu kur.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 flex-1">
                                <ul className="space-y-3 text-sm font-medium text-muted-foreground">
                                    <li className="flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Modülleri klasörle ve grupla
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Sıralı öğrenme müfredatı
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter className="p-8 pt-0 mt-auto">
                                <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-2">
                                    Koleksiyon İnşa Et <FolderPlus className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </Link>
                </div>
            </section>

            {/* === ZEKA KATMANI === */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-1 px-0 bg-purple-600 rounded-full" />
                    <div>
                        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <Sparkles className="h-7 w-7 text-purple-600" /> Zeka
                        </h2>
                        <p className="text-muted-foreground font-medium">AI teknolojisiyle içerik üret ve sorunlarını çöz.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* AI Generation Card */}
                    <Link href="/dashboard/create/ai" className="group">
                        <Card className="h-full border-2 border-purple-100 dark:border-purple-900/20 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer flex flex-col rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900/50">
                            <CardHeader className="p-8">
                                <div className="h-14 w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Sparkles className="h-7 w-7" />
                                </div>
                                <CardTitle className="text-2xl font-black mb-2">AI Üretimi</CardTitle>
                                <CardDescription>Metin veya PDF'den anında modül oluştur.</CardDescription>
                            </CardHeader>
                            <CardFooter className="p-8 pt-0 mt-auto">
                                <Button className="w-full h-12 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                    Üretmeye Başla <Zap className="ml-2 h-4 w-4 fill-white" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </Link>

                    {/* Solve Photo Card */}
                    <Link href="/dashboard/create/solve-photo" className="group">
                        <Card className="h-full border-2 border-emerald-100 dark:border-emerald-900/20 hover:border-emerald-500 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 cursor-pointer flex flex-col rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900/50">
                            <CardHeader className="p-8">
                                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Camera className="h-7 w-7" />
                                </div>
                                <CardTitle className="text-2xl font-black mb-2">Soru Çözücü</CardTitle>
                                <CardDescription>Fotoğrafını çek, AI adım adım açıklasın.</CardDescription>
                            </CardHeader>
                            <CardFooter className="p-8 pt-0 mt-auto">
                                <Button className="w-full h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                                    Fotoğraf Yükle <Camera className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </Link>

                    {/* AI Note Extraction Card (NEW) */}
                    <Link href="/dashboard/create/ai-notes" className="group">
                        <Card className="h-full border-2 border-amber-100 dark:border-amber-900/20 hover:border-amber-500 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer flex flex-col rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900/50">
                            <CardHeader className="p-8">
                                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <FileText className="h-7 w-7" />
                                </div>
                                <CardTitle className="text-2xl font-black mb-2">Not Atölyesi</CardTitle>
                                <CardDescription>PDF'den akıllı notlar çıkar ve özetle.</CardDescription>
                            </CardHeader>
                            <CardFooter className="p-8 pt-0 mt-auto">
                                <Button className="w-full h-12 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white">
                                    Not Çıkar <FileText className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </Link>
                </div>
            </section>

            {/* === PLANLAMA KATMANI === */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-1 px-0 bg-zinc-600 rounded-full" />
                    <div>
                        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <BrainCircuit className="h-7 w-7 text-zinc-600" /> Planlama
                        </h2>
                        <p className="text-muted-foreground font-medium">Kişisel öğrenme stratejini belirle.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Learning Mode Card */}
                    <Link href="/dashboard/learning/create" className="group">
                        <Card className="h-full border-2 border-slate-100 dark:border-zinc-800/50 hover:border-zinc-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-500/5 cursor-pointer flex flex-col rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900/50">
                            <CardHeader className="p-8 flex flex-row items-center gap-6">
                                <div className="h-16 w-16 rounded-2xl bg-zinc-500/10 flex items-center justify-center text-zinc-600 group-hover:scale-110 transition-transform duration-300 shrink-0">
                                    <BrainCircuit className="h-8 w-8" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-2xl font-black">Öğrenme Modu</CardTitle>
                                    <CardDescription className="text-base font-medium">
                                        Kişiselleştirilmiş rota ve zayıf yön analizi.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardFooter className="p-8 pt-0 mt-auto">
                                <Button variant="secondary" className="w-full h-12 rounded-xl font-bold border-0">
                                    Rota Oluştur
                                </Button>
                            </CardFooter>
                        </Card>
                    </Link>
                </div>
            </section>
        </div>
    );
}
