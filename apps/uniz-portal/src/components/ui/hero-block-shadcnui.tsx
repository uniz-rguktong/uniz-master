import React from "react";
import { CalcomHero } from "./calcom-hero";

export const HeroBlock = React.memo(() => {
  return <CalcomHero />;
});

HeroBlock.displayName = "HeroBlock";
