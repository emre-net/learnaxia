
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n/i18n";
import { getDictionary } from "@/lib/i18n/dictionaries"; // Still needed for some components or fallback

// Sub-components
import { LibraryHeader } from "./library-header";
import { LibraryFilters } from "./library-filters";
import { ModulesTab } from "./modules-tab";
import { CollectionsTab } from "./collections-tab";
import { NotesTab } from "./notes-tab";
import { LearningsTab } from "./learnings-tab";
import { AiSolutionsTab } from "./ai-solutions-tab";

// Types
import { SolvedQuestion, Note as PrismaNote } from "@prisma/client";

type NoteWithSource = PrismaNote & {
    module?: { title: string } | null;
    solvedQuestion?: { questionText: string } | null;
};

export function LibraryClient() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string>("ALL");
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [activeTab, setActiveTab] = useState("modules");

    const { t, language } = useTranslation();
    const dictionary = getDictionary(language);

    const { data: aiSolutions, isLoading: isLoadingSolutions } = useQuery<SolvedQuestion[]>({
        queryKey: ['ai-solutions'],
        queryFn: async () => {
            const res = await fetch('/api/solved-questions');
            if (!res.ok) throw new Error('Failed to fetch solutions');
            return res.json();
        }
    });

    return (
        <div className="space-y-6">
            <LibraryHeader
                title={t('library.header.title')}
                description={t('library.header.description')}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex flex-col gap-4">
                    <TabsList className="w-full flex justify-start sm:justify-center lg:justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap h-auto p-1 pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                        <TabsTrigger value="modules" className="flex-shrink-0">{t('library.tabs.modules')}</TabsTrigger>
                        <TabsTrigger value="collections" className="flex-shrink-0">{t('library.tabs.collections')}</TabsTrigger>
                        <TabsTrigger value="notes" className="flex-shrink-0">{t('library.tabs.notes')}</TabsTrigger>
                        <TabsTrigger value="learnings" className="flex-shrink-0">{t('library.tabs.learnings')}</TabsTrigger>
                        <TabsTrigger value="ai-solutions" className="flex-shrink-0">{t('library.tabs.aiSolutions')}</TabsTrigger>
                    </TabsList>

                    <LibraryFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        selectedType={selectedType}
                        onTypeChange={setSelectedType}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        activeTab={activeTab}
                        dictionary={dictionary}
                    />
                </div>

                <TabsContent value="modules" className="space-y-4 !mt-8">
                    <ModulesTab
                        viewMode={viewMode}
                        searchQuery={searchQuery}
                        selectedType={selectedType}
                        selectedCategory={selectedCategory}
                    />
                </TabsContent>

                <TabsContent value="collections" className="space-y-4">
                    <CollectionsTab
                        viewMode={viewMode}
                        searchQuery={searchQuery}
                        selectedCategory={selectedCategory}
                    />
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                    <NotesTab
                        viewMode={viewMode}
                        dictionary={dictionary}
                    />
                </TabsContent>

                <TabsContent value="learnings" className="space-y-4">
                    <LearningsTab
                        viewMode={viewMode}
                        searchQuery={searchQuery}
                        dictionary={dictionary}
                    />
                </TabsContent>

                <TabsContent value="ai-solutions" className="space-y-4">
                    <AiSolutionsTab
                        solutions={aiSolutions}
                        isLoading={isLoadingSolutions}
                        viewMode={viewMode}
                        dictionary={dictionary}
                    />
                </TabsContent>
            </Tabs>
        </div >
    );
}
