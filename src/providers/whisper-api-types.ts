/**
 * Shared types for OpenAI-compatible verbose Whisper API responses.
 */

export interface WhisperApiWord {
  word: string;
  start: number;
  end: number;
}

export interface WhisperApiSegment {
  start: number;
  end: number;
  text: string;
}

export interface VerboseWhisperResponse {
  language?: string;
  duration?: number;
  segments?: WhisperApiSegment[];
  words?: WhisperApiWord[];
}

export interface DeepgramApiWord {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface DeepgramApiResponse {
  results?: {
    channels?: Array<{
      detected_language?: string;
      alternatives?: Array<{
        words?: DeepgramApiWord[];
      }>;
    }>;
  };
}

export interface WhisperCppToken {
  text?: string;
  t0?: number;
  t1?: number;
  p?: number;
}

export interface WhisperCppSegment {
  text?: string;
  t0?: number;
  t1?: number;
  tokens?: WhisperCppToken[];
}

export interface WhisperCppOutput {
  transcription?: WhisperCppSegment[];
  result?: { language?: string };
}
