"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Menu } from "lucide-react";
import { useScroll, motion, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 50);
    });

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-md border-b py-3" : "bg-transparent py-6"}`}>
            <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                <Link className="flex items-center justify-center gap-2" href="/">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                    <span className="font-bold text-xl">Learnaxia</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex gap-6 items-center">
                    <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">
                        Özellikler
                    </Link>
                    <Link className="text-sm font-medium hover:text-primary transition-colors" href="/#pricing">
                        Fiyatlandırma
                    </Link>
                    <Button variant="ghost" asChild className="ml-4">
                        <Link href="/login">Giriş Yap</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/login">Kayıt Ol</Link>
                    </Button>
                </nav>

                {/* Mobile Menu Trigger */}
                <div className="md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="flex flex-col gap-8 pt-16">
                            <Link className="text-lg font-semibold" href="#features" onClick={() => setIsOpen(false)}>
                                Özellikler
                            </Link>
                            <Link className="text-lg font-semibold" href="#pricing" onClick={() => setIsOpen(false)}>
                                Fiyatlandırma
                            </Link>
                            <hr />
                            <div className="flex flex-col gap-4">
                                <Button variant="outline" asChild className="w-full">
                                    <Link href="/login" onClick={() => setIsOpen(false)}>Giriş Yap</Link>
                                </Button>
                                <Button asChild className="w-full">
                                    <Link href="/login" onClick={() => setIsOpen(false)}>Kayıt Ol</Link>
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
