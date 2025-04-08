import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase-server";
import { supabaseAdmin } from "@/utils/supabase-admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the user's routine
    const { data: routines, error } = await supabase
      .from("routines")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) throw error;

    return NextResponse.json(routines);
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
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
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
        user_id: session.user.id,
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
