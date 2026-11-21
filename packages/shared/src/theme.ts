/**
 * LearnAxia — Design System Tokens
 * Human-Centered Dark Zinc Design Standard (Anti-AI Generated Look).
 * Avoids harsh #000000 / #FFFFFF halation.
 */

export const Theme = {
    colors: {
        // Human-Centered Deep Dark Zinc (Linear / Apple / Notion Aesthetic)
        background: '#09090b', // Deep dark zinc canvas (not pitch black)
        foreground: '#f4f4f5', // Soft off-white text (no halation)
        
        // Surface Elevation (Z-Space Layering)
        card: '#121215', // Base card elevation
        cardSecondary: '#18181b', // Nested/hover elevation
        cardForeground: '#f4f4f5',
        popover: '#18181b',
        popoverForeground: '#f4f4f5',
        
        // Brand & Accents (Subtly Desaturated for Comfort)
        primary: '#38bdf8', // Sky Cyan
        primaryForeground: '#09090b',
        secondary: '#18181b',
        secondaryForeground: '#f4f4f5',
        muted: '#18181b',
        mutedForeground: '#a1a1aa', // High-legibility neutral gray
        accent: '#6366f1', // Linear Indigo Accent
        accentForeground: '#f4f4f5',
        destructive: '#ef4444', // Softened Red
        destructiveForeground: '#f4f4f5',
        success: '#10b981', // Emerald
        warning: '#f59e0b', // Amber
        
        // Crisp 1px Borders
        border: '#27272a', // Subtle crisp border
        borderSubtle: '#1f1f23',
        input: '#18181b',
        ring: '#38bdf8',

        // Brand Accents
        brandBlue: '#38bdf8',
        brandIndigo: '#6366f1',
    },
    typography: {
        fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
        }
    },
    radii: {
        sm: 6,
        md: 10,
        lg: 16,
        xl: 24,
        pill: 9999,
    },
    gradients: {
        primary: ['#121215', '#09090b'],
        surface: ['#18181b', '#121215'],
        blue: ['#38bdf8', '#0284c7'],
        indigo: ['#818cf8', '#6366f1'],
    }
};
