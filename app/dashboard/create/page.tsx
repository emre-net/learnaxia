
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
                <Link href="/dashboard/create/manual" className="group">
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

                {/* AI Generation Card */}
                <Link href="/dashboard/create/ai" className="group">
                    <Card className="h-full border-purple-500/20 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles className="h-32 w-32 text-purple-500 rotate-12" />
                        </div>

                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-2xl">AI Generation</CardTitle>
                            <CardDescription>
                                Generate modules instantly from text, PDFs, or topic keywords.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 relative z-10">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center">
                                    <Sparkles className="h-4 w-4 mr-2 text-purple-500" /> Text-to-Flashcard
                                </li>
                                <li className="flex items-center">
                                    <Sparkles className="h-4 w-4 mr-2 text-purple-500" /> Multi-Type Support
                                </li>
                                <li className="flex items-center">
                                    <Sparkles className="h-4 w-4 mr-2 text-purple-500" /> Instant ready-to-study
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button variant="secondary" className="w-full bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white border-purple-200">Generate with AI</Button>
                        </CardFooter>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
