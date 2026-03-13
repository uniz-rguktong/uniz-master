export interface BoredomPrompt {
    question: string;
    response: string;
    route?: string;
    story?: string;
}

export const STORY_CARDS = [
    {
        id: 'ornate-story',
        title: 'The ORNATE Story',
        subtitle: '10 Chapters · Narrated by PINGO',
        color: '#A3FF12',
        glow: 'rgba(163, 255, 18, 0.25)',
        borderGlow: 'rgba(163, 255, 18, 0.4)',
    },
    {
        id: 'my-story',
        title: 'My Story',
        subtitle: '5 Chapters · The Tale of PINGO',
        color: '#39FF14',
        glow: 'rgba(57, 255, 20, 0.25)',
        borderGlow: 'rgba(57, 255, 20, 0.4)',
    },
    {
        id: 'energy-guide',
        title: 'Energy Guide',
        subtitle: 'Guide to Neon Core Energy',
        color: '#00E5FF',
        glow: 'rgba(0, 229, 255, 0.25)',
        borderGlow: 'rgba(0, 229, 255, 0.4)',
    },
] as const;

export const BOREDOM_PROMPTS: BoredomPrompt[] = [
    {
        question: "Staring at the void? Let's stare at the beautiful Cosmos instead! (Warning: It's very shiny.)",
        response: "Engaging warp drive... Off to the Cosmos!",
        route: "/home/fun/cosmos"
    },
    {
        question: "My flippers are tired of walking. Let's fly around the planets in 3D!",
        response: "Initiating 3D flight sequence. Hold on to your belly!",
        route: "/home/planet-view"
    },
    {
        question: "Are you even doing anything? Let's check the Cadet Hub to see if you've actually done some work!",
        response: "Accessing the ranking system... Let's see your progress!",
        route: "/home/cadet-hub"
    },
    {
        question: "Do you want points? Because that's how you get points! Go do some missions, Cadet!",
        response: "Missions coming up! Time to get some high scores!",
        route: "/home/missions"
    },
    {
        question: "Bored? I have some top-secret stories about the galaxy. Want to hear them?",
        response: "Unlocking ancient archives... Get comfy for a story!",
        route: "/home/stories"
    },
    {
        question: "Curious about who built this place? Let's go stalk the 'About Us' page together!",
        response: "Loading developer profiles... Let's see who's behind all this!",
        route: "/home/about"
    },
    {
        question: "I'm detecting 100% chance of snacks near the stalls. Want to go see?",
        response: "Scanning for supplies... To the stalls we go!",
        route: "/home/stalls"
    },
    {
        question: "Cadet, there's so much to do! We can visit the Cosmos, check your rank at the Hub, or go to the Stalls for snacks. Want to explore?",
        response: "I love your enthusiasm! Let's head to the Central Console to pick a spot!",
        route: "/home"
    }
];

export const PAGE_INFO: Record<string, string> = {
    '/home': "Welcome home! This is where you start your galactic journey.",
    '/home/cadet-hub': "This is the leaderboard. Don't let the others beat you!",
    '/home/updates': "Check here for the latest news. Don't miss out!",
    '/home/planet-view': "Look at the planets in 3D. So many colors!",
    '/home/branches': "Choose your path! Which branch is your favorite?",
    '/home/sponsors': "Meet the allies who made this mission possible!",
    '/home/stalls': "Grab some gear and snacks at the stalls!",
    '/home/profile': "This is you! You look great in that uniform.",
    '/home/fun': "Need a break? Have some fun here!",
    '/home/stories': "Read about the legends of Ornate. It's like bedtime stories, but cooler.",
    '/home/missions': "Complete missions and score points! Go, go, go!",
    '/home/roadmap': "Check the schedule! We have big plans ahead.",
    '/home/gallery': "Memories from our space travels. Say cheese!",
    '/home/fest': "It's party time! Join the festival hub.",
    '/home/sports': "Ready to sweat? The arena is waiting!",
    '/home/about': "Learn about the legends who created this universe.",
};
