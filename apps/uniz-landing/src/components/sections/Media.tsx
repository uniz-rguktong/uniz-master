import { Link } from "react-router-dom";

export function Media({
  news,
  images,
}: {
  news: readonly any[];
  images: readonly string[];
}) {
  const scrollItems = [...news.slice(0, 6), ...news.slice(0, 6)]; // Duplicate for infinite scroll

  return (
    <section id="media" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center mb-6 px-6 py-3 text-lg font-bold tracking-wide text-white bg-[#000035] rounded-full shadow-sm">
            Notifications
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900">
            News & Updates
          </h2>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white h-full shadow-sm">
            <div className="youtube-viewport">
              <div className="youtube-track space-y-6 p-6">
                {scrollItems.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.links?.[0]?.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="youtube-card group flex flex-col sm:flex-row gap-4 items-start bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition border border-transparent hover:border-slate-100"
                  >
                    <img
                      src={images[idx % images.length]}
                      className="w-full sm:w-40 h-32 sm:h-24 object-cover rounded-lg"
                      alt="Thumbnail"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-[#000035] line-clamp-2 text-lg">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2 font-medium">
                        {item.date ? `${item.date} - ` : ""}Discover recent insights and announcements.
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/notifications"
              className="inline-flex items-center px-10 py-4 bg-[#000035] text-white font-semibold rounded-full hover:opacity-90 transition shadow-sm"
            >
              View All Notifications →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
