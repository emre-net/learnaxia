import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadı (404)",
  description: "Aradığınız sayfaya ulaşılamıyor.",
};

export default function NotFound() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-6 text-center overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* 404 numerals */}
      <div className="relative z-10 mb-8 select-none">
        <p className="text-[10rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-blue-600 to-purple-600 opacity-20">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-500">
            404
          </span>
        </div>
      </div>

      {/* Message */}
      <h1 className="text-3xl font-black mb-3 tracking-tight text-foreground">
        Sayfa Bulunamadı
      </h1>
      <p className="text-muted-foreground mb-10 max-w-md text-base leading-relaxed">
        Aradığınız sayfa kaldırılmış, adresi değiştirilmiş veya geçici
        olarak kullanım dışı olabilir.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Button asChild size="lg" className="font-semibold">
          <Link href="/">Ana Sayfaya Dön</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="font-semibold">
          <Link href="/dashboard">Panele Git</Link>
        </Button>
      </div>

      {/* Helpful links */}
      <div className="mt-16 border-t border-border pt-8 w-full max-w-md">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-4">
          Popüler Sayfalar
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
          {[
            { label: "Kütüphane", href: "/dashboard/library" },
            { label: "Keşfet", href: "/dashboard/explore" },
            { label: "Analitik", href: "/dashboard/analytics" },
            { label: "Yeni Modül", href: "/dashboard/create" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
