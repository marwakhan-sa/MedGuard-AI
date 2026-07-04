import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// List of preseeded common medications for instant autocompletion
const COMMON_DRUGS = [
  { name: "Lisinopril", rxcui: "29046" },
  { name: "Levothyroxine", rxcui: "1151130" },
  { name: "Atorvastatin", rxcui: "83367" },
  { name: "Metformin", rxcui: "6809" },
  { name: "Metoprolol", rxcui: "6918" },
  { name: "Amlodipine", rxcui: "17767" },
  { name: "Albuterol", rxcui: "435" },
  { name: "Omeprazole", rxcui: "7646" },
  { name: "Losartan", rxcui: "52210" },
  { name: "Gabapentin", rxcui: "25480" },
  { name: "Hydrochlorothiazide", rxcui: "5487" },
  { name: "Sertraline", rxcui: "36437" },
  { name: "Simvastatin", rxcui: "36567" },
  { name: "Montelukast", rxcui: "79140" },
  { name: "Escitalopram", rxcui: "358259" },
  { name: "Acetaminophen", rxcui: "161" },
  { name: "Ibuprofen", rxcui: "5640" },
  { name: "Aspirin", rxcui: "1191" },
  { name: "Warfarin", rxcui: "11289" },
  { name: "Clopidogrel", rxcui: "32968" },
  { name: "Eliquis", rxcui: "1364430" },
  { name: "Xarelto", rxcui: "1114195" },
  { name: "Spironolactone", rxcui: "9997" },
  { name: "Furosemide", rxcui: "4603" },
  { name: "Carvedilol", rxcui: "20352" },
  { name: "Pantoprazole", rxcui: "40254" },
  { name: "Amoxicillin", rxcui: "723" },
  { name: "Prednisone", rxcui: "8640" },
  { name: "Tramadol", rxcui: "10689" },
  { name: "Fluoxetine", rxcui: "4493" },
  { name: "Zoloft", rxcui: "1310651" },
  { name: "Lipitor", rxcui: "153165" },
  { name: "Synthroid", rxcui: "212130" },
  { name: "Xanax", rxcui: "11170" },
  { name: "Adderall", rxcui: "213462" },
  { name: "Wellbutrin", rxcui: "111538" },
  { name: "Plavix", rxcui: "1307049" },
  { name: "Coumadin", rxcui: "152085" },
  { name: "Lyrica", rxcui: "588484" },
  { name: "Prozac", rxcui: "11162" },
  { name: "Lexapro", rxcui: "318274" },
  { name: "Vicodin", rxcui: "153592" },
  { name: "Tylenol", rxcui: "202433" },
  { name: "Advil", rxcui: "153010" }
];

// Lazy-initialized Gemini API client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured on the server. Please add it to your secrets configuration.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiInstance;
}

// In-memory caches to save API quota and make responses instant
const searchCache = new Map<string, any>();
const interactionCache = new Map<string, any>();
const analyzeCache = new Map<string, any>();

// Robust wrapper with exponential backoff retry and model fallback (gemini-3.5-flash -> gemini-3.1-flash-lite)
async function callGeminiWithFallback(
  systemInstruction: string,
  promptText: string,
  responseSchema: any,
  preferredModel = "gemini-3.5-flash"
): Promise<string> {
  const modelsToTry = [preferredModel, "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let retries = 2;
    while (retries >= 0) {
      try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: model,
          contents: promptText,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
          }
        });
        if (response.text) {
          return response.text;
        }
        throw new Error("Empty response from AI");
      } catch (err: any) {
        lastError = err;
        const errStr = String(err.message || err);
        const isRateLimit = 
          errStr.includes("429") || 
          errStr.toLowerCase().includes("quota") || 
          errStr.toLowerCase().includes("resource_exhausted") || 
          errStr.toLowerCase().includes("rate limit");
        
        if (isRateLimit) {
          console.warn(`Gemini model ${model} rate-limited. Retries remaining: ${retries}. Error: ${errStr}`);
          if (retries > 0) {
            // Exponential backoff delay
            const delay = (3 - retries) * 1500;
            await new Promise(resolve => setTimeout(resolve, delay));
            retries--;
            continue;
          }
        }
        break;
      }
    }
  }
  throw lastError || new Error("Failed to generate content with Gemini models.");
}

// 1. Search Drug endpoint (with local matching + RxNav approximate search fallback + Gemini brand resolution)
app.get("/api/drugs/search", async (req, res) => {
  try {
    const query = (req.query.q as string || "").trim();
    if (!query) {
      return res.json([]);
    }

    const lowercaseQuery = query.toLowerCase();
    
    // Check cache first
    if (searchCache.has(lowercaseQuery)) {
      return res.json(searchCache.get(lowercaseQuery));
    }

    // Find local matches
    const localMatches = COMMON_DRUGS.filter(drug => 
      drug.name.toLowerCase().includes(lowercaseQuery)
    );

    // If query has at least 3 chars, query RxNav REST API as well
    let rxNavMatches: { name: string; rxcui: string }[] = [];
    if (query.length >= 3) {
      try {
        const url = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(query)}&maxEntries=12`;
        const response = await fetch(url, { headers: { "Accept": "application/json" } });
        if (response.ok) {
          const data = await response.json();
          const candidates = data?.approximateGroup?.candidate || [];
          for (const candidate of candidates) {
            const rxName = candidate.name || candidate.rxconcept?.name;
            if (candidate.rxcui && rxName) {
              rxNavMatches.push({
                name: rxName,
                rxcui: candidate.rxcui
              });
            }
          }
        }
      } catch (err) {
        console.error("RxNav API fetch failed, using local fallback", err);
      }
    }

    // Call Gemini API to smartly resolve international brand names, misspellings, or regional variations (like Rizek -> Omeprazole)
    let aiMatches: { name: string; rxcui: string }[] = [];
    if (query.length >= 3) {
      try {
        const systemInstruction = 
          "You are a medical drug database expert. Resolve the user's search query (which may be an international brand name, generic name, or common misspelling) into the primary active generic ingredient or recognized brand name. " +
          "Return the standard generic/brand name (e.g. 'Omeprazole (Rizek)' or 'Lisinopril') and the correct RxNorm RxCUI code for that medication. " +
          "If the input is an international or regional brand name (such as Rizek), map it to the standard generic active ingredient but include the brand name in parentheses, and use the correct RxCUI for that generic ingredient (e.g., 'Rizek' -> name: 'Omeprazole (Rizek)', rxcui: '7646').";
        
        const schema = {
          type: "OBJECT",
          properties: {
            matches: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  rxcui: { type: "STRING" }
                },
                required: ["name", "rxcui"]
              }
            }
          },
          required: ["matches"]
        };

        const aiText = await callGeminiWithFallback(
          systemInstruction,
          `Search query: "${query}"`,
          schema,
          "gemini-3.1-flash-lite" // Preemptively use lite to save 3.5 quota for deeper analysis
        );

        if (aiText) {
          const parsed = JSON.parse(aiText);
          if (parsed.matches && Array.isArray(parsed.matches)) {
            aiMatches = parsed.matches;
          }
        }
      } catch (err) {
        console.error("Gemini search resolver failed:", err);
      }
    }

    // Merge and remove duplicates (by RxCUI)
    const merged = [...localMatches, ...rxNavMatches, ...aiMatches];
    const uniqueMap = new Map<string, { name: string; rxcui: string }>();
    for (const drug of merged) {
      const normalizedCui = drug.rxcui;
      // Capitalize first letter of drug name if it's all lower
      const formattedName = drug.name.charAt(0).toUpperCase() + drug.name.slice(1);
      if (!uniqueMap.has(normalizedCui)) {
        uniqueMap.set(normalizedCui, { name: formattedName, rxcui: normalizedCui });
      }
    }

    const results = Array.from(uniqueMap.values()).slice(0, 15);
    
    // Save to cache
    searchCache.set(lowercaseQuery, results);
    
    return res.json(results);
  } catch (err: any) {
    console.error("Error in /api/drugs/search:", err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// Helper to resolve RxCUI to name
async function resolveRxCuiToName(rxcui: string): Promise<string> {
  const localMatch = COMMON_DRUGS.find(d => d.rxcui === rxcui);
  if (localMatch) {
    return localMatch.name;
  }
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`;
    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    if (response.ok) {
      const data = await response.json();
      if (data?.properties?.name) {
        return data.properties.name;
      }
    }
  } catch (err) {
    console.error(`Failed to resolve RxCUI ${rxcui} to name:`, err);
  }
  return `Drug ${rxcui}`;
}

// 2. Fetch interactions for multiple RxCUIs (Gemini-powered high-fidelity fallback for discontinued NLM API)
app.get("/api/drugs/interactions", async (req, res) => {
  try {
    const rxcuisParam = req.query.rxcuis as string;
    if (!rxcuisParam) {
      return res.json({ interactions: [] });
    }

    // Split RxCUIs by space or +
    const rxcuisList = rxcuisParam.trim().split(/[\s+]+/);
    if (rxcuisList.length < 2) {
      return res.json({ interactions: [] });
    }

    // Deterministic cache key based on sorted RxCUIs
    const cacheKey = [...rxcuisList].sort().join("+");
    if (interactionCache.has(cacheKey)) {
      return res.json(interactionCache.get(cacheKey));
    }

    // Resolve all RxCUIs to names in parallel
    const resolvedMedications = await Promise.all(
      rxcuisList.map(async (rxcui) => {
        const name = await resolveRxCuiToName(rxcui);
        return { rxcui, name };
      })
    );

    const systemInstruction = 
      "You are a clinical pharmacologist. Given a list of medications, identify any known, clinically significant pairwise drug-drug interactions. " +
      "For each interaction, return: " +
      "1. The two drugs involved (with their exact names and RxCUIs from the input). " +
      "2. A severity level: 'high' (severe/life-threatening/contraindicated), 'moderate' (requires monitoring/dose adjustment), or 'low' (minor/mild interaction). " +
      "3. A concise, clear description of the interaction and the mechanism/effect. " +
      "If there are no interactions among the drugs, return an empty array.";

    const promptText = `
Medications to analyze:
${JSON.stringify(resolvedMedications, null, 2)}
`;

    const schema = {
      type: "OBJECT",
      properties: {
        interactions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              severity: {
                type: "STRING",
                enum: ["high", "moderate", "low"]
              },
              description: {
                type: "STRING"
              },
              drugs: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    rxcui: { type: "STRING" },
                    name: { type: "STRING" }
                  },
                  required: ["rxcui", "name"]
                }
              }
            },
            required: ["severity", "description", "drugs"]
          }
        }
      },
      required: ["interactions"]
    };

    const aiText = await callGeminiWithFallback(
      systemInstruction,
      promptText,
      schema,
      "gemini-3.5-flash"
    );

    if (!aiText) {
      throw new Error("No response returned from the interaction analyzer model");
    }

    const parsedResult = JSON.parse(aiText);
    const finalResponse = { interactions: parsedResult.interactions || [], raw: parsedResult };

    // Save to cache
    interactionCache.set(cacheKey, finalResponse);

    return res.json(finalResponse);
  } catch (err: any) {
    console.error("Error in /api/drugs/interactions:", err);
    return res.status(500).json({ error: err.message || "Failed to analyze drug interactions." });
  }
});

// 3. Analyze drug list + interaction data with Gemini API
app.post("/api/analyze", async (req, res) => {
  try {
    const { medications, interactions } = req.body;
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ error: "At least one medication is required for analysis." });
    }

    // Create a deterministic cache key by sorting medication RxCUIs
    const sortedMedsKey = medications.map((m: any) => m.rxcui).sort().join("+");
    if (analyzeCache.has(sortedMedsKey)) {
      return res.json(analyzeCache.get(sortedMedsKey));
    }

    const systemInstruction = 
      "You are a clinical-safety assistant helping a caregiver understand medication risk. Given the patient's full medication list and the raw pairwise interaction data below, write: " +
      "(1) A prioritized risk summary in plain, non-alarmist language — call out cumulative risks across 3+ drugs even if no single pair is flagged, not just the pairwise interactions individually. " +
      "(2) A severity rating (Low/Moderate/High) for the overall regimen with a one-sentence justification. " +
      "(3) Exactly 3 specific, concrete questions the patient should ask their doctor or pharmacist, based on their actual drugs. Do not give generic disclaimers-only output — be specific to the actual drugs listed. " +
      "Always end by recommending they confirm with a licensed pharmacist or doctor before changing anything.";

    const promptText = `
Medication List:
${JSON.stringify(medications, null, 2)}

Pairwise Interactions detected by NLM/RxNav:
${JSON.stringify(interactions, null, 2)}
`;

    const schema = {
      type: "OBJECT",
      properties: {
        severity: { 
          type: "STRING", 
          enum: ["Low", "Moderate", "High"],
          description: "Overall regimen risk severity rating"
        },
        severityJustification: { 
          type: "STRING",
          description: "A single, clear sentence explaining the reason for the severity rating"
        },
        summary: { 
          type: "STRING",
          description: "A comprehensive prioritized risk summary in plain, compassionate, caregiver-friendly language. Call out cumulative risks across 3+ drugs if applicable."
        },
        questions: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Exactly 3 highly specific, drug-specific, concrete questions the caregiver or patient should ask their healthcare provider"
        }
      },
      required: ["severity", "severityJustification", "summary", "questions"]
    };

    const aiText = await callGeminiWithFallback(
      systemInstruction,
      promptText,
      schema,
      "gemini-3.5-flash"
    );

    if (!aiText) {
      throw new Error("No response returned from the AI analyzer model");
    }

    const parsedResult = JSON.parse(aiText);
    
    // Save to cache
    analyzeCache.set(sortedMedsKey, parsedResult);

    return res.json(parsedResult);
  } catch (err: any) {
    console.error("Error in /api/analyze:", err);
    return res.status(500).json({ error: err.message || "Medication risk synthesis failed. Please try again." });
  }
});

export default app;
