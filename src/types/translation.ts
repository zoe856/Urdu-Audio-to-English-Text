export interface VocabularyItem {
  urdu: string;
  roman: string;
  english: string;
  context?: string;
}

export interface TranslationData {
  urduTranscript: string;
  romanUrdu: string;
  englishTranslation: string;
  formalTranslation?: string;
  casualTranslation?: string;
  literalTranslation?: string;
  toneDetected?: string;
  confidenceScore?: number;
  summary?: string;
  audioNotes?: string;
  vocabulary?: VocabularyItem[];
}

export interface ConversionRecord {
  id: string;
  timestamp: number;
  audioName: string;
  audioDataUrl?: string;
  audioDuration?: number;
  data: TranslationData;
  tone: 'natural' | 'formal' | 'casual' | 'literal';
}

export type TranslationTone = 'natural' | 'formal' | 'casual' | 'literal';
