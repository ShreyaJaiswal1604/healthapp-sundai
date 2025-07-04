const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

function looksLikeJSON(text) {
  return text.trim().startsWith("{") || text.trim().startsWith("[");
}

function extractJson(rawOutput: string): string {
  // Remove triple backticks and optional 'json' language identifier
  return rawOutput
    .replace(/```json\s*/i, '')  // Remove ```json (case-insensitive)
    .replace(/```$/, '')         // Remove ending ```
    .trim();                     // Trim whitespace
}


async function callOpenRouter(system, prompt) {
  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("OpenRouter API error:", errorText);
    throw new Error("Failed to fetch from OpenRouter");
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";

  const text2 = extractJson(text)
  // if (!looksLikeJSON(text)) {
  //   console.warn("⚠️ Model returned non-JSON response:", text);
  // }

  return text2;
}

export async function POST(request) {
  try {
    const { photo, metadata, userId } = await request.json();

    if (!photo) {
      return Response.json({ error: "Photo is required" }, { status: 400 });
    }

    const userHealthContext = await fetchUserHealthContext(userId);
    const nutritionalAnalysis = await analyzeNutritionalContent(photo, metadata);
    const coachResponse = await generateHealthCoachResponse(photo, metadata, nutritionalAnalysis, userHealthContext);
    const structuredAnalysis = await parseStructuredAnalysis(nutritionalAnalysis, coachResponse, metadata);

    return Response.json({
      analysis: structuredAnalysis,
      coachResponse: coachResponse,
      success: true,
    });
  } catch (error) {
    console.error("Error in food analysis with coach:", error);
    return Response.json({ error: "Failed to analyze food with health coach" }, { status: 500 });
  }
}

async function fetchUserHealthContext(userId) {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return { hasData: false, summary: "No health data available - running in demo mode" };
    }

    const [recoveryData, sleepData, workoutData, nutritionData] = await Promise.all([
      supabaseAdmin.from("physiological_cycles").select("*").eq("user_id", userId).order("Cycle start time", { ascending: false }).limit(3),
      supabaseAdmin.from("sleep").select("*").eq("user_id", userId).order("Cycle start time", { ascending: false }).limit(3),
      supabaseAdmin.from("workouts").select("*").eq("user_id", userId).order("Workout start time", { ascending: false }).limit(5),
      supabaseAdmin.from("food_logs").select("*").eq("user_id", userId).gte("logged_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).order("logged_at", { ascending: false }),
    ]);

    return {
      hasData: true,
      recovery: recoveryData.data || [],
      sleep: sleepData.data || [],
      workouts: workoutData.data || [],
      recentNutrition: nutritionData.data || [],
      summary: formatHealthContextSummary({
        recovery: recoveryData.data || [],
        sleep: sleepData.data || [],
        workouts: workoutData.data || [],
        nutrition: nutritionData.data || [],
      }),
    };
  } catch (error) {
    console.error("Error fetching user health context:", error);
    return { hasData: false, summary: "Unable to fetch health context" };
  }
}

function formatHealthContextSummary(data) {
  let summary = "";

  if (data.recovery?.length > 0) {
    const latest = data.recovery[0];
    const avg = data.recovery.reduce((sum, d) => sum + (d["Recovery score %"] || 0), 0) / data.recovery.length;
    summary += `Recent Recovery: Current ${latest["Recovery score %"]}%, avg ${avg.toFixed(1)}%. HRV: ${latest["Heart rate variability (ms)"]}ms. `;
  }

  if (data.sleep?.length > 0) {
    const latest = data.sleep[0];
    const avgHrs = data.sleep.reduce((sum, d) => sum + (d["Asleep duration (min)"] || 0) / 60, 0) / data.sleep.length;
    summary += `Recent Sleep: Latest ${((latest["Asleep duration (min)"] || 0) / 60).toFixed(1)}h, avg ${avgHrs.toFixed(1)}h. Quality: ${latest["Sleep performance %"]}%. `;
  }

  if (data.workouts?.length > 0) {
    const workouts = data.workouts.slice(0, 3);
    const avgStrain = workouts.reduce((sum, d) => sum + (d["Activity Strain"] || 0), 0) / workouts.length;
    summary += `Recent Workouts: ${workouts.length} sessions, avg strain ${avgStrain.toFixed(1)}. `;
  }

  if (data.nutrition?.length > 0) {
    const meals = data.nutrition.slice(0, 5);
    const avgCal = meals.reduce((sum, m) => sum + (m.calories || 0), 0) / meals.length;
    summary += `Recent Nutrition: Avg ${Math.round(avgCal)} cal/meal. `;
  }

  return summary || "No recent health data available.";
}

async function analyzeNutritionalContent(photo, metadata) {
  const system = `You are a certified nutritionist analyzing food photos. Respond with valid JSON only in this format:
{
  "calories": number,
  "macros": {
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number,
    "sugar": number
  },
  "micronutrients": {
    "sodium_mg": number,
    "potassium_mg": number,
    "calcium_mg": number,
    "iron_mg": number,
    "vitamin_c_mg": number
  },
  "ingredients": ["ingredient1", "ingredient2"],
  "preparationNotes": "cooking method and style observations"
}`;

  // Convert photo to base64
  let base64Image = "";
  try {
    const res = await fetch(photo);
    const buffer = await res.arrayBuffer();
    base64Image = Buffer.from(buffer).toString("base64");
  } catch (e) {
    console.error("Error encoding image to base64:", e);
  }

  const prompt = `Here is a photo of a meal encoded in base64 format:
<base64>
${base64Image}
</base64>

Additional metadata:
- Meal type: ${metadata.mealType}
- Time: ${metadata.mealTime}
- Portion size: ${metadata.portionSize}
- Preparation: ${metadata.preparationMethod}
- Notes: ${metadata.notes}

Please analyze the image and return the nutrition estimate in the required JSON format.`;

  try {
    const text = await callOpenRouter(system, prompt);
    console.log("test returned: " + text)
    const jsony = JSON.parse(text)
    console.log("json " + jsony)
    console.log("test protein " + jsony.macros.protein)
    if (!looksLikeJSON(text)) throw new Error(text);
    return JSON.parse(text);
  } catch (err) {
    console.error("Error parsing nutritional analysis:", err);
    return {
      calories: 0,
      macros: { protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
      micronutrients: { sodium_mg: 0, potassium_mg: 0, calcium_mg: 0, iron_mg: 0, vitamin_c_mg: 0 },
      ingredients: [],
      preparationNotes: "Unable to analyze",
    };
  }
}


async function generateHealthCoachResponse(photo, metadata, nutritionalAnalysis, userHealthContext) {
  const system = `You are an AI Health Coach giving advice in JSON. Respond ONLY with JSON in THIS EXACT FORMAT and do NOT include suggestions or alternatives. Use actual numeric values, not ranges.
.`;

  const prompt = `Meal Info:
Meal Type: ${metadata.mealType}
Time: ${metadata.mealTime}
Location: ${metadata.location}
Social Context: ${metadata.socialContext}
Hunger: ${metadata.hungerLevel}/10
Mood Before: ${metadata.moodBefore}
Mood After: ${metadata.moodAfter}
Portion: ${metadata.portionSize}
Prep: ${metadata.preparationMethod}
Notes: ${metadata.notes}

Nutrition:
Calories: ${nutritionalAnalysis.calories}
Protein: ${nutritionalAnalysis.macros?.protein}g
Carbs: ${nutritionalAnalysis.macros?.carbs}g
Fat: ${nutritionalAnalysis.macros?.fat}g
Ingredients: ${nutritionalAnalysis.ingredients?.join(", ")}

Context:
${userHealthContext.summary}`;

  return await callOpenRouter(system, prompt);
}

async function parseStructuredAnalysis(nutritionalAnalysis, coachResponse, metadata) {
  const system = `Return only valid JSON matching this format:
{
  "nutritionalAnalysis": ..., 
  "healthAssessment": ..., 
  "personalizedRecommendations": [...], 
  "mealTimingAdvice": "...", 
  "portionFeedback": "...", 
  "improvementSuggestions": [...], 
  "contextualInsights": [...]
}`;

  const prompt = `Coach Response:
${coachResponse}

Nutritional:
${JSON.stringify(nutritionalAnalysis)}

Metadata:
${JSON.stringify(metadata)}`;

  try {
    const text = await callOpenRouter(system, prompt);
    if (!looksLikeJSON(text)) throw new Error(text);
    return JSON.parse(text);
  } catch (err) {
    console.error("Error parsing structured analysis:", err);
    return {
      nutritionalAnalysis,
      healthAssessment: {
        score: 70,
        category: "good",
        concerns: ["Unable to parse detailed analysis"],
        positives: ["Meal logged for tracking"],
      },
      personalizedRecommendations: ["Continue tracking your meals for better insights"],
      mealTimingAdvice: "Meal timing analysis unavailable",
      portionFeedback: "Portion analysis unavailable",
      improvementSuggestions: ["Try adding more vegetables to your meals"],
      contextualInsights: ["Keep logging meals with context for better insights"],
    };
  }
}
