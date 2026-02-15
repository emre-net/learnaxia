"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrainCircuit } from "lucide-react";
import { useScroll, motion, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

export function Navbar() {
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 50);
    });

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-md border-b py-3" : "bg-transparent py-6"}`}>
            <div className="container px-4 md:px-6 flex items-center justify-between">
                <Link className="flex items-center justify-center gap-2" href="/">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                    <span className="font-bold text-xl">Learnaxia</span>
                </Link>
                <nav className="flex gap-4 items-center">
                    <Link className="text-sm font-medium hover:text-primary transition-colors hidden md:block" href="#features">
                        Özellikler
                    </Link>
                    <Link className="text-sm font-medium hover:text-primary transition-colors hidden md:block" href="#pricing">
                        Fiyatlandırma
                    </Link>
                    <Button variant="ghost" asChild className="ml-4">
                        <Link href="/login">Giriş Yap</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/register">Kayıt Ol</Link>
                    </Button>
                </nav>
            </div>
        </header>
    );
}
