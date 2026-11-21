"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/utils/toast-ref";
import { PageHeader } from "@/components/ui/page-header";

type Variant = "default" | "success" | "error" | "warning";
type Position =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export default function ToasterDemo() {
  const showToastVariant = (variant: Variant, _position: Position = "bottom-right") => {
    toast.show({
      title: `${variant.charAt(0).toUpperCase() + variant.slice(1)}`,
      message: `This is a ${variant} notification.`,
      variant,
      duration: 3000,
      onDismiss: () => console.log(`${variant} toast dismissed`),
    });
  };

  const simulateApiCall = async () => {
    toast.info("Please wait while we schedule your meeting.", {
      title: "Scheduling",
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Your meeting is scheduled for July 4, 2025 at 3:42 PM IST.", {
        title: "Meeting scheduled",
        autoClose: 5000,
        actions: {
          label: "Undo",
          onClick: () => console.log("Undoing meeting schedule"),
        },
      });
    } catch {
      toast.error("Failed to schedule the meeting. Please try again.", {
        title: "Error",
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title="Toast demo" meta="Developer route for the shared toast primitives." />
      <section>
        <h2 className="font-serif text-2xl font-normal leading-8 text-head">Toast variants</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {(["default", "success", "error", "warning"] as Variant[]).map((variantKey) => (
            <Button key={variantKey} variant="outline" onClick={() => showToastVariant(variantKey)}>
              {variantKey.charAt(0).toUpperCase() + variantKey.slice(1)} toast
            </Button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-serif text-2xl font-normal leading-8 text-head">Toast positions</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {(
            [
              "top-left",
              "top-center",
              "top-right",
              "bottom-left",
              "bottom-center",
              "bottom-right",
            ] as Position[]
          ).map((positionKey) => (
            <Button key={positionKey} variant="outline" onClick={() => showToastVariant("default")}>
              {positionKey.replace("-", " ").replace(/\b\w/g, (char) => char.toUpperCase())}
            </Button>
          ))}
        </div>
      </section>
      <section className="border-t border-border pt-8">
        <h2 className="font-serif text-2xl font-normal leading-8 text-head">Real-world example</h2>
        <Button className="mt-4" onClick={simulateApiCall}>
          Schedule Meeting
        </Button>
      </section>
    </div>
  );
}
