'use server';

import OpenAI from 'openai';
import { MlbbScreenshotData } from '@/lib/types/stats-mlbb';

// Convert a File to base64 string
async function fileToBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return buffer.toString('base64');
}

/**
 * Extracts MLBB stats from an uploaded Equipment and Data screenshot using GPT-4o.
 */
export async function extractMlbbStatsFromImage(formData: FormData): Promise<{ success: boolean; data?: MlbbScreenshotData; error?: string }> {
  try {
    const equipmentFile = formData.get('equipment') as File | null;
    const dataFile = formData.get('data') as File | null;
    
    // We strictly require both now for accurate merging
    if (!equipmentFile || !dataFile) {
      return { success: false, error: 'Both Equipment and Data screenshots are required.' };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const equipmentBase64 = await fileToBase64(equipmentFile);
    const dataBase64 = await fileToBase64(dataFile);

    // Call OpenAI Vision model
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a highly accurate data extraction system specialized in reading Mobile Legends: Bang Bang (MLBB) post-match screens. 
You will be provided with TWO screenshots of the SAME match scoreboard: 
1. The "Equipment" tab (shows KDA, Gold, Rating/Score).
2. The "Data" tab (shows Damage, Turret Damage, Damage Taken, Teamfight participation).

Extract the match data and output perfectly compliant JSON exactly matching this structure (do NOT wrap in markdown blocks, just raw JSON):
{
  "matchResult": "VICTORY" | "DEFEAT",
  "score": {
    "blue": number,
    "red": number
  },
  "duration": string (MUST be strictly formatted as "MM:SS" e.g. "15:30" or "05:12"),
  "players": [ // Must be exactly 10 players, ordered exactly as they appear top-to-bottom on the screen
    {
      "heroName": string (leave empty if unknown, but try your best to identify from portrait),
      "playerName": string,
      "team": "Blue" | "Red", // Left side is Blue, Right side is Red
      "kda": {
        "kills": number,
        "deaths": number,
        "assists": number
      },
      "gold": number,
      "rating": number (e.g., 9.8),
      "badge": "MVP" | "Gold" | "Silver" | "Bronze" | null,
      "damageDealt": number (e.g. 45913),
      "turretDamage": number,
      "damageTaken": number,
      "teamfight": number (the percentage value, but as a raw number e.g. 57)
    }
  ]
}

Important Rules:
- The Left team is ALWAYS "Blue" and Right team is ALWAYS "Red".
- Be precise with K/D/A order.
- Gold often has commas or 'k', convert to standard integer (e.g. 5.5k -> 5500, 10,000 -> 10000).
- Teamfight is a percentage string like "40%", output it as integer 40.
- Match all players perfectly across both images (Top-to-Bottom order is identical on both tabs).`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Screenshot 1: Equipment Tab:" },
            {
              type: "image_url",
              image_url: { url: `data:${equipmentFile.type};base64,${equipmentBase64}` },
            },
            { type: "text", text: "Screenshot 2: Data Tab:" },
            {
              type: "image_url",
              image_url: { url: `data:${dataFile.type};base64,${dataBase64}` },
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

    const extractedData = JSON.parse(content) as MlbbScreenshotData;

    return {
      success: true,
      data: extractedData
    };

  } catch (error: any) {
    console.error('OCR Extraction Failed:', error);
    return { success: false, error: error?.message || 'Failed to process images via AI' };
  }
}
