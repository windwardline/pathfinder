export class AIGateway {
  static async extractCandidateFacts(text: string) {
    // Stub implementation honoring ADR-003: AI extracts facts but cannot confirm them
    return [
      {
        key: 'ACTION',
        value: {
          title: 'Review document extracted by AI',
          description: text.substring(0, 50) + '...',
          status: 'OPEN'
        }
      }
    ];
  }

  static async generateExplanation(routeDiff: any) {
    // Stub implementation: explanation does not alter the Route
    return `The route was updated because new actions were added.`;
  }
}
