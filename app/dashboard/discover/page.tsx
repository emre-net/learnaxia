
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DiscoverPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                <Compass className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Keşfet</h1>
            <p className="text-muted-foreground max-w-md mb-8">
                Topluluk tarafından oluşturulan modülleri keşfedin ve öğrenme deneyiminizi zenginleştirin. Çok yakında!
            </p>
            <Button variant="outline" disabled>Çok Yakında</Button>
        </div>
    );
}
