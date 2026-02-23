import Link from "next/link";
import { BrainCircuit } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t py-12 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg">Learnaxia</span>
                    </div>

                    <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground justify-center md:justify-start">
                        <Link href="/about" className="hover:text-primary transition-colors">Hakkımızda</Link>
                        <Link href="/privacy" className="hover:text-primary transition-colors">Gizlilik</Link>
                        <Link href="/terms" className="hover:text-primary transition-colors">Şartlar</Link>
                        <Link href="/contact" className="hover:text-primary transition-colors">İletişim</Link>
                        <Link href="https://github.com/emre-net/learnaxia" className="hover:text-primary transition-colors" target="_blank">GitHub</Link>
                    </nav>

                    <div className="flex flex-col items-center md:items-end gap-2">
                        <p className="text-xs text-muted-foreground">
                            © {new Date().getFullYear()} Learnaxia. Tüm hakları saklıdır.
                        </p>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
                            <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                            Developed by a solo engineer
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
