'use client';

import React, { useEffect, useRef } from 'react';

export interface PoemAnimationProps {
    poemHTML: string;
    backgroundImageUrl: string;
    boyImageUrl: string;
}

/**
 * Renders the 3D poem animation hero section.
 * Uses the original CSS class structure: hero-section → container-full → cube → face
 */
export const PoemAnimation = ({ poemHTML, backgroundImageUrl, boyImageUrl }: PoemAnimationProps) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function adjustContentSize() {
            if (contentRef.current) {
                const viewportWidth = window.innerWidth;
                const baseWidth = 1000;
                const scaleFactor = viewportWidth < baseWidth ? (viewportWidth / baseWidth) * 0.9 : 1;
                contentRef.current.style.transform = `scale(${scaleFactor})`;
            }
        }
        adjustContentSize();
        window.addEventListener('resize', adjustContentSize);
        return () => window.removeEventListener('resize', adjustContentSize);
    }, []);

    return (
        <header className="hero-section">
            <div className="poem-container">
                <div
                    ref={contentRef}
                    className="poem-content"
                    style={{ display: 'block', width: '1000px', height: '562px' }}
                >
                    <div className="container-full">
                        <div className="animated hue" />
                        <img
                            className="backgroundImage"
                            src={backgroundImageUrl}
                            alt="An old stone courtyard at dawn"
                            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                        />
                        <img
                            className="boyImage"
                            src={boyImageUrl}
                            alt="A man and woman practicing with swords"
                            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                        />

                        <div className="cube-container">
                            <div className="cube">
                                <div className="face top" />
                                <div className="face bottom" />
                                <div className="face left text" dangerouslySetInnerHTML={{ __html: poemHTML }} />
                                <div className="face right text" dangerouslySetInnerHTML={{ __html: poemHTML }} />
                                <div className="face front" />
                                <div className="face back text" dangerouslySetInnerHTML={{ __html: poemHTML }} />
                            </div>
                        </div>

                        <div className="container-reflect">
                            <div className="cube">
                                <div className="face top" />
                                <div className="face bottom" />
                                <div className="face left text" dangerouslySetInnerHTML={{ __html: poemHTML }} />
                                <div className="face right text" dangerouslySetInnerHTML={{ __html: poemHTML }} />
                                <div className="face front" />
                                <div className="face back text" dangerouslySetInnerHTML={{ __html: poemHTML }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
