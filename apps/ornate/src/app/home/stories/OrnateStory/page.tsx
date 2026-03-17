import type { Metadata } from 'next';
import StoryReader, { StoryData } from '../StoryReader';

export const metadata: Metadata = {
    title: 'Ornate Story — The Grand Saga | Ornate Archives',
    description: "The full chronicle of the Ornate Solar System — its origins, the discovery of Neon Energy, and the birth of its planets.",
};

const ORNATE_STORY: StoryData = {
    id: 'OrnateStory',
    title: 'The ORNATE Story',
    subtitle: 'The Grand Narrative of the ORNATE Solar System',
    chapter: 'Prologue',
    totalPages: 10,
    accentColor: '#A3FF12',
    glowColor: 'rgba(163, 255, 18, 0.4)',
    pages: [
        {
            title: 'The Discovery of Neon Energy',
            image: '/assets/ornate1.png',
            content: `"Greetings, Cadet. I am PINGO, your navigator in the ORNATE solar system."

Long before explorers like you arrived, scientists discovered something unusual.

Not a mineral. Not a fuel.

A special kind of energy that appears when people create, collaborate, and innovate together.

When ideas connect, when creativity flows, and when challenges are solved — a unique energy is released.

This energy was named Neon Energy.

To harness it, a powerful reactor was built.

That reactor became the Neon Core.

And it changed everything.`,
        },
        {
            title: 'The Birth of the ORNATE Solar System',
            image: '/assets/ornate2.png',
            content: `To manage the Neon Core, a new solar system was created.

Instead of one world, the solar system was designed as multiple planets orbiting around the core.

Each planet represents a different field of knowledge and activity.

Together they form the ORNATE Solar System.

And every explorer who enters the solar system becomes a Cadet.`,
        },
        {
            title: 'The Engineering Planets',
            image: '/assets/ornate3.png',
            content: `Several major planets orbit the Neon Core. Each one specializes in a different branch of engineering.

Cyberion — Planet of Code
The home of programmers and digital innovators. Here, cadets build algorithms, design software, and create intelligent systems.

Volteris — Planet of Power
The world of electrical engineering. Energy flows through transformers, circuits, and massive power grids.

Mechterra — Planet of Machines
A mechanical world filled with engines, gears, and robotics systems.

Structura — Planet of Builders
Where civil engineers design cities, bridges, and future infrastructure.

Signalia — Planet of Communication
The network planet where signals travel across satellites, antennas, and communication systems.`,
        },
        {
            title: 'The Creative Planets',
            image: '/assets/ornate4.png',
            content: `But Neon Energy does not come only from engineering.

Creativity produces powerful energy too. That is why several creative worlds exist.

TechXcel — The planet of innovation and experimental technology.

Sarvasrijana — A colorful world of arts, crafts, and imagination.

Artix — The planet of communication, language, and expression.

Kaladharani — A vibrant world where music, dance, theatre, and performances come alive.

Khelsaathi — The sports planet where competition, teamwork, and athletic spirit generate energy.

ICRo — The knowledge planet where cadets prepare for intellectual challenges and competitive exams.

Pixelro — The digital media planet where photography, videography, and visual storytelling thrive.

HHO — The planet of compassion and support. Here, cadets help fellow explorers and generate Neon Energy through kindness and community.`,
        },
        {
            title: 'The Missions',
            image: '/assets/ornate5.png',
            content: `Every planet hosts challenges known as missions.

Missions test:
— skill
— creativity
— teamwork
— innovation

When cadets complete these missions, their achievements generate Neon Energy.

That energy flows back to the Neon Core, strengthening the entire solar system.

Hackathons, competitions, performances, sports battles, workshops — all of them are missions.`,
        },
        {
            title: 'The Explorer Cadets',
            image: '/assets/ornate6.png',
            content: `Every student who enters the ORNATE solar system becomes a Cadet Explorer.

Cadets travel between planets.

They participate in missions.

They collaborate with other explorers.

Every success contributes energy back to the Neon Core.

The stronger the cadets become, the stronger the solar system grows.`,
        },
        {
            title: 'The Planetary Scanner',
            image: '/assets/ornate8.png',
            content: `To navigate this vast solar system, explorers use a planetary scanner.

This scanner allows cadets to:
— detect planets
— discover missions
— explore clubs
— track energy activity across the solar system

Your website interface is actually the navigation screen of this spacecraft.

And I am the navigator guiding you through it.`,
        },
        {
            title: 'The Great Alignment',
            image: '/assets/ornate7.png',
            content: `Most of the time, the planets operate independently.

But once every cycle, something extraordinary happens.

The planets align.

During this rare alignment, the Neon Core reaches its highest power levels.

This moment is known as the ORNATE Festival.`,
        },
        {
            title: 'The ORNATE Festival',
            image: '/assets/ornate9.jpeg',
            content: `During the festival:
— every planet activates new missions
— cadets travel between worlds
— competitions and celebrations occur everywhere

Creativity, innovation, and excitement spread across the solar system.

For a short time, the entire solar system becomes alive with activity.

ENERGY SURGES THROUGH THE NEON CORE.`,
        },
        {
            title: 'Your Role in the Solar System',
            image: '/assets/ornate10.png',
            content: `And now, Cadet, you are here.

Your ideas will create energy.

Your missions will power the solar system.

Your creativity will shape the future of the ORNATE universe.

This solar system does not run on machines.

It runs on explorers like you.

"Welcome to the ORNATE Solar System."
"The Neon Core is active."
"Your journey begins now."`,
        },
    ],
};

export default function OrnateStoryPage() {
    return <StoryReader story={ORNATE_STORY} />;
}
