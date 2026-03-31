import { Link } from "react-router-dom";

export function Events({
  events,
  images,
}: {
  events: readonly any[];
  images: readonly string[];
}) {
  const displayEvents = events.slice(0, 3);

  return (
    <section id="events" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center mb-6 px-6 py-3 text-lg font-bold tracking-wide text-white bg-[#000035] rounded-full shadow-sm">
            Procurement & Tenders
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Latest Tenders
          </h2>
          <p className="mt-5 max-w-3xl mx-auto text-lg text-gray-600">
            Discover the latest procurement requests, tenders, and sealed
            quotations from the campus.
          </p>
        </div>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {displayEvents.map((event, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition duration-300"
            >
              <div className="relative">
                <img
                  src={images[index % images.length]}
                  alt={event.title}
                  className="h-56 w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  {event.date}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 leading-snug line-clamp-3">
                  {event.title}
                </h3>
                <a
                  href={event.links?.[0]?.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-block font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  View Details →
                </a>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-16">
          <Link
            to="/notifications"
            className="inline-flex items-center px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full transition"
          >
            View All Tenders →
          </Link>
        </div>
      </div>
    </section>
  );
}
