import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EpisodeAnalysis {
  summary: string;
  topics: string[];
  entities: string[];
  tone: string;
  sentiment: string;
  brand_safety_score: number;
  iab_categories: string[];
  contextual_segments: string[];
}

export async function analyzeEpisode(
  input: string,
  title?: string
): Promise<EpisodeAnalysis> {
  const prompt = `You are Modulr Studio's contextual intelligence engine for podcast and audio content analysis.

Analyze the following podcast episode content and return a JSON object with the following structure:
{
  "summary": "A concise 2-3 sentence summary of the episode content",
  "topics": ["topic1", "topic2", "topic3"],
  "entities": ["entity1", "entity2", "entity3"],
  "tone": "professional|casual|conversational|educational|entertaining",
  "sentiment": "positive|neutral|negative",
  "brand_safety_score": 0-10,
  "iab_categories": ["IAB1", "IAB2", "IAB3"],
  "contextual_segments": ["segment1", "segment2", "segment3"]
}

Guidelines:
- topics: Extract 5-10 main topics discussed (be specific)
- entities: Extract 5-10 key people, places, brands, or organizations mentioned
- tone: Choose the primary tone from the options above
- sentiment: Assess overall sentiment of the content
- brand_safety_score: Rate 0-10 where 10 is completely brand-safe (no profanity, violence, controversial content)
- iab_categories: Use IAB Content Taxonomy 2.0 categories (e.g., "IAB1" for Arts & Entertainment, "IAB2" for Automotive, etc.)
- contextual_segments: Identify 3-5 specific contextual segments that would be valuable for advertisers (e.g., "tech-savvy professionals", "health & wellness enthusiasts")

${title ? `Episode Title: ${title}\n\n` : ""}Content to analyze:
${input}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a precise contextual classifier for audio content. Always return valid JSON without markdown formatting.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  try {
    const analysis = JSON.parse(content) as EpisodeAnalysis;
    
    // Validate required fields
    if (
      typeof analysis.brand_safety_score !== "number" ||
      analysis.brand_safety_score < 0 ||
      analysis.brand_safety_score > 10
    ) {
      throw new Error("Invalid brand_safety_score");
    }

    return {
      summary: analysis.summary || "",
      topics: Array.isArray(analysis.topics) ? analysis.topics : [],
      entities: Array.isArray(analysis.entities) ? analysis.entities : [],
      tone: analysis.tone || "neutral",
      sentiment: analysis.sentiment || "neutral",
      brand_safety_score: analysis.brand_safety_score,
      iab_categories: Array.isArray(analysis.iab_categories) ? analysis.iab_categories : [],
      contextual_segments: Array.isArray(analysis.contextual_segments) ? analysis.contextual_segments : [],
    };
  } catch (error) {
    throw new Error(`Failed to parse OpenAI response: ${error}`);
  }
}
