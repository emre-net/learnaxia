---
name: drawing-canvas-engine
description: Architecture, components, and implementation guidelines for adding freehand drawing, sketching, stylus, and handwriting support to LearnAxia Notes. Use when implementing canvas drawing, sketch pads, Apple Pencil/stylus input, or vector path serialization.
triggers: [drawing-canvas, handwriting-notes, stylus-input, sketch-notes]
---

# Drawing Canvas Engine & Handwriting Notes

## Purpose
Enables users to take freehand handwritten notes, draw diagrams, solve math formulas, and sketch directly within LearnAxia on Mobile (React Native) and Web without requiring external apps or clunky image uploads.

---

## 1. Technical Stack & Primitives

- **React Native Engine:** `react-native-svg` (or `@shopify/react-native-skia` if advanced shaders/filters are needed).
- **Gesture Handling:** `react-native-gesture-handler` (`Gesture.Pan()`) with `react-native-reanimated` for 60/120fps smooth stroke tracking without bridge delays.
- **Data Representation:** Quadratic Bézier Curves (`Q x1 y1, x y`) or SVG `<Path>` string segments to ensure vector crispness on all screen densities and zoom levels.

---

## 2. Path Data Structure

Each stroke is stored as a lightweight JSON object:

```typescript
export interface DrawingPath {
    id: string;
    d: string;          // SVG path data string (e.g. "M 10 10 Q 15 20, 30 30")
    color: string;      // Hex color (e.g. "#F8FAFC", "#38BDF8")
    strokeWidth: number;// Width in px (e.g. 2, 4, 8)
    tool: 'pen' | 'highlighter' | 'eraser';
    opacity?: number;   // 1.0 for pen, 0.3 for highlighter
}

export interface DrawingCanvasData {
    version: 1;
    paths: DrawingPath[];
    canvasHeight: number;
    backgroundColor?: string;
}
```

---

## 3. Core Features & UX Toolbar

1. **Tools:**
   - 🖊️ **Pen (Kalem):** Solid strokes with anti-aliasing.
   - 🖍️ **Highlighter (Vurgulayıcı):** Semi-transparent (0.35 opacity) wide stroke.
   - 🧹 **Eraser (Silgi):** Stroke eraser (tıklanan çizgiyi siler) veya alan silgisi.
   - ↩️ **Undo / Redo:** Geri ve ileri alma geçmiş yığını (`historyStack`).
2. **Palette:**
   - Preset curated colors: `#FFFFFF`, `#38BDF8` (Cyan), `#A855F7` (Purple), `#34D399` (Emerald), `#F59E0B` (Amber), `#EF4444` (Coral).
   - 3 stroke widths: Fine (2px), Medium (4px), Bold (8px).
3. **Hybrid Note Layout:**
   - Notes can contain **both** structured text/markdown AND embedded drawing canvas sections.
   - Users can tap a button: `+ Çizim Alanı Ekle` to drop a drawing canvas directly below a note block.
