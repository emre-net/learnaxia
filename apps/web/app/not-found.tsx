import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-6xl font-black mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-6">Sayfa Bulunamadı</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Aradığınız sayfaya ulaşılamıyor. Sayfa kaldırılmış, ismi değiştirilmiş veya geçici olarak kullanım dışı olabilir.
      </p>
      <Button asChild>
        <Link href="/">Ana Sayfaya Dön</Link>
      </Button>
    </div>
  );
}
