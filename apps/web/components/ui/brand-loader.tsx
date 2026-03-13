"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BrandLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  showBlur?: boolean;
}

export function BrandLoader({ className, size = "md", label, showBlur = true }: BrandLoaderProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Animated Background Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-purple-500 animate-[spin_1.5s_linear_infinite]" />
        
        {/* Pulsing Core */}
        {showBlur && (
          <div className="absolute inset-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full filter blur-[2px] animate-pulse opacity-20" />
        )}
        
        {/* Learnaxia Logo Shape (Stylized 'L') */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full p-2.5 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
        >
          <path
            d="M8 4V16C8 18 9 20 12 20H18"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-[draw_2s_ease-in-out_infinite]"
          />
          <path
            d="M14 6L16 4L14 2"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse"
          />
        </svg>
      </div>
      
      {label && (
        <p className="text-slate-400 text-sm font-medium animate-pulse tracking-wide">
          {label}
        </p>
      )}

      <style jsx global>{`
        @keyframes draw {
          0% { stroke-dasharray: 0 100; stroke-dashoffset: 0; }
          50% { stroke-dasharray: 100 0; stroke-dashoffset: 0; }
          100% { stroke-dasharray: 0 100; stroke-dashoffset: -100; }
        }
      `}</style>
    </div>
  );
}
