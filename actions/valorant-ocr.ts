'use server';

import OpenAI from 'openai';
import { ValorantScreenshotData } from '@/lib/types/stats-valorant';

// Convert a File to base64 string
async function fileToBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return buffer.toString('base64');
}

/**
 * Extracts Valorant stats from an uploaded image using GPT-4o.
 */
export async function extractValorantStatsFromImage(formData: FormData): Promise<{ success: boolean; data?: ValorantScreenshotData; error?: string }> {
  try {
    const file = formData.get('image') as File;
    if (!file) {
      return { success: false, error: 'No image provided' };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const base64Image = await fileToBase64(file);

    // Call OpenAI Vision model
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a highly accurate data extraction system specialized in reading Valorant post-match screens. 
You will be provided with a screenshot of the match scoreboard.

Extract the match data and output perfectly compliant JSON exactly matching this structure (do NOT wrap in markdown blocks, just raw JSON):
{
  "matchResult": "VICTORY" | "DEFEAT" | "DRAW",
  "score": {
    "ally": number, // Left side
    "enemy": number // Right side
  },
  "mapName": string (e.g. "Haven", "Ascent", "Bind"),
  "matchDuration": string (MUST be strictly formatted as "MM:SS" e.g. "15:30" or "05:12"),
  "players": [ // Must be exactly 10 players, ordered exactly as they appear top-to-bottom on the screen
    {
      "playerName": string (extract full name including tag if visible),
      "agentName": string (infer from portrait, usually very obvious like "Jett", "Reyna"),
      "team": "Ally" | "Enemy", // Usually top 5 are Ally, bottom 5 are Enemy, delineated by colored backgrounds
      "acs": number (Average Combat Score),
      "kda": {
        "kills": number,
        "deaths": number,
        "assists": number
      },
      "econRating": number,
      "firstBloods": number,
      "plants": number,
      "defuses": number
    }
  ]
}

Important Rules:
- Be precise with K/D/A order.
- Ensure all 10 players are accounted for exactly as they appear on the screen, visually top-to-bottom.
- Pay close attention to zeroes (0) vs letters (O).
- If plants/defuses are blank on the screen, use 0.
- Do NOT output markdown ticks like \`\`\`json.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Screenshot of the Valorant scoreboard:" },
            {
              type: "image_url",
              image_url: { url: `data:${file.type};base64,${base64Image}` },
            },
          ],
        }
      ],
      max_tokens: 1500,
      temperature: 0.1, // Low temp for more accurate data extraction
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const extractedData = JSON.parse(content) as ValorantScreenshotData;

    return {
      success: true,
      data: extractedData
    };

  } catch (error: any) {
    console.error('OCR Extraction Failed:', error);
    return { success: false, error: error?.message || 'Failed to process image via AI' };
  }
}
