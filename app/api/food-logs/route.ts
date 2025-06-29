import { supabase, isSupabaseConfigured } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const foodEntry = await request.json()

    if (!isSupabaseConfigured() || !supabase) {
      // In demo mode, just return success
      console.log("Demo mode - would save food entry:", foodEntry)
      return Response.json({ success: true, id: foodEntry.id })
    }

    // Transform the data to match your database schema (without user_id)
    const dbEntry = {
      "Cycle start time": new Date().toISOString(),
      "Meal type": foodEntry.mealType,
      "Food name": foodEntry.foodName,
      Description: foodEntry.description,
      Quantity: foodEntry.quantity,
      Unit: foodEntry.unit,
      "Meal time": foodEntry.mealTime,
      "Photo URL": foodEntry.photo,
      Calories: foodEntry.estimatedCalories,
      "Protein (g)": foodEntry.macros?.protein,
      "Carbs (g)": foodEntry.macros?.carbs,
      "Fat (g)": foodEntry.macros?.fat,
      "Fiber (g)": foodEntry.macros?.fiber,
      "Sugar (g)": foodEntry.macros?.sugar,
      "Sodium (mg)": foodEntry.macros?.sodium_mg,
      Notes: foodEntry.description,
    }

    const { data, error } = await supabase.from("food_logs").insert(dbEntry).select().single()

    if (error) {
      console.error("Supabase error:", error)
      throw error
    }

    return Response.json({ success: true, data })
  } catch (error) {
    console.error("Error saving food log:", error)
    return Response.json({ error: "Failed to save food log" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    if (!isSupabaseConfigured() || !supabase) {
      // Return mock data in demo mode
      return Response.json({ foodLogs: [] })
    }

    const { data: foodLogs, error } = await supabase
      .from("food_logs")
      .select("*")
      .gte("Cycle start time", `${date}T00:00:00`)
      .lt("Cycle start time", `${date}T23:59:59`)
      .order("Cycle start time", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      throw error
    }

    return Response.json({ foodLogs })
  } catch (error) {
    console.error("Error fetching food logs:", error)
    return Response.json({ error: "Failed to fetch food logs" }, { status: 500 })
  }
}
