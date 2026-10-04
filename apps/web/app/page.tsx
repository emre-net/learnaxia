import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { Footer } from "@/components/landing/footer";

export const metadata = {
  title: "Learnaxia | Bilişsel Bilim & Aralıklı Tekrar Destekli Öğrenme",
  description: "Notlarınızı, PDF'lerinizi ve kitap sayfalarınızı saniyeler içinde akıllı kart setlerine dönüştürün. SM-2 aralıklı tekrar algoritmasıyla bilginizi unutulmaz kılın.",
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-sky-500/20">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
