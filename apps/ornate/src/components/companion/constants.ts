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
        subtitle: '13 Chapters · Old Space Legends',
        color: '#A3FF12',
        glow: 'rgba(163, 255, 18, 0.25)',
        borderGlow: 'rgba(163, 255, 18, 0.4)',
    },
    {
        id: 'my-story',
        title: 'Pingo\'s Story',
        subtitle: '5 Chapters · My Own Space Tale',
        color: '#39FF14',
        glow: 'rgba(57, 255, 20, 0.25)',
        borderGlow: 'rgba(57, 255, 20, 0.4)',
    },
    {
        id: 'energy-guide',
        title: 'Energy Guide',
        subtitle: 'How the Space Lights Work',
        color: '#00E5FF',
        glow: 'rgba(0, 229, 255, 0.25)',
        borderGlow: 'rgba(0, 229, 255, 0.4)',
    },
] as const;

export const BOREDOM_PROMPTS: BoredomPrompt[] = [
    {
        question: "Want to hear a cool story? I can tell you all about me or the old Ornate legends!",
        response: "Great! Let's go to the story corner!",
        route: "/home/stories"
    },
    {
        question: "Is your spaceship looking a bit boring? Let's go to your Profile and pick a new color!",
        response: "Time for a space paint job! To the Profile page!",
        route: "/home/profile"
    },
    {
        question: "Look at all those bright lights! Want to fly around the planets in the Cosmos?",
        response: "Engaging rockets! Let's go see the stars!",
        route: "/home/fun/cosmos"
    },
    {
        question: "My flippers are tired! Want to see the planets in 3D instead?",
        response: "Spinning around... Here come the planets!",
        route: "/home/planet-view"
    },
    {
        question: "I'm really hungry for space snacks! Should we go check the Stalls?",
        response: "Scanning for fish and snacks... Let's go!",
        route: "/home/stalls"
    },
    {
        question: "Do you want to win some space points? Let's check our Missions!",
        response: "Let's be heroes! Opening the Mission list!",
        route: "/home/missions"
    },
    {
        question: "Want to see how you're doing? The Cadet Hub shows your space rank!",
        response: "Let's see if you're the best cadet! To the Hub!",
        route: "/home/cadet-hub"
    }
];

export const PAGE_INFO: Record<string, string> = {
    '/home': "Welcome to our space home! This is where we start every big adventure.",
    '/home/cadet-hub': "This is the Hub! Check the board to see if you're the top cadet.",
    '/home/updates': "Here's what's happening in space right now. Don't miss out!",
    '/home/planet-view': "Whoa! Look at those big planets spinning around. So cool!",
    '/home/branches': "Pick a group to join! Which part of space do you like most?",
    '/home/sponsors': "Meet the friends who helped us build this big spaceship!",
    '/home/stalls': "Need snacks or gear? The stalls have everything a cadet needs!",
    '/home/profile': "This is your space suit and ship! You can change colors here.",
    '/home/fun': "Time for a break! Let's play some space games.",
    '/home/stories': "I love stories! Do you want to read about me or the galaxy?",
    '/home/missions': "Ready for a challenge? Let's win some points together!",
    '/home/roadmap': "This shows our big plan for the future. We're going far!",
    '/home/gallery': "Look at all these space photos! We look great in these.",
    '/home/fest': "It's party time! Let's join the big space festival.",
    '/home/sports': "Ready to run and play? The space arena is wide open!",
    '/home/about': "Meet the human creators who built this whole universe for us.",
};
