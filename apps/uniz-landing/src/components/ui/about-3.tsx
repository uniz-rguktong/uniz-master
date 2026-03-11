import { Button } from "./button";

interface About3Props {
    title?: React.ReactNode;
    description?: React.ReactNode;
    mainImage?: {
        src: string;
        alt: string;
    };
    secondaryImage?: {
        src: string;
        alt: string;
    };
    breakout?: {
        src: string;
        alt: string;
        title?: string;
        description?: string;
        buttonText?: string;
        buttonUrl?: string;
    };
    companiesTitle?: string;
    companies?: Array<{
        src: string;
        alt: string;
    }>;
    achievementsTitle?: string;
    achievementsDescription?: string;
    achievements?: Array<{
        label: string;
        value: string;
    }>;
}

const defaultCompanies = [
    {
        src: "https://shadcnblocks.com/images/block/logos/company/fictional-company-logo-1.svg",
        alt: "Arc",
    },
    {
        src: "https://shadcnblocks.com/images/block/logos/company/fictional-company-logo-2.svg",
        alt: "Descript",
    },
    {
        src: "https://shadcnblocks.com/images/block/logos/company/fictional-company-logo-3.svg",
        alt: "Mercury",
    },
    {
        src: "https://shadcnblocks.com/images/block/logos/company/fictional-company-logo-4.svg",
        alt: "Ramp",
    },
    {
        src: "https://shadcnblocks.com/images/block/logos/company/fictional-company-logo-5.svg",
        alt: "Retool",
    },
    {
        src: "https://shadcnblocks.com/images/block/logos/company/fictional-company-logo-6.svg",
        alt: "Watershed",
    },
];

const defaultAchievements = [
    { label: "Companies Supported", value: "300+" },
    { label: "Projects Finalized", value: "800+" },
    { label: "Happy Customers", value: "99%" },
    { label: "Recognized Awards", value: "10+" },
];

export const About3 = ({
    title = "About Us",
    description = "Shadcnblocks is a passionate team dedicated to creating innovative solutions that empower businesses to thrive in the digital age.",
    mainImage = {
        src: "https://shadcnblocks.com/images/block/placeholder-1.svg",
        alt: "placeholder",
    },
    secondaryImage = {
        src: "https://shadcnblocks.com/images/block/placeholder-2.svg",
        alt: "placeholder",
    },
    breakout = {
        src: "https://shadcnblocks.com/images/block/block-1.svg",
        alt: "logo",
        title: "Hundreds of blocks at Shadcnblocks.com",
        description:
            "Providing businesses with effective tools to improve workflows, boost efficiency, and encourage growth.",
        buttonText: "Discover more",
        buttonUrl: "https://shadcnblocks.com",
    },
    companiesTitle = "Valued by clients worldwide",
    companies = defaultCompanies,
    achievementsTitle = "Our Achievements in Numbers",
    achievementsDescription = "Providing businesses with effective tools to improve workflows, boost efficiency, and encourage growth.",
    achievements = defaultAchievements,
}: About3Props = {}) => {
    return (
        <section className="py-24 lg:py-32">
            <div className="container mx-auto px-6 md:px-12 lg:px-[120px] max-w-[1400px]">
                <div className="mb-14 grid gap-5 text-center md:grid-cols-2 md:text-left">
                    <h1 className="text-[36px] sm:text-[48px] md:text-[52px] font-extrabold text-[#0f172a] tracking-tight leading-tight">{title}</h1>
                    <p className="text-[16px] font-medium text-slate-500 leading-[1.7] md:pt-4">{description}</p>
                </div>
                <div className="grid gap-7 lg:grid-cols-3">
                    <img
                        src={mainImage.src}
                        alt={mainImage.alt}
                        className="size-full max-h-[620px] rounded-xl object-cover lg:col-span-2 shadow-lg"
                    />
                    <div className="flex flex-col gap-7 md:flex-row lg:flex-col">
                        <div className="flex flex-col justify-between gap-6 rounded-xl bg-slate-50 border border-slate-100 p-7 md:w-1/2 lg:w-auto shadow-sm">
                            <img
                                src={breakout.src}
                                alt={breakout.alt}
                                className="mr-auto h-12 object-contain"
                            />
                            <div>
                                <p className="mb-2 text-lg font-semibold">{breakout.title}</p>
                                <p className="text-slate-500">{breakout.description}</p>
                            </div>
                            <Button variant="maroon" className="mr-auto w-fit" asChild>
                                <a href={breakout.buttonUrl}>
                                    {breakout.buttonText}
                                </a>
                            </Button>
                        </div>
                        <img
                            src={secondaryImage.src}
                            alt={secondaryImage.alt}
                            className="grow basis-0 rounded-xl object-cover md:w-1/2 lg:min-h-0 lg:w-auto shadow-lg"
                        />
                    </div>
                </div>
                <div className="py-24 lg:py-32">
                    <p className="text-center text-slate-500 font-medium">{companiesTitle}</p>
                    <div className="mt-8 flex flex-wrap justify-center gap-10 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        {companies.map((company, idx) => (
                            <div className="flex items-center justify-center min-w-[100px]" key={company.src + idx}>
                                <img
                                    src={company.src}
                                    alt={company.alt}
                                    className="h-8 md:h-10 object-contain max-w-[140px]"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 border border-slate-800 p-10 md:p-16 text-white shadow-2xl">
                    <div className="flex flex-col gap-4 text-center md:text-left relative z-10">
                        <h2 className="text-3xl md:text-4xl font-semibold text-white">{achievementsTitle}</h2>
                        <p className="max-w-screen-sm text-slate-300">
                            {achievementsDescription}
                        </p>
                    </div>
                    <div className="mt-12 flex flex-wrap justify-center md:justify-between gap-10 text-center relative z-10">
                        {achievements.map((item, idx) => (
                            <div className="flex flex-col gap-2" key={item.label + idx}>
                                <span className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">
                                    {item.value}
                                </span>
                                <p className="text-slate-400 font-medium tracking-wide uppercase text-sm mt-2">{item.label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="pointer-events-none absolute -top-1 right-1 z-0 hidden h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:linear-gradient(to_bottom_right,#000,transparent,transparent)] md:block"></div>
                </div>
            </div>
        </section>
    );
};
