import { Metadata } from "next";
import RoutineScheduleManager from "@/components/RoutineScheduleManager";

export const metadata: Metadata = {
  title: "Manage Routines | Daily Routine",
  description:
    "Manage your daily routines and schedule them across different days of the week.",
};

export default function ManageRoutinesPage() {
  return (
    <main className="container py-8">
      <RoutineScheduleManager />
    </main>
  );
}
