import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase-server";
import { supabaseAdmin } from "@/utils/supabase-admin";
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get date from query params, default to today
    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");
    const currentDate = dateParam ? new Date(dateParam) : new Date();

    // Calculate start and end of the week (Monday to Friday)
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4); // Friday (4 days after Monday)

    // Get all days in the week (Monday to Friday)
    const weekdays = eachDayOfInterval({
      start: weekStart,
      end: weekEnd,
    });

    // Get all routines for the user
    const { data: routines, error: routinesError } = await supabase
      .from("routines")
      .select("*")
      .eq("user_id", session.user.id);

    if (routinesError) throw routinesError;

    const totalTasks = routines.length;

    if (totalTasks === 0) {
      return NextResponse.json({
        weeklyData: weekdays.map((day) => ({
          date: format(day, "yyyy-MM-dd"),
          completionPercentage: 0,
          day: format(day, "EEEE"),
        })),
        weeklyAverage: 0,
      });
    }

    // For each day, calculate the completion percentage
    const weeklyData = await Promise.all(
      weekdays.map(async (day) => {
        const formattedDate = format(day, "yyyy-MM-dd");

        // Get all completions for the day
        const { data: completions, error: completionsError } = await supabase
          .from("task_completions")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("date", formattedDate);

        if (completionsError) throw completionsError;

        const completedTasks = completions
          ? completions.filter((task) => task.completed).length
          : 0;

        // Calculate completion percentage
        const completionPercentage =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          date: formattedDate,
          completionPercentage,
          day: format(day, "EEEE"),
        };
      })
    );

    // Calculate weekly average
    const totalPercentage = weeklyData.reduce(
      (total, day) => total + day.completionPercentage,
      0
    );
    const weeklyAverage = Math.round(totalPercentage / weeklyData.length);

    return NextResponse.json({
      weeklyData,
      weeklyAverage,
    });
  } catch (error) {
    console.error("Error calculating performance metrics:", error);
    return NextResponse.json(
      { error: "Error calculating performance metrics" },
      { status: 500 }
    );
  }
}
