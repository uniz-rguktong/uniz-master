export const GRADE_MAP: Record<string, number> = {
  EX: 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 5,
  R: 0,
};

export function mapGradeToPoint(val: string | number): number {
  if (typeof val === "number") return val;
  const v = String(val).toUpperCase().trim();
  if (GRADE_MAP[v] !== undefined) return GRADE_MAP[v];

  // Try parsing float (e.g. "8.5")
  const num = parseFloat(v);
  if (!isNaN(num)) return num;

  return 0; // Default fail
}

export function getGpaDialogue(cgpa: number): string {
  const elite = [
    "Phenomenal performance! You're in the top-tier of the university. 🏆",
    "Academic excellence achieved. Keep leading the way!",
    "Legendary stats! Your dedication is truly inspiring.",
    "Breathtaking results. You've mastered the art of learning.",
    "S-Tier performance! You're absolutely killing it. 🔥",
  ];

  const outstanding = [
    "Incredible consistency! You're making it look easy. 🌟",
    "Outstanding progress. Your hard work is clearly paying off.",
    "A brilliant semester! Maintain this momentum.",
    "Impressive score. You're setting a high bar for everyone.",
    "You're a force to be reckoned with! Keep it up.",
  ];

  const veryGood = [
    "Solid performance! You're well on your way to greatness. ✨",
    "Great results this time around. Keep pushing for that 9+!",
    "Strong evidence of your potential. Stay focused.",
    "You're doing very well. A little more push and you'll be elite.",
    "Consistent and capable. You're building a strong foundation.",
  ];

  const good = [
    "Good job! You've maintained a steady pace. 👍",
    "Above average performance. Let's aim for a bit more next time.",
    "A respectable score. Your persistence is showing.",
    "You're on the right track. Keep refining your study habits.",
    "Solid progress. The next level is within your reach!",
  ];

  const average = [
    "Safe and sound. You've passed through successfully. ✅",
    "Consistency is key, but I know you can do better.",
    "A fair performance. Let's step up the game in the coming sem.",
    "Stay focused! You have the potential to climb higher.",
    "You've survived the sem! Now let's aim to thrive.",
  ];

  const belowAverage = [
    "Persistence is your best friend now. Let's work harder. 💪",
    "A bit of a rocky road? No worries, let's bounce back!",
    "Every comeback starts with a decision to try harder. You got this.",
    "Let's identify the weak spots and crush them next semester.",
    "Tough sems build tough students. You'll get through this.",
  ];

  const risk = [
    "It's time for a serious turnaround. You can do this! ⚡",
    "Challenges are meant to be overcome. Let's rebuild your strategy.",
    "Don't lose hope. Seek help from faculty and plan your comeback.",
    "The only way from here is up. Start taking small steps today.",
    "Mistakes are just data. Use them to debug your study plan.",
  ];

  let pool = average;
  if (cgpa >= 9.5) pool = elite;
  else if (cgpa >= 9.0) pool = outstanding;
  else if (cgpa >= 8.0) pool = veryGood;
  else if (cgpa >= 7.0) pool = good;
  else if (cgpa >= 6.0) pool = average;
  else if (cgpa >= 5.0) pool = belowAverage;
  else pool = risk;

  return pool[Math.floor(Math.random() * pool.length)];
}
