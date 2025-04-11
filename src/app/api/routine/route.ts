import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase-server";
import { supabaseAdmin } from "@/utils/supabase-admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the user's routine
    const { data: routines, error } = await supabase
      .from("routines")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) throw error;

    // Map snake_case to camelCase field names for frontend compatibility
    const mappedRoutines = routines.map((routine) => ({
      id: routine.id,
      user_id: routine.user_id,
      task_name: routine.task_name,
      start_time: routine.start_time,
      end_time: routine.end_time,
      created_at: routine.created_at,
      updated_at: routine.updated_at,
      // Add camelCase versions for frontend use
      taskName: routine.task_name,
      startTime: routine.start_time,
      endTime: routine.end_time,
    }));

    return NextResponse.json(mappedRoutines);
  } catch (error) {
    console.error("Error fetching routines:", error);
    return NextResponse.json(
      { error: "Error fetching routines" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { taskName, startTime, endTime } = await request.json();

    if (!taskName || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert the routine
    const { data: routine, error } = await supabase
      .from("routines")
      .insert({
        user_id: user.id,
        task_name: taskName,
        start_time: startTime,
        end_time: endTime,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(routine);
  } catch (error) {
    console.error("Error creating routine:", error);
    return NextResponse.json(
      { error: "Error creating routine" },
      { status: 500 }
    );
  }
}
