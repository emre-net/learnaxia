
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Target, Zap, Clock } from "lucide-react";
import { EditProfileDialog } from "./edit-profile-dialog";

interface ProfileHeaderProps {
    user: {
        handle?: string | null;
        image?: string | null;
    };
    analyticsData: any | null;
}

export function ProfileHeader({ user, analyticsData }: ProfileHeaderProps) {
    return (
        <div className="relative mb-8">
            {/* Cover Area */}
            <div className="h-48 w-full rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0],
                            x: [0, 50, 0],
                            y: [0, -20, 0]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.5, 1],
                            rotate: [0, -120, 0],
                            x: [0, -40, 0],
                            y: [0, 30, 0]
                        }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]"
                    />
                </div>
                <div className="absolute inset-0 bg-[#00000020] backdrop-blur-[2px]"></div>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
            </div>

            {/* Profile Info Card - Floating */}
            <div className="absolute -bottom-12 left-6 right-6 md:left-10 md:right-auto md:w-auto flex items-end gap-6">
                <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-xl rounded-2xl">
                        <AvatarImage src={user.image || ""} alt={user.handle || ""} className="object-cover" />
                        <AvatarFallback className="text-4xl bg-muted rounded-2xl">
                            {user.handle?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                </div>

                <div className="mb-4 flex-1 md:flex-none">
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{user.handle}</h2>
                        <EditProfileDialog user={user} trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        } />
                    </div>
                    <p className="text-muted-foreground font-medium">@{user.handle || "kullanici"}</p>
                </div>

                {/* Desktop Stats */}
                <div className="hidden lg:flex gap-6 mb-6 ml-12 -translate-y-4">
                    <AnimatePresence>
                        {analyticsData?.stats && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-background/40 backdrop-blur-xl p-4 rounded-xl border border-white/10 shadow-2xl flex items-center gap-4 min-w-[140px]"
                                >
                                    <div className="bg-blue-500/20 p-2 rounded-lg">
                                        <Target className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Başarı</span>
                                        <span className="text-2xl font-black text-foreground tabular-nums">
                                            %{analyticsData.stats?.globalAccuracy ?? 0}
                                        </span>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-background/40 backdrop-blur-xl p-4 rounded-xl border border-white/10 shadow-2xl flex items-center gap-4 min-w-[140px]"
                                >
                                    <div className="bg-purple-500/20 p-2 rounded-lg">
                                        <Zap className="h-6 w-6 text-purple-500 fill-purple-500/20" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Soru</span>
                                        <span className="text-2xl font-black text-foreground tabular-nums">
                                            {analyticsData.stats?.totalSolved ?? 0}
                                        </span>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-background/40 backdrop-blur-xl p-4 rounded-xl border border-white/10 shadow-2xl flex items-center gap-4 min-w-[140px]"
                                >
                                    <div className="bg-emerald-500/20 p-2 rounded-lg">
                                        <Clock className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Süre</span>
                                        <span className="text-2xl font-black text-foreground tabular-nums">
                                            {(analyticsData.stats?.totalStudyMinutes ?? 0) > 60
                                                ? `${Math.floor((analyticsData.stats?.totalStudyMinutes ?? 0) / 60)}s`
                                                : `${analyticsData.stats?.totalStudyMinutes ?? 0}dk`}
                                        </span>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
