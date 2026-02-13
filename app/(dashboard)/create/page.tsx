
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";

export default function CreatePage() {
    return (
        <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Create New Module</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Choose how you want to start building your learning content.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Manual Creation Card */}
                <Link href="/create/manual" className="group">
                    <Card className="h-full hover:border-primary transition-all hover:shadow-lg cursor-pointer flex flex-col">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <PenTool className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-2xl">Manual Creation</CardTitle>
                            <CardDescription>
                                Build from scratch. Best for when you have specific content or notes ready.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center">
                                    <BookOpen className="h-4 w-4 mr-2" /> Full control over every item
                                </li>
                                <li className="flex items-center">
                                    <BookOpen className="h-4 w-4 mr-2" /> Support for Flashcards, Multiple Choice, GAP
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full">Start Manual</Button>
                        </CardFooter>
                    </Card>
                </Link>

                {/* AI Generation Card (Future) */}
                <div className="group opacity-75 grayscale hover:grayscale-0 transition-all hover:opacity-100 relative">
                    {/* Coming Soon Overlay */}
                    <div className="absolute top-4 right-4 z-10">
                        <span className="bg-amber-500/10 text-amber-500 text-xs font-bold px-2 py-1 rounded-full border border-amber-500/20">
                            COMING SOON
                        </span>
                    </div>

                    <Card className="h-full border-dashed">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-2xl">AI Generation</CardTitle>
                            <CardDescription>
                                Generate modules instantly from text, PDFs, or topic keywords.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center">
                                    <Sparkles className="h-4 w-4 mr-2" /> Text-to-Flashcard
                                </li>
                                <li className="flex items-center">
                                    <Sparkles className="h-4 w-4 mr-2" /> PDF Processing
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button variant="secondary" className="w-full" disabled>Generate with AI</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
