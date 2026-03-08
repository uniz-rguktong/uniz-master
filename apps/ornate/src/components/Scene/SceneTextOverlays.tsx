'use client';

import AuthForm from '@/components/UI/AuthForm';
import type { SceneTextOverlaysProps } from '@/types/scene';

export default function SceneTextOverlays({
    isWarpingActive,
    showScene1aText,
    showScene1bText,
    showScene3Text,
    showScene4Text,
    showScene5Text,
    showScene6Text,
    showScene7Text,
    showScene8Text,
    showScene9Text,
    showScene10Text,
    authMode,
    onAuthSuccess,
}: SceneTextOverlaysProps) {
    return (
        <div className={`absolute inset-0 z-10 grid place-items-center pointer-events-none transition-opacity duration-[50ms] ${isWarpingActive ? 'opacity-0' : 'opacity-100'}`}>

            {/* ── SCENE 1A — Earth ─────────────────────────────────────── */}
            {showScene1aText && (
                <div className="scene-1a-text col-start-1 row-start-1 place-self-start mt-[20vh] sm:mt-[15vh] ml-[4vw] sm:ml-[8vw] max-w-[90vw] sm:max-w-2xl px-4">
                    <h2 className="text-left text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[1.1]">
                        College fests… feel kinda familiar, right?
                    </h2>
                </div>
            )}

            {/* ── SCENE 1B — Campus ────────────────────────────────────── */}
            {showScene1bText && (
                <div className="scene-1b-text col-start-1 row-start-1 place-self-end mb-[20vh] sm:mb-[15vh] mr-[4vw] sm:mr-[8vw] max-w-[90vw] sm:max-w-2xl px-4 text-right">
                    <h2 className="text-right text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[1.1]">
                        Same stage. Same crowd. Same samosas.
                    </h2>
                </div>
            )}

            {/* ── SCENE 1B TEXT-3 ──────────────────────────────────────── */}
            {showScene3Text && (
                <div className="scene-3-text col-start-1 row-start-1 place-self-center max-w-[90vw] sm:max-w-3xl px-4 sm:px-8">
                    <h2 className="text-center text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[1.1]">
                        So we thought… why not try something bigger?
                    </h2>
                </div>
            )}

            {/* ── SCENE 1C TEXT-4 ──────────────────────────────────────── */}
            {showScene4Text && (
                <div className="scene-4-text col-start-1 row-start-1 self-start justify-self-end mt-[20vh] sm:mt-[15vh] mr-[4vw] sm:mr-[8vw] max-w-[90vw] sm:max-w-2xl px-4">
                    <h2 className="text-right text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[1.1]">
                        What if ORNATE didn&apos;t stay on the ground?
                    </h2>
                </div>
            )}

            {/* ── SCENE 1C TEXT-5 ──────────────────────────────────────── */}
            {showScene5Text && (
                <div className="scene-5-text col-start-1 row-start-1 place-self-start mt-[20vh] sm:mt-[15vh] ml-[4vw] sm:ml-[8vw] max-w-[90vw] sm:max-w-3xl px-4">
                    <h2 className="text-left text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[1.1]">
                        What if every branch had its own world?
                    </h2>
                </div>
            )}

            {/* ── SCENE 1D TEXT-6 ──────────────────────────────────────── */}
            {showScene6Text && (
                <div className="scene-6-text col-start-1 row-start-1 self-start justify-self-center mt-[20vh] sm:mt-[15vh] max-w-[90vw] sm:max-w-3xl px-4 sm:px-8">
                    <h2 className="text-center text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[1.1]">
                        Yes, we&apos;re taking ORNATE to space!
                    </h2>
                </div>
            )}

            {/* ── SCENE 1D TEXT-7 ──────────────────────────────────────── */}
            {showScene7Text && (
                <div className="scene-7-text col-start-1 row-start-1 self-end justify-self-center mb-[20vh] sm:mb-[15vh] max-w-[90vw] sm:max-w-3xl px-4 sm:px-8">
                    <h2 className="text-center text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[1.1]">
                        Planets for each branch, stars for your talents, and fun that&apos;s out of this world.
                    </h2>
                </div>
            )}

            {/* ── SCENE 1E TEXT-8 ──────────────────────────────────────── */}
            {showScene8Text && (
                <div className="scene-8-text col-start-1 row-start-1 self-start justify-self-end mt-[15vh] mr-[8vw] max-w-2xl px-4">
                    <h2 className="text-right text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[1.1]">
                        You&apos;ve been selected to join the mission.
                    </h2>
                </div>
            )}

            {/* ── SCENE 1E TEXT-9 ──────────────────────────────────────── */}
            {showScene9Text && (
                <div className="scene-9-text col-start-1 row-start-1 place-self-center max-w-3xl px-8">
                    <h2 className="text-center text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[1.1]">
                        Your space suit and ship are ready.
                    </h2>
                </div>
            )}

            {/* ── SCENE 1F TEXT-10 ─────────────────────────────────────── */}
            {showScene10Text && (
                <div className="scene-10-text col-start-1 row-start-1 self-end justify-self-start mb-[15vh] ml-[8vw] max-w-2xl px-4">
                    <h2 className="text-left text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[1.1]">
                        But first... you need to register.
                    </h2>
                </div>
            )}

            {/* ── AUTH FORM (Scene 1F end) ──────────────────────────────── */}
            <div className="scene-1f-auth opacity-0 col-start-1 row-start-1 w-full flex justify-center items-center px-4 pointer-events-none z-50">
                <AuthForm initialMode={authMode} onSuccess={onAuthSuccess} />
            </div>
        </div>
    );
}
