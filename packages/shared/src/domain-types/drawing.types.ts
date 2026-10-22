export interface DrawingPath {
    id: string;
    d: string;          // SVG path string (e.g. "M 10 10 Q 15 20, 30 30")
    color: string;      // Hex color
    strokeWidth: number;// Width in px (e.g. 2, 4, 8)
    tool: 'pen' | 'highlighter' | 'eraser';
    opacity?: number;   // 1.0 for pen, 0.35 for highlighter
}

export interface DrawingCanvasData {
    version: 1;
    paths: DrawingPath[];
    canvasHeight?: number;
    backgroundColor?: string;
    updatedAt?: number;
}
