
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModuleFormData } from "./manual-creation-wizard";

export function BasicInfoStep() {
    const { control } = useFormContext<ModuleFormData>();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <FormField
                control={control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Module Title</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Spanish Vocabulary A1" {...field} />
                        </FormControl>
                        <FormDescription>
                            A clear and descriptive name for your learning module.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="What will you learn in this module?"
                                className="resize-none h-24"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="type"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Content Type</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                            >
                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="FLASHCARD" className="peer sr-only" />
                                    </FormControl>
                                    <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                        <span className="mb-2 text-xl">🃏</span>
                                        <span className="font-semibold">Flashcard</span>
                                        <span className="text-xs text-muted-foreground text-center mt-1">Front/Back cards. Best for memory.</span>
                                    </FormLabel>
                                </FormItem>

                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="MC" className="peer sr-only" />
                                    </FormControl>
                                    <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                        <span className="mb-2 text-xl">☑️</span>
                                        <span className="font-semibold">Multiple Choice</span>
                                        <span className="text-xs text-muted-foreground text-center mt-1">Quiz style with options.</span>
                                    </FormLabel>
                                </FormItem>

                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="GAP" className="peer sr-only" />
                                    </FormControl>
                                    <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                        <span className="mb-2 text-xl">📝</span>
                                        <span className="font-semibold">Fill in Gaps</span>
                                        <span className="text-xs text-muted-foreground text-center mt-1">Cloze tests. Best for grammar.</span>
                                    </FormLabel>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
