'use client';

export function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="px-6 py-2.5 border border-[#D6FF00]/40 text-[#D6FF00] font-black tracking-widest text-sm uppercase hover:bg-[#D6FF00]/10 transition-all cursor-pointer"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
        >
            🖨 PRINT
        </button>
    );
}
