'use client';

import { memo } from 'react';
import Link from 'next/link';
import React from 'react';

export const MissionItem = memo(({ item, i }: { item: any, i: number }) => {
    const dayNumber = String(item.time).match(/\d+/)?.[0] || '0';
    return (
        <Link key={i} href="/home/missions" className="flex items-center gap-4 mb-3 group hover:bg-white/5 px-2 py-2 rounded-sm transition-all duration-300 relative border border-transparent hover:border-white/5">
            <div className="relative shrink-0">
                {/* Tactical Mission Badge */}
                <div className={`flex flex-col items-center justify-center w-[48px] h-[36px] border ${item.active ? 'border-[var(--color-neon)]/40 bg-[var(--color-neon)]/5' : 'border-white/10 bg-white/5'} transition-all group-hover:scale-105 duration-300 relative`}>
                    <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[var(--color-neon)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[var(--color-neon)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className={`text-[11px] font-black leading-none ${item.active ? 'text-[var(--color-neon)] text-glow' : 'text-gray-500'}`}>
                        Day {dayNumber}
                    </span>
                    <span className={`text-[6px] font-bold tracking-[0.2em] mt-0.5 ${item.active ? 'text-[var(--color-neon)]/60' : 'text-gray-600'}`}>
                        MISSION
                    </span>
                </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center gap-2 mb-0.5">
                    <div className={`w-1 h-1 rounded-full ${item.active ? 'bg-[var(--color-neon)] animate-pulse' : 'bg-gray-700'}`} />
                    <span className={`text-[11px] sm:text-[13px] font-bold tracking-tight truncate ${item.active ? 'text-white' : 'text-gray-400'} group-hover:text-white transition-colors`}>
                        {item.label}
                    </span>
                </div>
                <div className="flex items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
                    <span className="text-[7px] font-black font-mono tracking-[0.1em] text-white uppercase">
                        ID_OP::{dayNumber.padStart(3, '0')}
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                    <span className={`text-[7px] font-bold ${item.active ? 'text-[var(--color-neon)]/60' : 'text-white/40'}`}>{item.date || 'TBD'}</span>
                </div>
            </div>
        </Link>
    );
});
MissionItem.displayName = 'MissionItem';

export const UpdateItem = memo(({ u, i }: { u: any, i: number }) => (
    <Link key={i} href="/home/updates" className="group flex gap-2 mb-2 px-2 py-1.5 hover:bg-white/5 rounded transition-colors cursor-pointer border-l-[1px] border-transparent hover:border-white/10">
        <div className="flex-none w-[3px] rounded-full self-stretch" style={{ background: u.color }} />
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black tracking-[0.2em] uppercase font-mono" style={{ color: u.color }}>{u.tag}</span>
                <span className="text-[9px] text-gray-500 font-bold font-mono">{u.time}</span>
            </div>
            <p className="text-[11px] sm:text-[12px] font-bold text-white/90 truncate group-hover:text-white transition-colors">{u.title}</p>
            <p className="text-[10px] text-gray-400 leading-tight mt-1 line-clamp-1 group-hover:text-gray-300 transition-colors">{u.desc}</p>
        </div>
    </Link>
));
UpdateItem.displayName = 'UpdateItem';

export const HeaderSVG = memo(({ children }: { children?: React.ReactNode }) => (
    <div className="absolute top-0 sm:top-[-1.5vw] left-0 w-full h-[30vw] sm:h-[14vw] sm:-rotate-[0.229deg] pointer-events-none">
        <svg className="hidden sm:block" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1728 243" fill="none" preserveAspectRatio="none">
            <defs>
                <clipPath id="header_hud_clip">
                    <path d="M1728 225.5L1727.99 243L1531.03 117.52L1317.03 91.2837L882.598 91.2837L430.033 91.2837L208.565 117.519L7.03386e-06 241.616L5.17919e-05 -0.00023696L255.235 -0.00021537L555.184 -0.000219253L882.598 -0.000166432L1210.56 9.48398e-05L1728 9.41001e-05L1728 225.5Z" />
                </clipPath>
            </defs>
            <g data-figma-bg-blur-radius="10">
                <image
                    href="/assets/hud_header.png"
                    width="100%"
                    height="100%"
                    preserveAspectRatio="none"
                    clipPath="url(#header_hud_clip)"
                    style={{ opacity: 0.9 }}
                />
                <path d="M207.033 114.941L207.581 114.615L208.215 114.54L429.682 88.3047L429.858 88.2838L430.035 88.2835L882.601 88.2836L1317.03 88.2833L1317.22 88.2839L1317.4 88.306L1531.4 114.541L1532.07 114.625L1532.65 114.989L1724.99 237.532L1725 225.502L1725 3.00065L1210.56 2.99994L882.596 2.99992L555.182 2.99976L255.233 2.99964L2.99978 3.00015L2.99917 236.341L207.033 114.941Z" stroke="url(#paint0_linear_28_39)" strokeOpacity="0.8" strokeWidth="6" />
                <path d="M207.033 114.941L207.581 114.615L208.215 114.54L429.682 88.3047L429.858 88.2838L430.035 88.2835L882.601 88.2836L1317.03 88.2833L1317.22 88.2839L1317.4 88.306L1531.4 114.541L1532.07 114.625L1532.65 114.989L1724.99 237.532L1725 225.502L1725 3.00065L1210.56 2.99994L882.596 2.99992L555.182 2.99976L255.233 2.99964L2.99978 3.00015L2.99917 236.341L207.033 114.941Z" stroke="url(#paint1_linear_28_39)" strokeOpacity="0.8" strokeWidth="6" />
            </g>
            <defs>
                <clipPath id="bgblur_0_28_39_clip_path" transform="translate(10 10)"><path d="M1728 225.5L1727.99 243L1531.03 117.52L1317.03 91.2837L882.598 91.2837L430.033 91.2837L208.565 117.519L7.03386e-06 241.616L5.17919e-05 -0.00023696L255.235 -0.00021537L555.184 -0.000219253L882.598 -0.000166432L1210.56 9.48398e-05L1728 9.41001e-05L1728 225.5Z" />
                </clipPath><linearGradient id="paint0_linear_28_39" x1="864.28" y1="166.606" x2="864.418" y2="295.323" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#231E1E" />
                    <stop offset="0.325058" stopColor="var(--color-neon)" />
                </linearGradient>
                <linearGradient id="paint1_linear_28_39" x1="879.405" y1="290.583" x2="881.521" y2="-0.910509" gradientUnits="userSpaceOnUse">
                    <stop offset="0.532521" stopColor="#231E1E" stopOpacity="0" />
                    <stop offset="1" stopColor="var(--color-neon)" stopOpacity="0.8" />
                </linearGradient>
            </defs>
        </svg>
        <svg className="block sm:hidden" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 958 349" fill="none" preserveAspectRatio="none">
            <foreignObject x="-10" y="-10" width="977.323" height="368.176">
                <div style={{ backdropFilter: 'blur(5px)', clipPath: 'url(#bgblur_0_1_40_clip_path)', height: '100%', width: '100%' }}></div>
            </foreignObject>
            <g data-figma-bg-blur-radius="10">
                <image
                    href="/assets/mobile_header_cockpit.png"
                    width="100%"
                    height="100%"
                    preserveAspectRatio="none"
                    clipPath="url(#mobile_header_image_clip)"
                    style={{ opacity: 0.9 }}
                />
                <path d="M113.368 169.653L114.251 168.305L115.862 168.296L476.536 166.427L840.664 164.541L842.298 164.531L843.191 165.901L953.502 335.127L953.54 320.32L954.315 3.01644L670.924 4.4842L489.39 5.42466L308.159 6.36319L142.131 7.22409L3.8307 7.94137L3.02357 338.086L113.368 169.653Z" stroke="url(#paint0_linear_1_40)" strokeOpacity="0.8" strokeWidth="6" />
                <path d="M113.368 169.653L114.251 168.305L115.862 168.296L476.536 166.427L840.664 164.541L842.298 164.531L843.191 165.901L953.502 335.127L953.54 320.32L954.315 3.01644L670.924 4.4842L489.39 5.42466L308.159 6.36319L142.131 7.22409L3.8307 7.94137L3.02357 338.086L113.368 169.653Z" stroke="url(#paint1_linear_1_40)" strokeOpacity="0.8" strokeWidth="6" />
            </g>
            <defs>
                <clipPath id="mobile_header_image_clip">
                    <path d="M956.54 320.326L956.476 345.185L840.677 167.54L476.549 169.427L115.876 171.296L6.24313e-06 348.176L0.838725 4.9559L142.117 4.22381L308.146 3.3635L489.377 2.42444L670.91 1.48414L957.323 -2.0034e-05L956.54 320.326Z" />
                </clipPath>
                <clipPath id="bgblur_0_1_40_clip_path" transform="translate(10 10)">
                    <path d="M956.54 320.326L956.476 345.185L840.677 167.54L476.549 169.427L115.876 171.296L6.24313e-06 348.176L0.838725 4.9559L142.117 4.22381L308.146 3.3635L489.377 2.42444L670.91 1.48414L957.323 -2.0034e-05L956.54 320.326Z" />
                </clipPath>
                <linearGradient id="paint0_linear_1_40" x1="478.659" y1="239.143" x2="480.109" y2="421.972" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#231E1E" />
                    <stop offset="0.325058" stopColor="var(--color-neon)" />
                </linearGradient>
                <linearGradient id="paint1_linear_1_40" x1="486.6" y1="415.21" x2="492.167" y2="1.17988" gradientUnits="userSpaceOnUse">
                    <stop offset="0.532521" stopColor="#231E1E" stopOpacity="0" />
                    <stop offset="1" stopColor="var(--color-neon)" stopOpacity="0.8" />
                </linearGradient>
            </defs>
        </svg>
        {children && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none rotate-[0.229deg] pb-[7vw]">
                {children}
            </div>
        )}
    </div>
));
HeaderSVG.displayName = 'HeaderSVG';

export const PanelSVG = memo(() => (
    <div className="absolute inset-0 z-0 pointer-events-none" style={{ transform: 'rotate(0deg)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 544 437" fill="none" preserveAspectRatio="none">
            <foreignObject x="-11.1965" y="-10" width="564.776" height="456.555">
                <div style={{ backdropFilter: 'blur(5px)', clipPath: 'url(#bgblur_0_28_23_clip_path)', height: '100%', width: '100%' }}></div>
            </foreignObject>
            <g data-figma-bg-blur-radius="10">
                <path d="M-0.966852 43.9494L-1.19649 432.536C-1.1982 435.385 1.69503 437.332 4.32896 436.254L133.698 383.297C135.599 382.519 137.61 382.039 139.659 381.874L539.913 349.693C541.985 349.526 543.579 347.798 543.579 345.718L543.57 201.251L543.57 25.5491C543.57 24.2333 542.923 22.9995 541.839 22.2495L513.658 2.74573C512.992 2.28479 512.202 2.03613 511.394 2.03252L54.7733 0.000327499C53.8839 -0.00362002 53.0195 0.288944 52.3167 0.83181L0.581522 40.7962C-0.394585 41.5502 -0.966129 42.7141 -0.966852 43.9494Z" fill="#F4F2F0" fillOpacity="0.1" />
                <path d="M3.18452 433.477C2.52625 433.746 1.80306 433.26 1.80319 432.548L2.033 43.9611C2.03319 43.6524 2.17609 43.3611 2.42014 43.1725L54.1552 3.20837C54.3308 3.07273 54.5472 2.99975 54.7695 3.00072L511.39 5.03239C511.592 5.03334 511.79 5.09611 511.957 5.21127L540.137 24.7145C540.408 24.902 540.569 25.2105 540.57 25.5394L540.57 201.242L540.579 345.709C540.58 346.229 540.181 346.661 539.663 346.703L139.409 378.883C137.053 379.073 134.74 379.625 132.554 380.52L3.18452 433.477Z" stroke="url(#paint0_linear_28_23)" strokeOpacity="0.8" strokeWidth="6" />
            </g>
            <defs>
                <clipPath id="bgblur_0_28_23_clip_path" transform="translate(11.1965 10)">
                    <path d="M-0.966852 43.9494L-1.19649 432.536C-1.1982 435.385 1.69503 437.332 4.32896 436.254L133.698 383.297C135.599 382.519 137.61 382.039 139.659 381.874L539.913 349.693C541.985 349.526 543.579 347.798 543.579 345.718L543.57 201.251L543.57 25.5491C543.57 24.2333 542.923 22.9995 541.839 22.2495L513.658 2.74573C512.992 2.28479 512.202 2.03613 511.394 2.03252L54.7733 0.000327499C53.8839 -0.00362002 53.0195 0.288944 52.3167 0.83181L0.581522 40.7962C-0.394585 41.5502 -0.966129 42.7141 -0.966852 43.9494Z" />
                </clipPath>
                <linearGradient id="paint0_linear_28_23" x1="370.475" y1="203.983" x2="7.48664" y2="-5.22525" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#231E1E" />
                    <stop offset="1" stopColor="var(--color-neon)" />
                </linearGradient>
            </defs>
        </svg>
    </div>
));
PanelSVG.displayName = 'PanelSVG';

export const RightPanelSVG = memo(() => (
    <div className="absolute inset-0 z-0 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 545 437" fill="none" preserveAspectRatio="none">
            <foreignObject x="-10" y="-10" width="564.776" height="456.555">
                <div style={{ backdropFilter: 'blur(5px)', clipPath: 'url(#bgblur_0_28_24_clip_path)', height: '100%', width: '100%' }}></div>
            </foreignObject>
            <g data-figma-bg-blur-radius="10">
                <path d="M544.546 43.9494L544.776 432.536C544.777 435.385 541.884 437.332 539.25 436.254L409.881 383.297C407.98 382.519 405.969 382.039 403.92 381.874L3.66661 349.693C1.59384 349.526 -0.000186963 347.798 -5.1671e-05 345.718L0.00934485 201.251L0.00934478 25.5491C0.00934478 24.2333 0.656523 22.9995 1.74016 22.2495L29.9212 2.74573C30.5872 2.28479 31.3767 2.0361 32.1854 2.03252L488.806 0.000296981C489.695 -0.00365053 490.56 0.288944 491.262 0.83181L542.998 40.7962C543.974 41.5502 544.545 42.714 544.546 43.9494Z" fill="#F4F2F0" fillOpacity="0.1" />
                <path d="M540.395 433.477C541.012 433.729 541.686 433.317 541.767 432.678L541.776 432.547L541.546 43.9611C541.546 43.6524 541.403 43.3611 541.159 43.1725L489.424 3.20837C489.248 3.07264 489.032 2.03975 488.81 3.00072L32.1889 5.03239C31.9869 5.03331 31.7891 5.09604 31.6226 5.21127L3.44183 24.7145C3.171 24.902 3.00969 25.2105 3.00966 25.5394L3.00913 201.242L2.99967 345.709C2.99964 346.229 3.39821 346.661 3.91621 346.703L404.17 378.883C406.526 379.073 408.839 379.625 411.025 380.52L540.395 433.477Z" stroke="url(#paint0_linear_28_24)" strokeOpacity="0.8" strokeWidth="6" />
            </g>
            <defs>
                <clipPath id="bgblur_0_28_24_clip_path" transform="translate(10 10)">
                    <path d="M544.546 43.9494L544.776 432.536C544.777 435.385 541.884 437.332 539.25 436.254L409.881 383.297C407.98 382.519 405.969 382.039 403.92 381.874L3.66661 349.693C1.59384 349.526 -0.000186963 347.798 -5.1671e-05 345.718L0.00934485 201.251L0.00934478 25.5491C0.00934478 24.2333 0.656523 22.9995 1.74016 22.2495L29.9212 2.74573C30.5872 2.28479 31.3767 2.0361 32.1854 2.03252L488.806 0.000296981C489.695 -0.00365053 490.56 0.288944 491.262 0.83181L542.998 40.7962C543.974 41.5502 544.545 42.714 544.546 43.9494Z" />
                </clipPath>
                <linearGradient id="paint0_linear_28_24" x1="173.104" y1="203.983" x2="536.093" y2="-5.22525" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#231E1E" />
                    <stop offset="1" stopColor="var(--color-neon)" />
                </linearGradient>
            </defs>
        </svg>
    </div>
));
RightPanelSVG.displayName = 'RightPanelSVG';
export const FooterDesktopSVG = memo(() => (
    <svg className="hidden sm:block" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1728 119" fill="none" preserveAspectRatio="none">
        <defs>
            <clipPath id="desktop_footer_image_clip">
                <path d="M761.328 0C787.328 21.7273 821.791 34.96 859.598 34.96C897.404 34.9599 931.867 21.7271 957.866 0H969.308L1567.75 51.668C1580.47 52.7662 1592.94 55.8063 1604.74 60.6836L1727.53 111.438C1731.58 113.111 1730.38 119.135 1726.01 119.136H3C0.790948 119.136 -0.99986 117.345 -1 115.136V114.882C-0.999882 113.261 -0.0219058 111.801 1.47656 111.184L124.309 60.6064C136.03 55.7801 148.417 52.7641 161.045 51.6631L753.616 0H761.328Z" />
            </clipPath>
        </defs>
        <foreignObject x="-11" y="-10" width="1751.01" height="139.136"><div style={{ backdropFilter: 'blur(5px)', clipPath: 'url(#bgblur_0_28_75_clip_path)', height: '100%', width: '100%' }}></div></foreignObject><g data-figma-bg-blur-radius="10">
            <mask id="path-1-inside-1_28_75" fill="white">
                <path d="M761.328 0C787.328 21.7273 821.791 34.96 859.598 34.96C897.404 34.9599 931.867 21.7271 957.866 0H969.308L1567.75 51.668C1580.47 52.7662 1592.94 55.8063 1604.74 60.6836L1727.53 111.438C1731.58 113.111 1730.38 119.135 1726.01 119.136H3C0.790948 119.136 -0.99986 117.345 -1 115.136V114.882C-0.999882 113.261 -0.0219058 111.801 1.47656 111.184L124.309 60.6064C136.03 55.7801 148.417 52.7641 161.045 51.6631L753.616 0H761.328Z" />
            </mask>
            <image
                href="/assets/mobile_header_cockpit.png"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                clipPath="url(#desktop_footer_image_clip)"
                style={{ opacity: 0.9 }}
            />
            <path d="M761.328 0C787.328 21.7273 821.791 34.96 859.598 34.96C897.404 34.9599 931.867 21.7271 957.866 0H969.308L1567.75 51.668C1580.47 52.7662 1592.94 55.8063 1604.74 60.6836L1727.53 111.438C1731.58 113.111 1730.38 119.135 1726.01 119.136H3C0.790948 119.136 -0.99986 117.345 -1 115.136V114.882C-0.999882 113.261 -0.0219058 111.801 1.47656 111.184L124.309 60.6064C136.03 55.7801 148.417 52.7641 161.045 51.6631L753.616 0H761.328Z" fill="#F4F2F0" fillOpacity="0.05" />
            <path d="M761.328 0V-6H753.355L753.095 -5.97733L753.616 0ZM859.598 34.96V40.96V40.96V34.96ZM957.866 0V-6H955.689L954.019 -4.60401L957.866 0ZM969.308 0L969.824 -5.97776L969.566 -6H969.308V0ZM1567.75 51.668L1567.23 57.6457V57.6457L1567.75 51.668ZM1604.74 60.6836L1607.04 55.1386V55.1386L1604.74 60.6836ZM1727.53 111.438L1729.83 105.894V105.894L1727.53 111.438ZM1726.01 119.136V125.136H1726.01L1726.01 119.136ZM-1 115.136H-7V115.136L-1 115.136ZM-1 114.882L-7 114.881V114.882H-1ZM1.47656 111.184L-0.807908 105.636L-0.808588 105.636L1.47656 111.184ZM124.309 60.6064L126.593 66.1545H126.593L124.309 60.6064ZM161.045 51.6631L161.566 57.6404V57.6404L161.045 51.6631ZM753.616 0V-6H753.355L753.095 -5.97733L753.616 0ZM761.328 0L757.481 4.604C784.558 27.232 820.383 40.96 859.598 40.96V28.96C823.199 28.96 790.097 16.2226 765.176 -4.604L761.328 0ZM859.598 34.96V40.96C898.813 40.9599 934.637 27.2318 961.714 4.60401L957.866 0L954.019 -4.60401C929.097 16.2224 895.996 28.9599 859.598 28.96V34.96ZM957.866 0V6H969.308V0V-6H957.866V0ZM969.308 0L968.792 5.97776L1567.23 57.6457L1567.75 51.668L1568.26 45.6902L969.824 -5.97776L969.308 0ZM1567.75 51.668L1567.23 57.6457C1579.34 58.6913 1591.22 61.5854 1602.45 66.2286L1604.74 60.6836L1607.04 55.1386C1594.67 50.0271 1581.59 46.8412 1568.26 45.6902L1567.75 51.668ZM1604.74 60.6836L1602.45 66.2286L1725.24 116.983L1727.53 111.438L1729.83 105.894L1607.04 55.1386L1604.74 60.6836ZM1727.53 111.438L1725.24 116.983C1724.91 116.845 1724.48 116.502 1724.22 115.968C1723.99 115.5 1723.98 115.068 1724.04 114.746C1724.11 114.425 1724.28 114.03 1724.67 113.685C1725.12 113.29 1725.64 113.136 1726.01 113.136L1726.01 119.136L1726.01 125.136C1736.95 125.135 1739.94 110.074 1729.83 105.894L1727.53 111.438ZM1726.01 119.136V113.136H3V119.136V125.136H1726.01V119.136ZM3 119.136V113.136C4.10504 113.136 4.99993 114.031 5 115.135L-1 115.136L-7 115.136C-6.99965 120.658 -2.52314 125.136 3 125.136V119.136ZM-1 115.136H5V114.882H-1H-7V115.136H-1ZM-1 114.882L5 114.882C4.99994 115.693 4.51096 116.423 3.76171 116.731L1.47656 111.184L-0.808588 105.636C-4.55477 107.179 -6.9997 110.83 -7 114.881L-1 114.882ZM1.47656 111.184L3.76103 116.732L126.593 66.1545L124.309 60.6064L122.024 55.0584L-0.807907 105.636L1.47656 111.184ZM124.309 60.6064L126.593 66.1545C137.752 61.5598 149.544 58.6885 161.566 57.6404L161.045 51.6631L160.524 45.6858C147.289 46.8396 134.308 50.0005 122.024 55.0584L124.309 60.6064ZM161.045 51.6631L161.566 57.6404L754.137 5.97733L753.616 0L753.095 -5.97733L160.524 45.6858L161.045 51.6631ZM753.616 0V6H761.328V0V-6H753.616V0Z" fill="url(#paint0_linear_28_75)" mask="url(#path-1-inside-1_28_75)" />
        </g>
        <defs>
            <clipPath id="bgblur_0_28_75_clip_path" transform="translate(11 10)"><path d="M761.328 0C787.328 21.7273 821.791 34.96 859.598 34.96C897.404 34.9599 931.867 21.7271 957.866 0H969.308L1567.75 51.668C1580.47 52.7662 1592.94 55.8063 1604.74 60.6836L1727.53 111.438C1731.58 113.111 1730.38 119.135 1726.01 119.136H3C0.790948 119.136 -0.99986 117.345 -1 115.136V114.882C-0.999882 113.261 -0.0219058 111.801 1.47656 111.184L124.309 60.6064C136.03 55.7801 148.417 52.7641 161.045 51.6631L753.616 0H761.328Z" />
            </clipPath><linearGradient id="paint0_linear_28_75" x1="864.505" y1="0.000479975" x2="864.505" y2="119.136" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--color-neon)" />
                <stop offset="0.42684" stopColor="#231E1E" />
            </linearGradient>
        </defs>
    </svg>
));
FooterDesktopSVG.displayName = 'FooterDesktopSVG';

export const FooterMobileSVG = memo(({ onLeftClick, onRightClick }: { onLeftClick: () => void, onRightClick: () => void }) => (
    <svg className="block sm:hidden absolute bottom-0 left-0 w-full pointer-events-none" style={{ height: '40.6vw', transform: 'rotate(-0.189deg)', fill: 'none' }} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" width="430" height="171" viewBox="0 0 430 171">
        <defs>
            <clipPath id="mobile_footer_image_clip">
                <path d="M426.338 171.719L296.278 169.926L296.247 169.926L296.217 169.926L218.866 170.437L137.353 169.925L62.6695 169.457L2.09857 169.076L2.09693 18.8829L28.9866 59.9638L29.3537 60.5239L29.9242 60.8742L55.9234 76.8745L56.6466 77.3188L57.4952 77.3193L134.331 77.3186L134.331 103.291L134.332 104.418L135.075 105.267L144.742 116.298L146.011 117.747L147.858 117.192L174.902 109.082C181.226 107.186 187.693 105.81 194.24 104.968L212.812 102.58L244.883 106.248L290.797 117.237L292.812 117.719L293.978 116.005L301.477 104.974L301.997 104.211L301.997 103.287L301.996 77.3187L370.495 77.3193L371.292 77.319L371.985 76.9237L399.984 60.9235L400.748 60.4878L401.156 59.7078L426.016 12.1634L426.338 171.719Z" />
            </clipPath>
        </defs>
        <foreignObject x="-10.9036" y="-10" width="450.249" height="194.761"><div style={{ backdropFilter: 'blur(5px)', height: '100%', width: '100%' }}></div></foreignObject>
        <g data-figma-bg-blur-radius="10">
            <image href="/assets/mobile_header_cockpit.png" width="100%" height="100%" preserveAspectRatio="none" clipPath="url(#mobile_footer_image_clip)" style={{ opacity: 0.9 }} />
            <path d="M426.338 171.719L296.278 169.926L296.247 169.926L296.217 169.926L218.866 170.437L137.353 169.925L62.6695 169.457L2.09857 169.076L2.09693 18.8829L28.9866 59.9638L29.3537 60.5239L29.9242 60.8742L55.9234 76.8745L56.6466 77.3188L57.4952 77.3193L134.331 77.3186L134.331 103.291L134.332 104.418L135.075 105.267L144.742 116.298L146.011 117.747L147.858 117.192L174.902 109.082C181.226 107.186 187.693 105.81 194.24 104.968L212.812 102.58L244.883 106.248L290.797 117.237L292.812 117.719L293.978 116.005L301.477 104.974L301.997 104.211L301.997 103.287L301.996 77.3187L370.495 77.3193L371.292 77.319L371.985 76.9237L399.984 60.9235L400.748 60.4878L401.156 59.7078L426.016 12.1634L426.338 171.719Z" stroke="url(#paint0_linear_55_5)" strokeOpacity="0.8" strokeWidth="6" />
            <path d="M426.338 171.719L296.278 169.926L296.247 169.926L296.217 169.926L218.866 170.437L137.353 169.925L62.6695 169.457L2.09857 169.076L2.09693 18.8829L28.9866 59.9638L29.3537 60.5239L29.9242 60.8742L55.9234 76.8745L56.6466 77.3188L57.4952 77.3193L134.331 77.3186L134.331 103.291L134.332 104.418L135.075 105.267L144.742 116.298L146.011 117.747L147.858 117.192L174.902 109.082C181.226 107.186 187.693 105.81 194.24 104.968L212.812 102.58L244.883 106.248L290.797 117.237L292.812 117.719L293.978 116.005L301.477 104.974L301.997 104.211L301.997 103.287L301.997 77.3187L370.495 77.3193L371.292 77.319L371.985 76.9237L399.984 60.9235L400.748 60.4878L401.156 59.7078L426.016 12.1634L426.338 171.719Z" stroke="url(#paint1_linear_55_5)" strokeOpacity="0.8" strokeWidth="6" />
        </g>
        <foreignObject x="0" y="0" width="100%" height="100%" className="pointer-events-none">
            <div className="w-full h-full relative">
                <button onClick={onLeftClick} className="absolute left-[12%] bottom-[32%] pointer-events-auto flex flex-col items-center group outline-none">
                    <span className="text-[10px] font-black tracking-[0.2em] text-white/70 group-hover:text-[var(--color-neon)] group-hover:text-glow transition-all uppercase">Updates</span>
                    <div className="w-8 h-[1.5px] bg-[var(--color-neon)]/0 group-hover:bg-[var(--color-neon)] shadow-[0_0_8px_var(--color-neon)] transition-all mt-1" />
                </button>
                <button onClick={onRightClick} className="absolute right-[9%] bottom-[32%] pointer-events-auto flex flex-col items-center group outline-none">
                    <span className="text-[10px] font-black tracking-[0.2em] text-white/70 group-hover:text-[var(--color-neon)] group-hover:text-glow transition-all uppercase">Scanner</span>
                    <div className="w-8 h-[1.5px] bg-[var(--color-neon)]/0 group-hover:bg-[var(--color-neon)] shadow-[0_0_8px_var(--color-neon)] transition-all mt-1" />
                </button>
            </div>
        </foreignObject>
        <defs>
            <linearGradient id="paint0_linear_55_5" x1="214.364" y1="63.7349" x2="215.064" y2="-55.4562" gradientUnits="userSpaceOnUse">
                <stop stopColor="#231E1E" />
                <stop offset="0.343526" stopColor="var(--color-neon)" />
            </linearGradient>
            <linearGradient id="paint1_linear_55_5" x1="214.68" y1="-51.8103" x2="226.937" y2="173.654" gradientUnits="userSpaceOnUse">
                <stop offset="0.532521" stopColor="#231E1E" stopOpacity="0" />
                <stop offset="0.754005" stopColor="var(--color-neon)" stopOpacity="0.8" />
            </linearGradient>
        </defs>
    </svg>
));
FooterMobileSVG.displayName = 'FooterMobileSVG';
