import { SpeechToTextConfig } from './speech/types.js';
import { TextGenerationConfig } from './text/types.js';

export interface AIConfig {
    textGeneration: TextGenerationConfig;
    speechToText: SpeechToTextConfig;
}
