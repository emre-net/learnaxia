"use client";

import { useEffect } from 'react';
import { EditorContent, useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Typography from '@tiptap/extension-typography';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { common, createLowlight } from 'lowlight';

import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Highlighter,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    List,
    ListOrdered,
    CheckSquare,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Code,
    Undo,
    Redo,
    Palette
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"


const lowlight = createLowlight(common);

export interface RichTextEditorProps {
    value?: string;
    onChange?: (richText: string) => void;
    placeholder?: string;
    className?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null;
    }

    const colors = [
        "#000000", "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7", "#ec4899",
        "#71717a", "#f87171", "#fb923c", "#facc15", "#4ade80", "#22d3ee", "#60a5fa", "#c084fc", "#f472b6"
    ];

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 rounded-t-[1.5rem]">
            {/* Formatting */}
            <div className="flex items-center gap-1 border-r border-zinc-200 dark:border-zinc-800 pr-2 mr-1">
                <Toggle
                    size="sm"
                    pressed={editor.isActive('bold')}
                    onPressedChange={() => editor.chain().focus().toggleBold().run()}
                    aria-label="Toggle bold"
                    className="h-8 w-8 p-0"
                >
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('italic')}
                    onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                    aria-label="Toggle italic"
                    className="h-8 w-8 p-0"
                >
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('underline')}
                    onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                    aria-label="Toggle underline"
                    className="h-8 w-8 p-0"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('strike')}
                    onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                    aria-label="Toggle strikethrough"
                    className="h-8 w-8 p-0"
                >
                    <Strikethrough className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('highlight')}
                    onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
                    aria-label="Toggle highlight"
                    className="h-8 w-8 p-0"
                >
                    <Highlighter className="h-4 w-4" />
                </Toggle>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Palette className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-44 p-2" align="start">
                        <div className="grid grid-cols-6 gap-1">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => editor.chain().focus().setColor(color).run()}
                                    className="h-6 w-6 border rounded-sm"
                                    style={{ backgroundColor: color }}
                                    aria-label={`Color ${color}`}
                                />
                            ))}
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().unsetColor().run()}
                                className="col-span-6 mt-1 text-xs py-1 rounded-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            >
                                Rengi Temizle
                            </button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Typography */}
            <div className="flex items-center gap-1 border-r border-zinc-200 dark:border-zinc-800 pr-2 mr-1">
                <Select
                    defaultValue="paragraph"
                    onValueChange={(value) => {
                        if (value === 'paragraph') {
                            editor.chain().focus().setParagraph().run();
                        } else if (value.startsWith('h')) {
                            const level = parseInt(value.replace('h', '')) as 1 | 2 | 3 | 4 | 5 | 6;
                            editor.chain().focus().toggleHeading({ level }).run();
                        }
                    }}
                >
                    <SelectTrigger className="h-8 w-[110px] text-xs font-medium border-0 bg-transparent focus:ring-0">
                        <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="paragraph">Normal Metin</SelectItem>
                        <SelectItem value="h1">Başlık 1</SelectItem>
                        <SelectItem value="h2">Başlık 2</SelectItem>
                        <SelectItem value="h3">Başlık 3</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-1 border-r border-zinc-200 dark:border-zinc-800 pr-2 mr-1">
                <Toggle size="sm" pressed={editor.isActive({ textAlign: 'left' })} onPressedChange={() => editor.chain().focus().setTextAlign('left').run()} className="h-8 w-8 p-0">
                    <AlignLeft className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive({ textAlign: 'center' })} onPressedChange={() => editor.chain().focus().setTextAlign('center').run()} className="h-8 w-8 p-0">
                    <AlignCenter className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive({ textAlign: 'right' })} onPressedChange={() => editor.chain().focus().setTextAlign('right').run()} className="h-8 w-8 p-0">
                    <AlignRight className="h-4 w-4" />
                </Toggle>
            </div>

            {/* Lists & Blocks */}
            <div className="flex items-center gap-1 border-r border-zinc-200 dark:border-zinc-800 pr-2 mr-1">
                <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} className="h-8 w-8 p-0">
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} className="h-8 w-8 p-0">
                    <ListOrdered className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive('taskList')} onPressedChange={() => editor.chain().focus().toggleTaskList().run()} className="h-8 w-8 p-0">
                    <CheckSquare className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive('blockquote')} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()} className="h-8 w-8 p-0">
                    <Quote className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive('codeBlock')} onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()} className="h-8 w-8 p-0">
                    <Code className="h-4 w-4" />
                </Toggle>
            </div>

            {/* Undo / Redo */}
            <div className="flex items-center gap-1 flex-1 justify-end">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                    <Undo className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                    <Redo className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export function RichTextEditor({ value = '', onChange, placeholder = "Notunuzu yazmaya başlayın...", className = "" }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                codeBlock: false, // We use lowlight
            }),
            Placeholder.configure({
                placeholder,
            }),
            Underline,
            Highlight,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            Typography,
            TaskList,
            TaskItem.configure({ nested: true }),
            CodeBlockLowlight.configure({ lowlight }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-6',
            },
        },
        onUpdate: ({ editor }) => {
            if (onChange) {
                // Return HTML string
                onChange(editor.getHTML());
            }
        },
    });

    useEffect(() => {
        if (editor && value && editor.getHTML() !== value) {
            // Only update if the passed value is entirely different from current editor HTML
            // Prevents cursor jumping issues when writing.
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    return (
        <div className={`w-full border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] bg-white dark:bg-zinc-950 shadow-sm overflow-hidden flex flex-col ${className}`}>
            <MenuBar editor={editor} />
            <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
                <EditorContent editor={editor} className="w-full h-full" />
            </div>
        </div>
    );
}
