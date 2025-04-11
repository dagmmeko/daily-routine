import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase-server";
import { DayOfWeek } from "@/types";

export async function GET(request: Request) {
  const supabase = await createClient();

  // Get user session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get routine schedules for the current user
  const { data, error } = await supabase
    .from("routine_schedules")
    .select(
      `
      *,
      routine:routines(*)
    `
    )
    .eq("user_id", session.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // Get user session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { routine_id, day_of_week } = await request.json();

    if (!routine_id || day_of_week === undefined || day_of_week === null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate day_of_week is a valid value
    if (day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json(
        { error: "Invalid day of week" },
        { status: 400 }
      );
    }

    // Insert new routine schedule
    const { data, error } = await supabase
      .from("routine_schedules")
      .insert({
        user_id: session.user.id,
        routine_id,
        day_of_week,
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
