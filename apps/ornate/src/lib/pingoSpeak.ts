/**
 * pingoSpeak — shared utility to make Pingo speak any text.
 * Simulates a cute cartoon penguin voice using maximum pitch
 * and a chirpy speech rate with the Web Speech API.
 */
export function pingoSpeak(text: string) {
    if (typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const speak = () => {
        const utterance = new SpeechSynthesisUtterance(text);

        // 🐧 Penguin-style settings:
        // Pitch slightly elevated for character, rate slowed down for clarity
        utterance.pitch = 1.5;
        utterance.rate = 1.0;  // Slowed down to make the speech clear
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();

        // Best voices for a "cute cartoon" feel at high pitch:
        // - Google US English: sounds like a squeaky rubber duck when pitched max
        // - Microsoft David (en-US): very distinct when pitched to 2.0
        // - Any short-named neutral voice
        // Avoid: Google UK English Female (sounds too human), Samantha (too natural)
        const penguinVoice =
            voices.find(v => v.name === 'Google US English') ||
            voices.find(v => v.name === 'Microsoft David - English (United States)') ||
            voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
            voices.find(v => v.lang === 'en-US') ||
            voices.find(v => v.lang.startsWith('en'));

        if (penguinVoice) utterance.voice = penguinVoice;

        // Prevent GC on Chrome/Safari
        // @ts-ignore
        window._currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    };

    // Tiny delay to let cancel() flush — Chrome bug fix
    setTimeout(speak, 10);
}
