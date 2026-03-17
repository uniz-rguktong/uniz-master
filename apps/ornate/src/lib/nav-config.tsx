import { Rocket, Calendar, Store, Music, Globe, Zap, LayoutGrid, BookOpen, Info, Heart, Image as ImageIcon, User, Home } from 'lucide-react';

export const SIDEBAR_LINKS = {
  core: [
    { label: 'HOME', icon: <Home size={18} />, url: '/home' },
    { label: 'STORIES', icon: <BookOpen size={18} />, url: '/home/stories' },
    { label: 'ABOUT US', icon: <Info size={18} />, url: '/home/about' },
    { label: 'SPONSORS', icon: <Heart size={18} />, url: '/home/sponsors' },
    { label: 'GALLERY', icon: <ImageIcon size={18} />, url: '/home/gallery' },
    { label: 'CADET HUB', icon: <LayoutGrid size={18} />, url: '/home/cadet-hub' },
    { label: 'PROFILE', icon: <User size={18} />, url: '/home/profile' },
  ],
  events: [
    { label: 'FUN', icon: <Zap size={18} />, url: '/home/fun' },
    { label: 'STALLS', icon: <Store size={18} />, url: '/home/stalls' },
    { label: 'MISSIONS', icon: <Rocket size={18} />, url: '/home/missions' },
    { label: 'SCHEDULE', icon: <Calendar size={18} />, url: '/home/roadmap' },
    { label: 'PLANETARY VIEW', icon: <Globe size={18} />, url: '/home/planet-view' },
    { label: 'FEST', icon: <Music size={18} />, url: '/home/fest' },
  ]
};

export const SEARCH_INDEX = [
  ...SIDEBAR_LINKS.core.map(item => ({ label: item.label, url: item.url, terms: [item.label] })),
  ...SIDEBAR_LINKS.events.map(item => ({ label: item.label, url: item.url, terms: [item.label] })),
  { label: 'BRANCHES', url: '/home/branches', terms: ['BRANCHES', 'BRANCH'] },
  { label: 'CLUBS', url: '/home/clubs', terms: ['CLUBS', 'CLUB'] },
  { label: 'UPDATES', url: '/home/updates', terms: ['UPDATES', 'UPDATE'] },
  { label: 'LOGIN', url: '/login', terms: ['LOGIN', 'SIGN IN'] },
];
