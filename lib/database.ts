import { supabase, isSupabaseConfigured } from "./supabase"

// Fetch recent workouts data
export async function getWorkoutsData(limit = 10) {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return []
    }

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .order("Workout start time", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching workouts:", error)
    return []
  }
}

// Fetch recent sleep data
export async function getSleepData(limit = 7) {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return []
    }

    const { data, error } = await supabase
      .from("sleep")
      .select("*")
      .order("Cycle start time", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching sleep data:", error)
    return []
  }
}

// Fetch physiological cycles (recovery data)
export async function getPhysiologicalData(limit = 7) {
  console.log("getPhysiologicalData")
  try {
    if (!isSupabaseConfigured() || !supabase) {
      console.log("supabase not configured")
      return []
    }

    console.log("supabase configured")

  const { data, error } = await supabase
    .from("physiological_cycles")
    .select("*");

  if (error) {
    console.error("Error fetching data:", error);
    throw error;
  }

  return data || [];

  } catch (error) {
    console.error("Error fetching physiological data:", error)
    return []
  }
}

// Fetch medical lab results
export async function getMedicalLabResults() {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return []
    }

    const { data, error } = await supabase.from("medical_lab_results").select("*")

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching lab results:", error)
    return []
  }
}

// Fetch recent journal entries
export async function getJournalEntries(limit = 10) {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return []
    }

    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .order("Cycle start time", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching journal entries:", error)
    return []
  }
}

// Get comprehensive health summary
export async function getHealthSummary() {
  try {
    const [workouts, sleep, physiological, labResults, journal] = await Promise.all([
      getWorkoutsData(7),
      getSleepData(7),
      getPhysiologicalData(7),
      getMedicalLabResults(),
      getJournalEntries(7),
    ])

    return {
      workouts,
      sleep,
      physiological,
      labResults,
      journal,
    }
  } catch (error) {
    console.error("Error fetching health summary:", error)
    return {
      workouts: [],
      sleep: [],
      physiological: [],
      labResults: [],
      journal: [],
    }
  }
}
