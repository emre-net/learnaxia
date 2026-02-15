
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";

export default function CreatePage() {
    return (
        <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Yeni Modül Oluştur</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Öğrenme içeriğini nasıl oluşturmak istediğini seç.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Manual Creation Card */}
                <Link href="/dashboard/create/manual" className="group">
                    <Card className="h-full hover:border-primary transition-all hover:shadow-lg cursor-pointer flex flex-col">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <PenTool className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-2xl">Manuel Oluşturma</CardTitle>
                            <CardDescription>
                                Sıfırdan oluştur. Hazır içeriğin veya notların olduğunda en iyisidir.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center">
                                    <BookOpen className="h-4 w-4 mr-2" /> Her öğe üzerinde tam kontrol
                                </li>
                                <li className="flex items-center">
                                    <BookOpen className="h-4 w-4 mr-2" /> Flashcard, Çoktan Seçmeli ve Boşluk Doldurma desteği
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full">Manuel Başla</Button>
                        </CardFooter>
                    </Card>
                </Link>

                {/* AI Generation Card */}
                <Link href="/dashboard/create/ai" className="group">
                    <Card className="h-full border-purple-500/20 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles className="h-32 w-32 text-purple-500 rotate-12" />
                        </div>

                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-2xl">Yapay Zeka ile Üret</CardTitle>
                            <CardDescription>
                                Metin, PDF veya konu başlıklarından anında modül oluştur.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 relative z-10">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center">
                                    <Sparkles className="h-4 w-4 mr-2 text-purple-500" /> Metinden Flashcard'a
                                </li>
                                <li className="flex items-center">
                                    <Sparkles className="h-4 w-4 mr-2 text-purple-500" /> Çoklu Tür Desteği
                                </li>
                                <li className="flex items-center">
                                    <Sparkles className="h-4 w-4 mr-2 text-purple-500" /> Anında çalışmaya hazır
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button variant="secondary" className="w-full bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white border-purple-200">Yapay Zeka ile Başla</Button>
                        </CardFooter>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
