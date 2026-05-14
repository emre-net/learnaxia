import Link from "next/link";
import Image from "next/image";

export function Footer() {
    return (
        <footer className="border-t py-12 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Image src="/logo.png" alt="Learnaxia Logo" width={48} height={48} className="h-10 w-10 object-contain shrink-0 drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]" />
                        <span className="text-xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-500 uppercase truncate">
                            Learnaxia
                        </span>
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
                    </div>
                </div>
            </div>
        </footer>
    );
}
