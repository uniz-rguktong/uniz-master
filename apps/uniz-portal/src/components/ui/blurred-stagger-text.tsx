"use client" 

import { motion } from "framer-motion";
 
export const BlurredStagger = ({
  text = "we love hextaui.com ❤️",
  className = "",
}: {
  text: string;
  className?: string;
}) => {
  const headingText = text;
 
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };
 
  const letterAnimation = {
    hidden: {
      opacity: 0,
      filter: "blur(10px)",
      y: 5,
    },
    show: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
    },
  };
 
  return (
    <motion.span
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {headingText.split("").map((char, index) => (
        <motion.span
          key={char + index}
          variants={letterAnimation}
          transition={{ duration: 0.4 }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
};
