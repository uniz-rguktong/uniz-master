import type { Metadata } from 'next';
import StoriesClient from './StoriesClient';

export const metadata: Metadata = {
    title: "The Ornate Archives — Story Library",
    description: "Explore the narrative universe of Ornate — read traveller stories, page chronicles, and the grand saga of the platform.",
};

export default function StoriesPage() {
    return <StoriesClient />;
}
