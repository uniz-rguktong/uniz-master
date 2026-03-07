import prisma from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Verify Certificate | Ornate EMS",
  description: "Verify certificates issued by Ornate EMS.",
};

interface VerifyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const rawQuery = (await searchParams).q;
  const query =
    typeof rawQuery === "string"
      ? rawQuery
      : (Array.isArray(rawQuery) ? rawQuery[0] : "") || "";
  let results: any[] = [];
  let message = "";

  if (query) {
    // 1. Try finding by Registration ID (Exact Match)
    const byId = await prisma.registration.findUnique({
      where: { id: query as string },
      include: { event: true },
    });

    if (byId && byId.certificateUrl) {
      // If explicit ID match, we could redirect, but let's show it in results for consistency
      // Or better, redirect immediately? User requirement: "uuid... certificates showup if more than 1"
      // If they search UUID, it's unique, so maybe just show it.
      // But user said: "uuid is registration id... one will shown"
      results.push(byId);
    } else {
      // 2. Try finding by Email (User Email -> Registration)
      // We need to find users with this email, then their registrations
      const registrationsByEmail = await prisma.registration.findMany({
        where: {
          user: {
            email: {
              equals: query,
              mode: "insensitive",
            },
          },
          certificateUrl: { not: null }, // Only show issued certificates
        },
        include: { event: true },
        orderBy: { createdAt: "desc" },
      });

      if (registrationsByEmail.length > 0) {
        results = registrationsByEmail;
      } else {
        message = "No certificates found for this ID or Email.";
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-xl w-full text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Certificate Verification
        </h1>
        <p className="text-lg text-gray-600">
          Enter your Certificate ID (UUID) or registerd Email Address to verify
          and download your certificates.
        </p>
      </div>

      <div className="max-w-xl w-full bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <form className="mb-8">
          <div className="relative">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Enter Certificate ID or Email..."
              className="w-full pl-4 pr-12 py-4 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-lg"
              required
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white rounded-md px-6 font-medium hover:bg-indigo-700 transition w-auto"
            >
              Search
            </button>
          </div>
        </form>

        {/* Results Section */}
        {query && results.length === 0 && message && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center border border-red-100">
            {message}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2 text-left">
              Found {results.length} Certificate{results.length !== 1 && "s"}
            </h3>
            {results.map((reg: any) => (
              <div
                key={reg.id}
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 rounded-lg border border-gray-100 transition-colors group"
              >
                <div className="text-left">
                  <p className="font-bold text-gray-900">{reg.event.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(reg.event.date).toLocaleDateString()} &bull;{" "}
                    {reg.rank ? `Rank: ${reg.rank}` : "Participation"}
                  </p>
                </div>
                <Link
                  href={`/verify/${reg.id}`}
                  className="px-4 py-2 bg-white border border-gray-200 text-indigo-600 font-medium rounded-md shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Help */}
      <div className="max-w-xl w-full text-center mt-8 text-sm text-gray-400">
        <p>Having trouble? Contact support at support@ornate-ems.com</p>
      </div>
    </div>
  );
}
