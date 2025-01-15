import { Injectable, OnModuleInit } from '@nestjs/common';
import { SentimentAnalyzer } from 'node-nlp';

export type SentimentType = 'GOOD' | 'MODERATE' | 'BAD';

type SupportedLanguages =
  | 'en'
  | 'es'
  | 'fr'
  | 'it'
  | 'nl'
  | 'id'
  | 'pt'
  | 'de'
  | 'ja'
  | 'zh';

@Injectable()
export class NlpService implements OnModuleInit {
  private analyzers: Map<SupportedLanguages, SentimentAnalyzer>;

  async onModuleInit() {
    // Initialize analyzers for all supported languages
    this.analyzers = new Map([
      ['en', new SentimentAnalyzer({ language: 'en' })], // English
      ['es', new SentimentAnalyzer({ language: 'es' })], // Spanish
      ['fr', new SentimentAnalyzer({ language: 'fr' })], // French
      ['it', new SentimentAnalyzer({ language: 'it' })], // Italian
      ['nl', new SentimentAnalyzer({ language: 'nl' })], // Dutch
      ['id', new SentimentAnalyzer({ language: 'id' })], // Indonesian
      ['pt', new SentimentAnalyzer({ language: 'pt' })], // Portuguese
      ['de', new SentimentAnalyzer({ language: 'de' })], // German
      ['ja', new SentimentAnalyzer({ language: 'ja' })], // Japanese
      ['zh', new SentimentAnalyzer({ language: 'zh' })], // Chinese
    ]);
  }

  private detectLanguage(text: string): SupportedLanguages {
    // Simple language detection based on character sets
    // You might want to use a more sophisticated language detection library
    if (/[\u3040-\u30ff]/.test(text)) return 'ja';
    if (/[\u4e00-\u9FFF]/.test(text)) return 'zh';
    if (/[áéíóúüñ¿¡]/.test(text)) return 'es';
    if (/[àâçéèêëîïôûùüÿñ]/.test(text)) return 'fr';
    if (/[àèéìíîòóùú]/.test(text)) return 'it';
    if (/[äöüß]/.test(text)) return 'de';
    // Default to English for Latin characters
    return 'en';
  }

  async evaluateContent(content: string): Promise<SentimentType> {
    const language = this.detectLanguage(content);
    const analyzer = this.analyzers.get(language) || this.analyzers.get('en');

    const result = await analyzer.getSentiment(content);

    // Adjust thresholds based on language characteristics
    const thresholds = {
      positive: language === 'ja' || language === 'zh' ? 0.2 : 0.3, // Asian languages tend to be more subtle
      negative: language === 'ja' || language === 'zh' ? -0.2 : -0.3,
    };

    if (result.score >= thresholds.positive) return 'GOOD';
    if (result.score <= thresholds.negative) return 'BAD';
    return 'MODERATE';
  }

  // Helper method to get supported languages
  getSupportedLanguages(): string[] {
    return Array.from(this.analyzers.keys());
  }
}
