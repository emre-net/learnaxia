import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { PricingSection } from "@/components/landing/pricing-section";

export const metadata = {
    title: "Ücretsiz Model & AI Jeton Ekonomisi | Learnaxia",
    description: "Learnaxia tüm öğrenciler için ücretsizdir. AI üretimleri günlük ücretsiz jeton ve isteğe bağlı ödüllü reklam desteğiyle çalışır.",
};

export default function PricingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-sky-500/20">
            <Navbar />
            <main className="flex-1 pt-24 pb-12">
                <PricingSection />
            </main>
            <Footer />
        </div>
    );
}

