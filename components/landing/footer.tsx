import Link from "next/link";
import { BrainCircuit } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t py-12 bg-background">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg">Learnaxia</span>
                    </div>

                    <nav className="flex gap-6 text-sm text-muted-foreground">
                        <Link href="#" className="hover:text-primary transition-colors">Hakkımızda</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Gizlilik</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Şartlar</Link>
                        <Link href="#" className="hover:text-primary transition-colors">İletişim</Link>
                        <Link href="https://github.com/emre/learnaxia" className="hover:text-primary transition-colors">GitHub</Link>
                    </nav>

                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Learnaxia Inc. Tüm hakları saklıdır.
                    </p>
                </div>
            </div>
        </footer>
    );
}
