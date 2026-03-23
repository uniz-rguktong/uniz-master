import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";

interface FeatureCard {
    id: string | number;
    imageUrl: string;
    title: string;
    tag?: string;
    link?: string;
    hasHeart?: boolean;
}

interface FeaturedCarouselProps {
    items: FeatureCard[];
}

const NextArrow = (props: any) => {
    const { onClick } = props;
    return (
        <button
            onClick={onClick}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 transition-all"
        >
            <ChevronRight size={20} className="text-slate-600" />
        </button>
    );
};

const PrevArrow = (props: any) => {
    const { onClick } = props;
    return (
        <button
            onClick={onClick}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 transition-all"
        >
            <ChevronLeft size={20} className="text-slate-600" />
        </button>
    );
};

export default function FeaturedCarousel({ items }: FeaturedCarouselProps) {
    // Clone items ONLY if there are between 2 and 5 items to ensure smooth infinite scrolling for small sets.
    // If only 1 item, cloning would look redundant; if 0, slider handles it.
    const displayItems = items.length > 1 && items.length < 6
        ? [...items, ...items, ...items]
        : items;

    const settings = {
        dots: false,
        infinite: displayItems.length > 1,
        autoplay: true,
        autoplaySpeed: 2000,
        pauseOnHover: false,
        arrows: true,
        speed: 1200,
        cssEase: "cubic-bezier(0.45, 0.05, 0.55, 0.95)", // Smoother transition
        slidesToShow: 4,
        slidesToScroll: 1,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        responsive: [
            {
                breakpoint: 1280,
                settings: {
                    slidesToShow: 3,
                },
            },
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                },
            },
            {
                breakpoint: 640,
                settings: {
                    slidesToShow: 1,
                },
            },
        ],
    };

    if (!items || items.length === 0) return null;

    return (
        <section className="py-20 bg-transparent px-[9px]">
            <div className="max-w-[1440px] mx-auto px-4 md:px-10">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-1.5 h-8 bg-navy-900 rounded-full"></div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Featured</h2>
                </div>

                <div className="relative">
                    <Slider key={displayItems.length} {...settings}>
                        {displayItems.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="px-3">
                                <div className="flex flex-col gap-4 group cursor-pointer">
                                    {/* Image Container */}
                                    <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-slate-100 shadow-sm border border-slate-100">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        {item.hasHeart && (
                                            <button className="absolute bottom-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-red-500 transition-all">
                                                <Heart size={18} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {item.tag || "Campus"}
                                            </span>
                                        </div>
                                        <h3 className="text-[17px] font-black text-slate-900 leading-snug line-clamp-2 min-h-[3rem]">
                                            {item.title}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>
        </section>
    );
}
