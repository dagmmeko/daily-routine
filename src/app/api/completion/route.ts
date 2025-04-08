import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase-server";
import { supabaseAdmin } from "@/utils/supabase-admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { routineId, date, completed } = await request.json();

    if (!routineId || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the routine belongs to the user
    const { data: routine, error: routineError } = await supabase
      .from("routines")
      .select("*")
      .eq("id", routineId)
      .single();

    if (routineError || !routine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }

    if (routine.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if there's already a completion record for this routine and date
    const { data: existingCompletions, error: existingCompletionError } =
      await supabase
        .from("task_completions")
        .select("*")
        .eq("routine_id", routineId)
        .eq("user_id", session.user.id)
        .eq("date", date)
        .maybeSingle();

    if (existingCompletionError) throw existingCompletionError;

    let result;

    if (existingCompletions) {
      // Update the existing completion
      const { data: updatedCompletion, error: updateError } = await supabase
        .from("task_completions")
        .update({
          completed: completed === true,
        })
        .eq("id", existingCompletions.id)
        .select()
        .single();

      if (updateError) throw updateError;

      result = updatedCompletion;
    } else {
      // Create a new completion
      const { data: newCompletion, error: insertError } = await supabase
        .from("task_completions")
        .insert({
          routine_id: routineId,
          user_id: session.user.id,
          date: date,
          completed: completed === true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      result = newCompletion;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating completion status:", error);
    return NextResponse.json(
      { error: "Error updating completion status" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get date from query params, default to today
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const date = dateParam || new Date().toISOString().split("T")[0];

  try {
    // Get all task completions for the user on the specified date
    const { data: completions, error } = await supabase
      .from("task_completions")
      .select(
        `
        *,
        routine:routines(*)
      `
      )
      .eq("user_id", session.user.id)
      .eq("date", date);

    if (error) throw error;

    return NextResponse.json(completions);
  } catch (error) {
    console.error("Error fetching completion status:", error);
    return NextResponse.json(
      { error: "Error fetching completion status" },
      { status: 500 }
    );
  }
}
