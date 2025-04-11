import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase-server";
import { supabaseAdmin } from "@/utils/supabase-admin";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the routine to make sure it belongs to the user
    const { data: existingRoutine, error: fetchError } = await supabase
      .from("routines")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingRoutine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }

    if (existingRoutine.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskName, startTime, endTime } = await request.json();

    if (!taskName || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update the routine
    const { data: updatedRoutine, error: updateError } = await supabase
      .from("routines")
      .update({
        task_name: taskName,
        start_time: startTime,
        end_time: endTime,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Map snake_case fields to camelCase for frontend compatibility
    const mappedRoutine = {
      ...updatedRoutine,
      taskName: updatedRoutine.task_name,
      startTime: updatedRoutine.start_time,
      endTime: updatedRoutine.end_time,
    };

    return NextResponse.json(mappedRoutine);
  } catch (error) {
    console.error("Error updating routine:", error);
    return NextResponse.json(
      { error: "Error updating routine" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the routine to make sure it belongs to the user
    const { data: existingRoutine, error: fetchError } = await supabase
      .from("routines")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingRoutine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }

    if (existingRoutine.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the routine
    const { error: deleteError } = await supabase
      .from("routines")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting routine:", error);
    return NextResponse.json(
      { error: "Error deleting routine" },
      { status: 500 }
    );
  }
}
