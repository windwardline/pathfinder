export interface Provenance {
  sourceId: string;
  sourceType: 'document' | 'user' | 'system' | 'inference';
  extractedAt: Date;
  metadata?: Record<string, any>;
}
