import Link from "next/link";
import Image from "next/image";

export function Footer() {
    return (
        <footer className="border-t border-zinc-900 bg-zinc-950 text-zinc-400 py-16">
            <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link className="flex items-center gap-2.5" href="/">
                            <Image
                                src="/logo.png"
                                alt="Learnaxia Logo"
                                width={32}
                                height={32}
                                className="h-7 w-7 object-contain shrink-0"
                            />
                            <span className="text-base font-bold tracking-tight text-zinc-100">
                                Learnaxia
                            </span>
                        </Link>
                        <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                            Ezber yükünü ortadan kaldıran, bilişsel bilim ve aralıklı tekrar (SM-2) destekli yeni nesil öğrenme ekosistemi.
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-xs text-zinc-500">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Tüm Sistemler Çevrimiçi</span>
                        </div>
                    </div>

                    {/* Platform Links */}
                    <div className="space-y-3 text-xs">
                        <h4 className="font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                            Platform
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/#how-it-works" className="hover:text-zinc-200 transition-colors">
                                    Nasıl Çalışır?
                                </Link>
                            </li>
                            <li>
                                <Link href="/#features" className="hover:text-zinc-200 transition-colors">
                                    Özellikler & Atölyeler
                                </Link>
                            </li>
                            <li>
                                <Link href="/#methodology" className="hover:text-zinc-200 transition-colors">
                                    SM-2 Metodolojisi
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard" className="hover:text-zinc-200 transition-colors">
                                    Çalışma Paneli
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company & Legal */}
                    <div className="space-y-3 text-xs">
                        <h4 className="font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                            Kurumsal & Yasal
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/about" className="hover:text-zinc-200 transition-colors">
                                    Hakkımızda & Hikayemiz
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-zinc-200 transition-colors">
                                    İletişim & Destek
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="hover:text-zinc-200 transition-colors">
                                    Gizlilik Politikası
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="hover:text-zinc-200 transition-colors">
                                    Kullanım Şartları
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Open Ecosystem */}
                    <div className="space-y-3 text-xs">
                        <h4 className="font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                            Ekosistem
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="https://github.com/emre-net/learnaxia"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-zinc-200 transition-colors"
                                >
                                    GitHub Deposu
                                </Link>
                            </li>
                            <li>
                                <span className="text-zinc-500">Android & iOS Uygulaması (Expo)</span>
                            </li>
                            <li>
                                <span className="text-zinc-500">PostgreSQL & Cloud Bulut Altyapısı</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
                    <p>© {new Date().getFullYear()} Learnaxia. Tüm hakları saklıdır.</p>
                    <p className="font-mono text-[11px]">Öğrenmenin En Akıllı ve Kalıcı Yolu.</p>
                </div>
            </div>
        </footer>
    );
}
