"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
}

export function BrandLoader({ className, size = "md", label }: BrandLoaderProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className={cn("relative drop-shadow-xl", sizeClasses[size])}>
        {/* Faded/Grayscale Background Logo */}
        <div className="absolute inset-0 opacity-20 dark:opacity-30">
          <Image src="/logo.png" alt="Loading Background" fill className="object-contain" priority />
        </div>
        
        {/* Sweeping Foreground Logo */}
        <div className="absolute inset-0 animate-[sweep_2s_ease-in-out_infinite]">
          <Image 
            src="/logo.png" 
            alt="Loading Foreground" 
            fill 
            className="object-contain drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]" 
            priority
          />
        </div>
      </div>
      
      {label && (
        <p className="text-blue-400 text-xs font-bold animate-pulse tracking-[0.2em] uppercase">
          {label}
        </p>
      )}

      <style jsx global>{`
        @keyframes sweep {
          0% { clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); }
          50% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
          100% { clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%); }
        }
      `}</style>
    </div>
  );
}
