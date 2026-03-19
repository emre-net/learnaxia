"use client"

import { MoreVertical, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserActionsProps {
    user: {
        id: string
        name: string | null
        email: string | null
        role: string
    }
}

export function UserActions({ user }: UserActionsProps) {
    const router = useRouter()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-slate-500" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
                <DropdownMenuLabel>Kullanıcı İşlemleri</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />

                <DropdownMenuItem
                    className="gap-2 cursor-pointer focus:bg-slate-800"
                    disabled
                >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Yakında...</span>
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    )
}
