import React, { useState } from 'react';
import { Settings, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import './RadialMenu.css';

interface RadialMenuProps {
    branches: string[];
    currentIndex: number;
    onBranchSelect: (index: number) => void;
}

export function RadialMenu({ branches, currentIndex, onBranchSelect }: RadialMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    // The angle between each branch icon
    const angleStep = 180 / (branches.length - 1); // 180 degrees half-circle

    return (
        <div className="radial-menu-wrapper lg:hidden">
            <div className={cn("radial-menu", isOpen && "is-open")}>

                {/* Branch Items */}
                {branches.map((branch, index) => {
                    // Spread them across a 180 degree arc starting from -90 degrees (top) to 90 degrees (bottom)
                    const angle = -90 + (index * angleStep);
                    // Distance from center
                    const radius = 100;

                    const isActive = index === currentIndex;

                    const getAu = (b: string) => {
                        switch (b) {
                            case 'hho': return '0.39 AU';
                            case 'cse': return '0.723 AU';
                            case 'ece': return '1 AU';
                            case 'eee': return '1.524 AU';
                            case 'civil': return '5.203 AU';
                            case 'mech': return '9.539 AU';
                            default: return '';
                        }
                    };

                    return (
                        <button
                            key={branch}
                            className={cn("radial-item", branch, isActive && "active")}
                            style={{
                                '--angle': `${angle}deg`,
                                '--radius': `${radius}px`,
                                '--delay': `${index * 0.05}s`
                            } as React.CSSProperties}
                            onClick={() => {
                                onBranchSelect(index);
                                setIsOpen(false);
                            }}
                        >
                            <div className="preview"></div>
                            <div className="info">
                                <h2>
                                    <div className="pip"></div>
                                    {branch.toUpperCase()}
                                </h2>
                                <h3>{getAu(branch)}</h3>
                            </div>
                        </button>
                    );
                })}

                {/* Central Toggle Button */}
                <button
                    className="radial-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="radial-toggle-icon">
                        {isOpen ? <Settings className="w-8 h-8 spin-slow" /> : <Menu className="w-8 h-8" />}
                    </div>
                </button>

            </div>
        </div>
    );
}
