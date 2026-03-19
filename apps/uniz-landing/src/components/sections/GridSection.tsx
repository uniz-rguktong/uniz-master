import { Link } from "react-router-dom";

export function GridSection({
  id,
  title,
  subtitle,
  items,
  images,
  viewAllLink,
  viewAllText,
  bgColor = "bg-white",
  hideReadMore = false,
}: {
  id: string;
  title: string;
  subtitle?: string;
  items: readonly any[];
  images: readonly string[];
  viewAllLink: string;
  viewAllText: string;
  bgColor?: string;
  hideReadMore?: boolean;
}) {
  const displayItems = items.slice(0, 6); // Take up to 6 items

  if (!displayItems.length) return null;

  return (
    <section id={id} className={`py-24 ${bgColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">{title}</h2>
          {subtitle && (
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayItems.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 flex flex-col"
            >
              <div className="w-full aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  className="w-full h-full object-cover object-center"
                  src={images[index % images.length]}
                  alt={item.title}
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                {item.date && (
                  <p className="text-sm font-medium text-indigo-600">{item.date}</p>
                )}
                <h3 className="mt-2 text-xl font-semibold text-slate-800 line-clamp-3">
                  {item.title}
                </h3>
                {item.desc && (
                  <p className="mt-2 text-base text-gray-600 line-clamp-4">{item.desc}</p>
                )}
                {!hideReadMore && (
                  <div className="mt-auto pt-4">
                    <a
                      href={item.links?.[0]?.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-indigo-600 hover:text-indigo-700 font-semibold"
                    >
                      Read More &rarr;
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-16">
          <Link
            to={viewAllLink}
            className="inline-flex items-center px-8 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-md hover:shadow-lg transition"
          >
            {viewAllText}
          </Link>
        </div>
      </div>
    </section>
  );
}
