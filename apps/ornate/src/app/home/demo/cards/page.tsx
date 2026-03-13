"use client";

import { DisplayCardsDemo } from "@/components/ui/display-cards-demo";
import { redirect } from "next/navigation";

export default function DemoCardsPage() {
    if (process.env.NODE_ENV === "production") {
        redirect("/home");
    }

    return (
        <main className="min-h-screen bg-[#030308] flex items-center justify-center p-10">
            <div className="w-full max-w-5xl">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-black text-white tracking-widest uppercase mb-4">Display Cards Integration</h1>
                    <p className="text-gray-500 tracking-[0.2em] font-medium uppercase">Shadcn + Tailwind + Lucide React</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-xl">
                    <DisplayCardsDemo />
                </div>

                <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
                        <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">Project Structure</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>• <code className="text-[var(--color-neon)]">src/components/ui/display-cards.tsx</code> - Core Component</li>
                            <li>• <code className="text-[var(--color-neon)]">src/components/ui/display-cards-demo.tsx</code> - Demo Logic</li>
                            <li>• <code className="text-[var(--color-neon)]">src/lib/utils.ts</code> - Tailwind Utility</li>
                        </ul>
                    </div>
                    <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
                        <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">Dependencies</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>• Lucide React (Icons)</li>
                            <li>• Tailwind CSS (Styling)</li>
                            <li>• Framer Motion (Optional Animations)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
}
