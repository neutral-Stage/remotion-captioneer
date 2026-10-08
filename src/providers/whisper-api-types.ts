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
  /** Legacy `main` binary: segment timing in centiseconds */
  t0?: number;
  t1?: number;
  tokens?: WhisperCppToken[];
  /** Current `whisper-cli` json output: segment timing in milliseconds */
  offsets?: { from?: number; to?: number };
  timestamps?: { from?: string; to?: string };
  probability?: number;
}

export interface WhisperCppOutput {
  transcription?: WhisperCppSegment[];
  result?: { language?: string };
}
