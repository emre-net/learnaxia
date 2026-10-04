"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, ArrowRight } from "lucide-react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 20);
    });

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled
                    ? "bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 py-3 shadow-lg shadow-black/20"
                    : "bg-transparent py-5"
            }`}
        >
            <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                {/* Brand Logo & Wordmark */}
                <Link className="flex items-center gap-2.5 group" href="/">
                    <Image
                        src="/logo.png"
                        alt="Learnaxia Logo"
                        width={36}
                        height={36}
                        className="h-8 w-8 object-contain shrink-0 transition-transform group-hover:scale-105"
                    />
                    <span className="text-lg font-bold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                        Learnaxia
                    </span>
                </Link>

                {/* Desktop Navigation Links */}
                <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400">
                    <Link
                        className="hover:text-zinc-100 transition-colors"
                        href="/#how-it-works"
                    >
                        Nasıl Çalışır?
                    </Link>
                    <Link
                        className="hover:text-zinc-100 transition-colors"
                        href="/#features"
                    >
                        Özellikler
                    </Link>
                    <Link
                        className="hover:text-zinc-100 transition-colors"
                        href="/#methodology"
                    >
                        Metodoloji
                    </Link>
                    <Link
                        className="hover:text-zinc-100 transition-colors"
                        href="/about"
                    >
                        Hakkımızda
                    </Link>
                    <Link
                        className="hover:text-zinc-100 transition-colors"
                        href="/contact"
                    >
                        İletişim
                    </Link>
                </nav>

                {/* Desktop CTA Action Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-medium"
                    >
                        <Link href="/login">Giriş Yap</Link>
                    </Button>
                    <Button
                        size="sm"
                        className="bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold px-4 rounded-lg shadow-sm transition-all active:scale-95"
                        asChild
                    >
                        <Link href="/login?tab=register">
                            Ücretsiz Başla
                        </Link>
                    </Button>
                </div>

                {/* Mobile Menu Trigger */}
                <div className="md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-zinc-300 hover:text-white hover:bg-zinc-900"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="bg-zinc-950 border-zinc-800 text-zinc-100 flex flex-col justify-between pt-14 pb-8"
                        >
                            <div className="flex flex-col gap-6">
                                <Link
                                    className="text-base font-medium text-zinc-300 hover:text-white transition-colors"
                                    href="/#how-it-works"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Nasıl Çalışır?
                                </Link>
                                <Link
                                    className="text-base font-medium text-zinc-300 hover:text-white transition-colors"
                                    href="/#features"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Özellikler
                                </Link>
                                <Link
                                    className="text-base font-medium text-zinc-300 hover:text-white transition-colors"
                                    href="/#methodology"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Metodoloji
                                </Link>
                                <Link
                                    className="text-base font-medium text-zinc-300 hover:text-white transition-colors"
                                    href="/about"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Hakkımızda
                                </Link>
                                <Link
                                    className="text-base font-medium text-zinc-300 hover:text-white transition-colors"
                                    href="/contact"
                                    onClick={() => setIsOpen(false)}
                                >
                                    İletişim
                                </Link>
                            </div>

                            <div className="flex flex-col gap-3 pt-6 border-t border-zinc-800">
                                <Button
                                    variant="outline"
                                    asChild
                                    className="w-full border-zinc-800 bg-zinc-900 text-zinc-200"
                                >
                                    <Link href="/login" onClick={() => setIsOpen(false)}>
                                        Giriş Yap
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    className="w-full bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold"
                                >
                                    <Link href="/login?tab=register" onClick={() => setIsOpen(false)}>
                                        Ücretsiz Başla
                                    </Link>
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
