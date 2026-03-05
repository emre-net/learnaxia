
"use client";

import { Search, LayoutGrid, List as ListIcon, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants/categories";

interface LibraryFiltersProps {
    searchQuery: string;
    onSearchChange: (val: string) => void;
    selectedType: string;
    onTypeChange: (val: string) => void;
    selectedCategory: string;
    onCategoryChange: (val: string) => void;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
    activeTab: string;
    dictionary: any;
}

export function LibraryFilters({
    searchQuery,
    onSearchChange,
    selectedType,
    onTypeChange,
    selectedCategory,
    onCategoryChange,
    viewMode,
    onViewModeChange,
    activeTab,
    dictionary
}: LibraryFiltersProps) {
    const studyDict = dictionary.study;

    return (
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
            <div className="relative flex-1 min-w-[200px] sm:flex-none sm:w-[260px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Ara..."
                    className="w-full pl-9"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                {activeTab === "modules" && (
                    <Select value={selectedType} onValueChange={onTypeChange}>
                        <SelectTrigger className="flex-1 sm:w-[130px] h-9">
                            <Filter className="mr-2 h-4 w-4 opacity-70" />
                            <SelectValue placeholder={studyDict.moduleTypes?.title || "Tip"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">{studyDict.moduleTypes?.all || "Tümü"}</SelectItem>
                            <SelectItem value="FLASHCARD">{studyDict.moduleTypes?.flashcard || "Kartlar"}</SelectItem>
                            <SelectItem value="MC">{studyDict.moduleTypes?.mc || "Quiz"}</SelectItem>
                            <SelectItem value="TRUE_FALSE">{studyDict.moduleTypes?.true_false || "D/Y"}</SelectItem>
                            <SelectItem value="GAP">{studyDict.moduleTypes?.gap || "Boşluk"}</SelectItem>
                        </SelectContent>
                    </Select>
                )}

                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                    <SelectTrigger className="flex-1 sm:w-[130px] h-9">
                        <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tüm Kategoriler</SelectItem>
                        {Object.keys(CATEGORIES).map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex items-center border rounded-md shrink-0">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => onViewModeChange('grid')}
                        className="rounded-none rounded-l-md h-9 w-9"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => onViewModeChange('list')}
                        className="rounded-none rounded-r-md h-9 w-9"
                    >
                        <ListIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
