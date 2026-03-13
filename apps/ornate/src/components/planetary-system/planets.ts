export interface Planet {
    id: string;
    name: string;
    texture: string;
    color: string;
    glow: string;
    type: string;
    atmos: string;
    pop: string;
    category: string;
    href: string;
}

export const PLANETS: Planet[] = [
    {
        id: 'sun',
        name: 'rgukt ongole',
        texture: '/assets/RguktLogo.png',
        color: '#fbbf24', // amber-400
        glow: 'rgba(251, 191, 36, 0.6)',
        type: 'STAR G2V',
        atmos: 'PLASMA',
        pop: '0',
        category: 'global',
        href: '/home/about'
    },
    {
        id: 'mercury',
        name: 'artix',
        texture: '/assets/artix.webp',
        color: '#9ca3af', // gray-400
        glow: 'rgba(156, 163, 175, 0.6)',
        type: 'ROCKY',
        atmos: 'NONE',
        pop: '0',
        category: 'clubs',
        href: '/home/clubs/artix'
    },
    {
        id: 'venus',
        name: 'kaladharani',
        texture: '/assets/kaladharani.webp',
        color: '#fcd34d', // amber-300
        glow: 'rgba(252, 211, 77, 0.6)',
        type: 'ROCKY',
        atmos: 'CO2/N2',
        pop: '0',
        category: 'clubs',
        href: '/home/clubs/kaladharani'
    },
    {
        id: 'earth',
        name: 'icro',
        texture: '/assets/ICRO.webp',
        color: '#06b6d4', // cyan-500
        glow: 'rgba(6, 182, 212, 0.6)',
        type: 'TERRA M-CLASS',
        atmos: '78% N2, 21% O2',
        pop: '12.5B',
        category: 'clubs',
        href: '/home/clubs/icro'
    },
    {
        id: 'mars',
        name: 'khelsaathi',
        texture: '/assets/Khelsaathi.webp',
        color: '#ef4444', // red-500
        glow: 'rgba(239, 68, 68, 0.6)',
        type: 'DESERT P-CLASS',
        atmos: '95% CO2',
        pop: '2.1M',
        category: 'clubs',
        href: '/home/clubs/khelsaathi'
    },
    {
        id: 'jupiter',
        name: 'pixelro',
        texture: '/assets/PixelRo.webp',
        color: '#d97706', // amber-600
        glow: 'rgba(217, 119, 6, 0.6)',
        type: 'GAS GIANT',
        atmos: '90% H2',
        pop: '0',
        category: 'clubs',
        href: '/home/clubs/pixelro'
    },
    {
        id: 'uranus',
        name: 'sarvasrijana',
        texture: '/assets/sarvasrijana.webp',
        color: '#22d3ee', // cyan-400
        glow: 'rgba(57, 255, 20, 0.6)', // neon green-ish
        type: 'ICE GIANT',
        atmos: 'H2/He/CH4',
        pop: '0',
        category: 'clubs',
        href: '/home/clubs/sarvasrijana'
    },
    {
        id: 'neptune',
        name: 'techxcel',
        texture: '/assets/TechXcel.webp',
        color: '#3b82f6', // blue-500
        glow: 'rgba(59, 130, 246, 0.6)',
        type: 'ICE GIANT',
        atmos: 'H2/He/CH4',
        pop: '0',
        category: 'clubs',
        href: '/home/clubs/techxcel'
    },
    // BRANCHES
    {
        id: 'branch_cse',
        name: 'CSE',
        texture: '/assets/CSE.webp',
        color: '#ec4899', // pink-500
        glow: 'rgba(236, 72, 153, 0.6)',
        type: 'TECH',
        atmos: 'Code',
        pop: '1',
        category: 'branches',
        href: '/home/branches/cse'
    },
    {
        id: 'branch_ece',
        name: 'ECE',
        texture: '/assets/ECE.webp',
        color: '#8b5cf6', // violet-500
        glow: 'rgba(139, 92, 246, 0.6)',
        type: 'CIRCUITS',
        atmos: 'Volts',
        pop: '1',
        category: 'branches',
        href: '/home/branches/ece'
    },
    {
        id: 'branch_eee',
        name: 'EEE',
        texture: '/assets/EEE.webp',
        color: '#f97316', // orange-500
        glow: 'rgba(249, 115, 22, 0.6)',
        type: 'POWER',
        atmos: 'Watts',
        pop: '1',
        category: 'branches',
        href: '/home/branches/eee'
    },
    {
        id: 'branch_mech',
        name: 'MECH',
        texture: '/assets/Mechanical.webp',
        color: '#eab308', // yellow-500
        glow: 'rgba(234, 179, 8, 0.6)',
        type: 'MACHINES',
        atmos: 'Gears',
        pop: '1',
        category: 'branches',
        href: '/home/branches/mechanical'
    },
    {
        id: 'branch_civil',
        name: 'CIVIL',
        texture: '/assets/civil.webp',
        color: '#14b8a6', // teal-500
        glow: 'rgba(20, 184, 166, 0.6)',
        type: 'STRUCTURES',
        atmos: 'Concrete',
        pop: '1',
        category: 'branches',
        href: '/home/branches/civil'
    },
    {
        id: 'branch_hho',
        name: 'HHO',
        texture: '/assets/sarvasrijana.webp',
        color: '#64748b', // slate-500
        glow: 'rgba(100, 116, 139, 0.6)',
        type: 'HUMANITIES',
        atmos: 'Science',
        pop: '1',
        category: 'special planets',
        href: '/home/branches/hho'
    },
    {
        id: 'special_sports',
        name: 'sports',
        texture: '/assets/Khelsaathi.webp',
        color: '#ef4444', // red-500
        glow: 'rgba(239, 68, 68, 0.6)',
        type: 'ARENA',
        atmos: 'OXYGEN',
        pop: 'Active',
        category: 'special planets',
        href: '/home/sports'
    },
    // SPECIAL PLANETS
    {
        id: 'special_moon',
        name: 'luna',
        texture: '/assets/moon.webp',
        color: '#e2e8f0', // slate-200
        glow: 'rgba(226, 232, 240, 0.6)',
        type: 'SATELLITE',
        atmos: 'NONE',
        pop: '0',
        category: 'special planets',
        href: '/home/fun/cosmos'
    }
];
