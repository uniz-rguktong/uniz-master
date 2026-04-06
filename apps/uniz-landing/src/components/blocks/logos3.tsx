"use client";

import AutoScroll from "embla-carousel-auto-scroll";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface Logo {
  id: string;
  description: string;
  image: string;
  className?: string;
}

export interface Logos3Props {
  heading?: string;
  logos?: Logo[];
  className?: string;
}

const Logos3 = ({
  heading = "Trusted by Top Recruiters & Industry Partners",
  logos = [
    {
      id: "logo-1",
      description: "TCS",
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Tata_Consultancy_Services_Logo.svg",
      className: "h-10 w-auto opacity-70 hover:opacity-100 transition-opacity",
    },
    {
      id: "logo-2",
      description: "Infosys",
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Infosys_logo.svg",
      className: "h-10 w-auto opacity-70 hover:opacity-100 transition-opacity",
    },
    {
      id: "logo-3",
      description: "Wipro",
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Wipro_Primary_Logo_Color_RGB.svg",
      className: "h-10 w-auto opacity-70 hover:opacity-100 transition-opacity",
    },
    {
      id: "logo-4",
      description: "IBM",
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/IBM_logo.svg",
      className: "h-8 w-auto opacity-70 hover:opacity-100 transition-opacity",
    },
    {
      id: "logo-5",
      description: "Cognizant",
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Cognizant_logo_2022.svg",
      className: "h-5 w-auto opacity-70 hover:opacity-100 transition-opacity",
    },
    {
      id: "logo-6",
      description: "Tech Mahindra",
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Tech_Mahindra_New_Logo.svg",
      className: "h-8 w-auto opacity-70 hover:opacity-100 transition-opacity",
    },
    {
      id: "logo-7",
      description: "Accenture",
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Accenture.svg",
      className: "h-8 w-auto opacity-70 hover:opacity-100 transition-opacity",
    },
    {
      id: "logo-8",
      description: "Capgemini",
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Capgemini_201x_logo.svg",
      className: "h-8 w-auto opacity-70 hover:opacity-100 transition-opacity",
    },
  ],
  className = ""
}: Logos3Props) => {
  return (
    <section className={`py-24 bg-white ${className}`}>
      <div className="container mx-auto px-4 flex flex-col items-center text-center">
        <h2 className="mb-12 text-3xl font-extrabold text-slate-900 lg:text-4xl">
          {heading}
        </h2>
      </div>
      <div className="pt-2 md:pt-4">
        <div className="relative mx-auto flex items-center justify-center max-w-[100vw] overflow-hidden lg:max-w-5xl">
          <Carousel
            opts={{ loop: true, align: "start" }}
            plugins={[AutoScroll({ playOnInit: true, speed: 1.5 })]}
            className="w-full"
          >
            <CarouselContent className="ml-0 flex items-center">
              {logos.map((logo) => (
                <CarouselItem
                  key={logo.id}
                  className="flex basis-1/3 justify-center pl-0 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
                >
                  <div className="mx-6 flex shrink-0 items-center justify-center h-20">
                    <img
                      src={logo.image}
                      alt={logo.description}
                      className={logo.className}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent"></div>
        </div>
      </div>
    </section>
  );
};

export { Logos3 };
