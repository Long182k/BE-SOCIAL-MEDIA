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
    this.analyzers = new Map([
      ['en', new SentimentAnalyzer({ language: 'en' })],
      ['es', new SentimentAnalyzer({ language: 'es' })],
      ['fr', new SentimentAnalyzer({ language: 'fr' })],
      ['it', new SentimentAnalyzer({ language: 'it' })],
      ['nl', new SentimentAnalyzer({ language: 'nl' })],
      ['id', new SentimentAnalyzer({ language: 'id' })],
      ['pt', new SentimentAnalyzer({ language: 'pt' })],
      ['de', new SentimentAnalyzer({ language: 'de' })],
      ['ja', new SentimentAnalyzer({ language: 'ja' })],
      ['zh', new SentimentAnalyzer({ language: 'zh' })],
    ]);
  }

  private detectLanguage(text: string): SupportedLanguages {
    if (/[\u3040-\u30ff]/.test(text)) return 'ja';
    if (/[\u4e00-\u9FFF]/.test(text)) return 'zh';
    if (/[áéíóúüñ¿¡]/.test(text)) return 'es';
    if (/[àâçéèêëîïôûùüÿñ]/.test(text)) return 'fr';
    if (/[àèéìíîòóùú]/.test(text)) return 'it';
    if (/[äöüß]/.test(text)) return 'de';

    return 'en';
  }

  async evaluateContent(content: string): Promise<SentimentType> {
    const language = this.detectLanguage(content);
    const analyzer = this.analyzers.get(language) || this.analyzers.get('en');

    const result = await analyzer.getSentiment(content);

    const thresholds = {
      positive: language === 'ja' || language === 'zh' ? 0.2 : 0.3,
      negative: language === 'ja' || language === 'zh' ? -0.2 : -0.3,
    };

    if (result.score >= thresholds.positive) return 'GOOD';
    if (result.score <= thresholds.negative) return 'BAD';
    return 'MODERATE';
  }

  getSupportedLanguages(): string[] {
    return Array.from(this.analyzers.keys());
  }
}
