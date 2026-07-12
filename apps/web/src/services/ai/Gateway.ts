import Groq from 'groq-sdk';

let _groq: Groq | null = null;
const getGroq = () => {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' }); // Will error if empty at runtime instead of build time
  }
  return _groq;
};

export class AIGateway {
  static async extractCandidateFacts(text: string) {
    try {
      const response = await getGroq().chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You extract factual statements relating to tasks, deadlines, obligations, or constraints. You MUST return a JSON object with a single key 'facts' containing an array of objects. Each object must have 'factText' (string) and 'confidence' (integer 1-100)."
          },
          {
            role: "user",
            content: text
          }
        ],
        model: "llama3-8b-8192", // Using an extremely fast Groq model
        response_format: { type: "json_object" },
      });

      const resultText = response.choices[0]?.message?.content || '{"facts": []}';
      const parsed = JSON.parse(resultText);
      return parsed.facts || [];
    } catch (e) {
      console.error("Failed to parse Groq response:", e);
      return [];
    }
  }

  static async generateExplanation(routeDiff: any) {
    try {
      const response = await getGroq().chat.completions.create({
        messages: [
          {
            role: "user",
            content: `Explain in one short sentence why this task list route changed based on these differences: ${JSON.stringify(routeDiff)}`
          }
        ],
        model: "llama3-8b-8192",
      });
      return response.choices[0]?.message?.content || "No explanation could be generated.";
    } catch (e) {
      return "Explanation generation failed.";
    }
  }
}
