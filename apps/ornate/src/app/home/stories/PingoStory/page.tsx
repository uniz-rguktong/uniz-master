import type { Metadata } from 'next';
import StoryReader, { StoryData } from '../StoryReader';

export const metadata: Metadata = {
    title: 'My Story — The Chronicle of PINGO | Ornate Archives',
    description: 'The backstory of PINGO — from the icy shores to the stars of the Ornate Universe.',
};

const PINGO_STORY: StoryData = {
    id: 'PingoStory',
    title: 'My Story',
    subtitle: 'The Chronicle of PINGO',
    chapter: 'Origin Story',
    totalPages: 5,
    accentColor: '#39FF14',
    glowColor: 'rgba(57, 255, 20, 0.4)',
    pages: [
        {
            title: 'A Normal Penguin',
            content: `"Before I became PINGO…"

I was just a normal penguin, living with my colony near the icy shores.

Life was simple.

Cold winds, quiet waters, and endless stars above.`,
        },
        {
            title: 'The Broken Heart',
            content: `Then life changed.

"I fell in love once.
But sometimes life doesn’t go the way we imagine.

So I left the colony and climbed the mountains, just to be alone with my thoughts."`,
        },
        {
            title: 'The Night of the Stars',
            content: `The night everything changed.

"While standing on the snowy peak, looking at the stars…
a strange light appeared in the sky.

Before I knew it, I was taken by something… not from this world."`,
        },
        {
            title: 'The Escape',
            content: `They tried to control me.

"The aliens turned me into a machine navigator.
But they didn’t realize something…

I was learning their technology.
And one day… I escaped."`,
        },
        {
            title: 'Why I Am Here',
            content: `And that’s how I found you.

"After traveling through space, I discovered something special here.

Energy created by creativity, competition, and ideas.

So now, I guide explorers through this universe.

Welcome, Cadet".`,
        },
    ],
};

export default function PingoStoryPage() {
    return <StoryReader story={PINGO_STORY} />;
}
