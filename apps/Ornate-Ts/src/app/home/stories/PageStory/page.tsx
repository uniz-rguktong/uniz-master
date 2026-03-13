import type { Metadata } from 'next';
import StoryReader, { StoryData } from '../StoryReader';

export const metadata: Metadata = {
    title: 'Page Story — Current Chapter | Ornate Archives',
    description: 'The narrative woven into this sector of the Ornate grid — the story behind the interface.',
};

const PAGE_STORY: StoryData = {
    id: 'PageStory',
    title: 'Page Story',
    subtitle: 'The Current Chapter',
    chapter: 'Chapter 02',
    totalPages: 4,
    accentColor: '#c4b5fd',
    glowColor: '#a78bfa',
    pages: [
        {
            title: 'The Interface Speaks',
            content: `Every panel in the Ornate Universe was designed with intention. What looks like a dashboard is also a diary. What looks like a registration form is also a covenant. The interface you navigate is not neutral — it was built to communicate.

This page you are reading from carries context. It knows where you came from, roughly where you might be going, and what the Ornate grid means in the narrow moment you are living through.

The story of a page is always a story about time.`,
        },
        {
            title: 'Architecture of Meaning',
            content: `The home grid was not assembled randomly. Each panel — Missions, Events, Stalls, the holographic dashboard — represents a different facet of the Ornate experience.

The left panel holds your active objectives. The right panel reflects broader intelligence. The centre holds the live pulse of the fest. Pingo floats between them, a loose thread binding the narrative together.

You are reading this because you pulled that thread. That means something.`,
        },
        {
            title: 'Context is Everything',
            content: `"Page Story" is not a fixed text. It is a concept: the idea that every page in a system has a reason for existing, a history of decisions that placed it here, and a set of futures it is pointing toward.

This version of it is a placeholder — a stub waiting to be filled with the specific story of whichever page you were visiting when you met Pingo's panel.

In future builds, this chapter will be dynamic. It will know exactly where you were.`,
        },
        {
            title: 'The Record Will Update',
            content: `Every session you spend inside the Ornate Universe adds a line to the page's story. Who visited. When. What they clicked. What they skipped. The archive is patient — it records without rushing.

When you return to this page tomorrow, the context will have shifted slightly. The same panels will hold different data. The fest will have moved. Your position in it will have changed.

Page Story is always being written. Come back and read it again.`,
        },
    ],
};

export default function PageStoryPage() {
    return <StoryReader story={PAGE_STORY} />;
}
