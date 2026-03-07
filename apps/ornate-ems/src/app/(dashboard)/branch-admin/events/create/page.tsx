"use client";
import { CreateEventPage } from "@/components/features/admin/views/CreateEventPage";
import { CoordinatorProvider } from "@/context/CoordinatorContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useState, useEffect } from "react";

function CreateEventWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "create";
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    if (mode === "edit" || mode === "view" || mode === "copy") {
      const stored = localStorage.getItem("editEventData");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setInitialData(parsed);
        } catch (e) {
          console.error("Failed to parse event data", e);
          router.replace("/branch-admin/events");
        }
      } else {
        router.replace("/branch-admin/events");
      }
    } else {
      setInitialData({});
    }
  }, [mode, router]);

  if (!initialData) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <CreateEventPage
      key={mode + (initialData?.id || "new")}
      onNavigate={(path) => {
        const targetPath =
          path === "all-events"
            ? "/branch-admin/events"
            : `/branch-admin/${path}`;
        router.push(targetPath);
        if (path === "all-events") {
          setTimeout(() => router.refresh(), 0);
        }
      }}
      mode={mode}
      initialData={initialData}
    />
  );
}

export default function Page() {
  return (
    <CoordinatorProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <CreateEventWrapper />
      </Suspense>
    </CoordinatorProvider>
  );
}
