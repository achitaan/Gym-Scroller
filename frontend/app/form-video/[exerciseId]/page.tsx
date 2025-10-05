"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExerciseFormVideo } from "@/components/ExerciseFormVideo";

/**
 * Form Video Page
 * Dedicated page for viewing and generating exercise form videos
 */
export default function FormVideoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const exerciseId = params.exerciseId as string;
  const exerciseName = searchParams.get('name') || exerciseId.replace(/-/g, ' ');

  if (!exerciseId) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white mb-2">Exercise not found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 pb-20">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white hover:bg-neutral-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Form Video</h1>
            <p className="text-sm text-neutral-400 capitalize">
              {exerciseName}
            </p>
          </div>
        </div>
      </header>

      {/* Form Video Content */}
      <main className="px-6 py-6">
        <ExerciseFormVideo
          exerciseName={exerciseName}
          exerciseId={exerciseId}
          onClose={() => router.back()}
        />
      </main>
    </div>
  );
}