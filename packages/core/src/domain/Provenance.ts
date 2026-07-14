/**
 * Canonical provenance shape used across the domain, the API, and the
 * provenance table. Every route-affecting Fact must carry provenance.
 */
export interface Provenance {
  /** e.g. 'ai_extraction', 'user_input', 'user_confirmation', 'user_completion', 'seed_demonstration' */
  source: string;
  /** Extraction confidence 1-100. Confidence never equals confirmation. */
  confidence?: number;
  /** Human-auditable excerpt of the originating evidence. */
  sourceText?: string;
  derivedFromFactId?: string;
}
