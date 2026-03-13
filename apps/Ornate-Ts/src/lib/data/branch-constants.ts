export type BranchOrClub = {
  slug: string;
  name: string;
  fullName: string;
  tagline: string;
  color: string;
  glow: string;
  image: string;
};

export const BRANCHES: BranchOrClub[] = [
  {
    slug: 'cse',
    name: 'TECHZEON',
    fullName: 'Computer Science & Engineering',
    tagline: 'Home of Coders',
    color: '#ec4899',
    glow: 'rgba(236,72,153,0.3)',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
  },
  {
    slug: 'ece',
    name: 'ELECSPIRE',
    fullName: 'Electronics & Communication Engineering',
    tagline: 'Keeping the World Connected',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.3)',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  },
  {
    slug: 'eee',
    name: 'POWERMANIA',
    fullName: 'Electrical & Electronics Engineering',
    tagline: 'Running on Energy',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.3)',
    image: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?w=800&q=80',
  },
  {
    slug: 'mechanical',
    name: 'YANTRIKA',
    fullName: 'Mechanical Engineering',
    tagline: 'World of Machines',
    color: '#eab308',
    glow: 'rgba(234,179,8,0.3)',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
  },
  {
    slug: 'civil',
    name: 'NIRMAN',
    fullName: 'Civil Engineering',
    tagline: 'Foundations of Tomorrow',
    color: '#14b8a6',
    glow: 'rgba(20,184,166,0.3)',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
  },
  {
    slug: 'hho',
    name: 'HHO',
    fullName: 'Humanities & Sciences',
    tagline: 'Supporting our Community',
    color: '#64748b',
    glow: 'rgba(100,116,139,0.3)',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  },
];

export const CLUBS: BranchOrClub[] = [
  {
    slug: 'pixlero',
    name: 'PIXLERO',
    fullName: 'Photography & Design Club',
    tagline: 'Capture the Soul',
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.3)',
    image: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d73b?w=800&q=80',
  },
  {
    slug: 'artix',
    name: 'ARTIX',
    fullName: 'Fine Arts Club',
    tagline: 'Paint the Future',
    color: '#f43f5e',
    glow: 'rgba(244,63,94,0.3)',
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecea8f82?w=800&q=80',
  },
  {
    slug: 'techxcel',
    name: 'TECHXCEL',
    fullName: 'Technical Innovation Club',
    tagline: 'Innovate. Execute.',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.3)',
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80',
  },
  {
    slug: 'kaladharani',
    name: 'KALADHARANI',
    fullName: 'Cultural & Performing Arts',
    tagline: 'Rhythm of Ornate',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.3)',
    image: 'https://images.unsplash.com/photo-1514525253361-bee243870eb2?w=800&q=80',
  },
  {
    slug: 'khelsaathi',
    name: 'KHELSAATHI',
    fullName: 'Sports & Athletics Club',
    tagline: 'Spirit of Champions',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.3)',
    image: 'https://images.unsplash.com/photo-1517649763962-0c6234978a0b?w=800&q=80',
  },
];
