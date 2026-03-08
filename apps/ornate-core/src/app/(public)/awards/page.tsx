import { getPublicBestOutgoingStudents } from "@/actions/awardActions";
import OutgoingStudentsPublicView from "@/components/features/public/OutgoingStudentsPublicView";

export const dynamic = "force-dynamic";

export default async function AwardsPage() {
  const result = await getPublicBestOutgoingStudents();
  const students = result.success
    ? JSON.parse(JSON.stringify(result.data))
    : [];

  return (
    <main className="min-h-screen bg-[#FDFCFB]">
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
            Hall of Fame
          </h1>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            Celebrating our most exceptional graduates who have demonstrated
            outstanding excellence in academics, leadership, and character.
          </p>
        </div>

        <OutgoingStudentsPublicView initialStudents={students} />
      </div>
    </main>
  );
}
