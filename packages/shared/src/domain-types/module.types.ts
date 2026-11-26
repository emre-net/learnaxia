/**
 * Strict 4 homogeneous module question types (AGENTS.md Rule 3 & Rule 4).
 * Mixed / heterogeneous card modules are strictly prohibited.
 */
export type QuestionType = 'FLASHCARD' | 'MC' | 'TRUE_FALSE' | 'GAP';
export type ModuleType = QuestionType;

export type StudyMode = 'NORMAL' | 'WRONG_ONLY' | 'SM2' | 'REVIEW' | 'QUIZ' | 'AI_SMART';

export type ContentVisibility = 'PUBLIC' | 'PRIVATE';

export interface ModuleItemContent {
  // Flashcard
  front?: string;
  back?: string;
  // MC (Multiple Choice)
  question?: string;
  answer?: string;
  options?: string[];
  correctAnswer?: string | boolean;
  explanation?: string;
  solution?: string;
  // GAP (Fill in the blank)
  text?: string;      // e.g. "The {{capital}} of France is {{Paris}}."
  answers?: string[]; // e.g. ["capital", "Paris"]
  gap?: string;
  // TRUE_FALSE
  statement?: string;
  isTrue?: boolean;
  // Media & Legacy generic
  image?: string;
  imageUrl?: string;
  content?: string;
}

export interface ModuleItem {
  id: string;
  moduleId?: string;
  type: QuestionType | string;
  order: number;
  content: ModuleItemContent;
}

export interface StudyModule {
  id: string;
  title: string;
  type?: ModuleType;
  items: ModuleItem[];
  description?: string;
  category?: string | null;
  subCategory?: string | null;
  visibility?: ContentVisibility;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserModule {
  id: string;
  title: string;
  description?: string;
  itemCount: number;
  type: ModuleType;
}
