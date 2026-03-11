import { useState } from "react";
import { About3 } from "../ui/about-3";
import { SkeletonBox } from "../ui/Skeletons";

export const AboutSection = () => {
    // Note: We bypassed the Institute API data here to use the premium hardcoded text from the user.
    const [loading] = useState(false);

    if (loading) {
        return (
            <section id="about" className="py-32 px-10 max-w-[1200px] mx-auto space-y-6">
                <SkeletonBox className="h-20 w-1/3" />
                <SkeletonBox className="h-96 w-full rounded-2xl" />
            </section>
        );
    }

    const descriptionText = (
        <div className="space-y-4 mt-2">
            <p className="text-[17px] font-medium text-slate-700 leading-[1.7] text-left">
                <strong className="text-[#800000]">Established in 2008</strong> by the AP Government, RGUKT was conceived with a singular vision: to bridge the educational opportunity gap for Andhra Pradesh's rural youth.
            </p>
            <p className="text-[16px] text-slate-500 leading-[1.7] text-left">
                Admitting roughly the <span className="font-semibold text-slate-700">top 1%</span> of rural students into a cutting-edge six-year integrated program, the university represents a complete paradigm shift in delivering world-class, residential technical education.
            </p>
        </div>
    );

    return (
        <div id="about" className="bg-slate-50 border-t border-slate-100">
            <About3
                title={
                    <div className="flex flex-col gap-1 items-start text-left">
                        <span className="text-[#800000] font-black uppercase tracking-[0.18em] text-[12px] md:text-[13px] mb-2 drop-shadow-sm">
                            Our Story
                        </span>
                        <span>About <span className="text-[#800000]">RGUKT.</span></span>
                    </div>
                }
                description={descriptionText}
                mainImage={{
                    src: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
                    alt: "RGUKT Campus",
                }}
                secondaryImage={{
                    src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                    alt: "Students studying on campus",
                }}
                breakout={{
                    src: "/rgukt-logo-removebg-preview.png",
                    alt: "RGUKT Logo",
                    title: "Excellence in Engineering.",
                    description: "Pioneering a paradigm shift in technical education for rural youth across Andhra Pradesh.",
                    buttonText: "Explore Academics",
                    buttonUrl: "#",
                }}
                companiesTitle="Top Recruiters at our Campus"
                companies={[
                    { src: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg", alt: "Amazon" },
                    { src: "https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg", alt: "Infosys" },
                    { src: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg", alt: "Wipro" },
                    { src: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg", alt: "IBM" },
                    { src: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg", alt: "Microsoft" },
                ]}
                achievementsTitle="Institute Impact in Numbers"
                achievementsDescription="A testament to our growing academic excellence and unparalleled dedication to providing quality engineering education to the youth."
                achievements={[
                    { label: "Students Enrolled", value: "4000+" },
                    { label: "Expert Faculty", value: "150+" },
                    { label: "Campus Area", value: "50 Acres" },
                    { label: "Placement Rate", value: "95%" },
                ]}
            />
        </div>
    );
};
