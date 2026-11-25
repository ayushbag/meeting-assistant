import { EmbeddingsConfig } from './embeddings/types.js';
import { SpeechToTextConfig } from './speech/types.js';
import { TextGenerationConfig } from './text/types.js';

export interface AIConfig {
    textGeneration: TextGenerationConfig;
    speechToText: SpeechToTextConfig;
    embeddings: EmbeddingsConfig,
}
