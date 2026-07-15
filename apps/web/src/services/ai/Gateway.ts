import Groq from 'groq-sdk';
import { z } from 'zod';
import { extractedFactCandidatesSchema } from '@/lib/validation';
import { PromptRegistry } from './PromptRegistry';

// AI boundary (ADR-003): the model may interpret, extract, summarize, and
// explain. It never sequences, prioritizes, or confirms facts. Extraction
// output only ever becomes Proposed Facts awaiting explicit user review.

const DEFAULT_MODEL = 'openai/gpt-oss-120b';

let _groq: Groq | null = null;
const getGroq = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new ExtractionUnavailableError('GROQ_API_KEY is not configured.');
  }
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
};

export class ExtractionUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExtractionUnavailableError';
  }
}

export type ExtractedCandidate = z.infer<typeof extractedFactCandidatesSchema>[number];

export class AIGateway {
  /**
   * Extract candidate actions from free text. Returns validated candidates or
   * throws ExtractionUnavailableError — failures are never silently converted
   * to an empty result.
   */
  static async extractCandidateFacts(text: string): Promise<ExtractedCandidate[]> {
    const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
    const startedAt = performance.now();
    let content: string | null | undefined;
    try {
      const response = await getGroq().chat.completions.create({
        messages: [
          { role: 'system', content: PromptRegistry.candidateFacts.system },
          { role: 'user', content: PromptRegistry.candidateFacts.user(text) },
        ],
        model,
        response_format: { type: 'json_object' },
        temperature: PromptRegistry.candidateFacts.modelConstraints.temperature,
        max_completion_tokens:
          PromptRegistry.candidateFacts.modelConstraints.maxOutputTokens,
      });
      content = response.choices[0]?.message?.content;
    } catch (e) {
      if (e instanceof ExtractionUnavailableError) throw e;
      console.error('Groq extraction call failed:', e);
      throw new ExtractionUnavailableError('The extraction service is unavailable.');
    }

    if (!content) {
      throw new ExtractionUnavailableError('The extraction service returned no content.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new ExtractionUnavailableError('The extraction service returned invalid JSON.');
    }

    const facts = z
      .object({ facts: extractedFactCandidatesSchema })
      .safeParse(parsed);
    if (!facts.success) {
      console.error('Extraction output failed validation:', facts.error.message);
      throw new ExtractionUnavailableError('The extraction service returned an unexpected shape.');
    }

    console.info(
      JSON.stringify({
        service: 'ai-gateway',
        operation: 'candidate_fact_extraction',
        outcome: 'success',
        prompt_version: PromptRegistry.candidateFacts.version,
        model,
        candidate_count: facts.data.facts.length,
        duration_ms: Math.round(performance.now() - startedAt),
      })
    );

    return facts.data.facts;
  }
}
