"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FolderPlus, Loader2, BookOpen, Globe, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CreateCollectionPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        // TODO: Call API to create collection
        setTimeout(() => {
            setIsLoading(false)
            router.push("/dashboard/library") // Redirect to library after creation
        }, 1500)
    }

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <div className="mb-8 text-center">
                <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-4">
                    <FolderPlus className="h-6 w-6" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Yeni Koleksiyon</h1>
                <p className="text-muted-foreground mt-2">
                    Benzer modülleri bir araya toplayarak çalışma setleri oluştur.
                </p>
            </div>

            <Card className="border-blue-500/20 shadow-lg">
                <form onSubmit={handleCreate}>
                    <CardHeader>
                        <CardTitle>Koleksiyon Detayları</CardTitle>
                        <CardDescription>
                            Koleksiyonuna bir isim ver ve içeriğini tanımla.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Koleksiyon Adı</Label>
                            <Input
                                id="title"
                                placeholder="Örn: İngilizce A1 Kelimeler, Tarih Notları..."
                                required
                                className="text-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
                            <Textarea
                                id="description"
                                placeholder="Bu koleksiyon ne hakkında?"
                                className="resize-none"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label>Görünürlük</Label>
                            <RadioGroup defaultValue="private" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <RadioGroupItem value="private" id="private" className="peer sr-only" />
                                    <Label
                                        htmlFor="private"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 [&:has([data-state=checked])]:border-blue-500 cursor-pointer"
                                    >
                                        <Lock className="mb-3 h-6 w-6 text-muted-foreground" />
                                        <div className="text-center">
                                            <span className="block font-semibold">Gizli</span>
                                            <span className="text-xs text-muted-foreground mt-1">Sadece sen görebilirsin</span>
                                        </div>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="public" id="public" className="peer sr-only" />
                                    <Label
                                        htmlFor="public"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 [&:has([data-state=checked])]:border-blue-500 cursor-pointer"
                                    >
                                        <Globe className="mb-3 h-6 w-6 text-muted-foreground" />
                                        <div className="text-center">
                                            <span className="block font-semibold">Herkese Açık</span>
                                            <span className="text-xs text-muted-foreground mt-1">Herkes erişebilir</span>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-4">
                        <Button variant="ghost" type="button" onClick={() => router.back()}>
                            İptal
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Oluşturuluyor...
                                </>
                            ) : (
                                <>
                                    <FolderPlus className="mr-2 h-4 w-4" />
                                    Koleksiyon Oluştur
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
