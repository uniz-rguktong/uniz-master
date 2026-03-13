import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PrintButton } from '../../PrintButton';

export default async function VerifySportCertificatePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const sportReg = await prisma.sportRegistration.findUnique({
        where: { id },
        include: {
            Sport: { select: { name: true, category: true, gender: true, certificateStatus: true, certificateIssuedAt: true } }
        },
    });

    if (!sportReg) notFound();

    // For sports, check if the sport's certificate has been issued by admin
    const hasCert = sportReg.Sport.certificateStatus === 'ISSUED' || !!sportReg.Sport.certificateIssuedAt;
    const issuedDate = sportReg.Sport.certificateIssuedAt
        ? new Date(sportReg.Sport.certificateIssuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    // Download route — the API will resolve from R2
    const downloadHref = `/api/certificates/sport/download/${id}`;

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 font-mono gap-6">

            {hasCert ? (
                <div className="w-full max-w-2xl flex flex-col items-center gap-8">
                    <div className="w-full border border-sky-400/30 bg-black/60 p-6 text-center"
                        style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>

                        <div className="py-12 space-y-4">
                            <div className="w-16 h-16 mx-auto border-2 border-sky-400/40 flex items-center justify-center mb-6"
                                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                                <span className="text-3xl">🏅</span>
                            </div>
                            <h2 className="text-sky-400 font-black tracking-[0.3em] uppercase text-lg">Sport Certificate Issued</h2>
                            <p className="text-white/60 text-sm tracking-widest">{sportReg.Sport.name}</p>
                            <p className="text-white/40 text-xs tracking-widest">{sportReg.Sport.category} · {sportReg.Sport.gender}</p>
                            {issuedDate && (
                                <p className="text-white/30 text-xs tracking-widest font-mono">Issued: {issuedDate}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                        <a
                            href={downloadHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-3 bg-sky-400 text-black font-black tracking-widest text-sm uppercase hover:bg-sky-300 transition-all"
                            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                        >
                            ↓ DOWNLOAD CERTIFICATE
                        </a>
                        <PrintButton />
                    </div>
                </div>
            ) : (
                <div className="max-w-md w-full border border-amber-400/30 bg-amber-950/20 p-10 text-center"
                    style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                    <p className="text-amber-400 font-black tracking-widest uppercase mb-2 text-lg">Certificate Not Yet Issued</p>
                    <p className="text-white/40 text-sm tracking-[0.2em]">
                        The admin has not yet issued a certificate for this sport.
                    </p>
                </div>
            )}

            {/* Verified info strip */}
            <div className="max-w-2xl w-full border border-sky-400/20 bg-black/60 p-5 print:hidden"
                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                <p className="text-sky-400 text-[10px] font-black tracking-[0.4em] uppercase mb-3">✓ VERIFIED RECORD</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    {[
                        { label: 'Participant', value: sportReg.studentName },
                        { label: 'Student ID', value: sportReg.studentId },
                        { label: 'Sport', value: sportReg.Sport.name },
                        { label: 'Status', value: sportReg.status },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <p className="text-[8px] text-white/30 tracking-widest uppercase mb-1">{label}</p>
                            <p className={`text-xs font-bold tracking-widest truncate ${label === 'Status' && (value === 'ATTENDED' || value === 'CONFIRMED')
                                    ? 'text-emerald-400' : label === 'Status' ? 'text-amber-400' : 'text-white'
                                }`}>{value}</p>
                        </div>
                    ))}
                </div>
                <p className="text-white/15 text-[8px] tracking-widest font-mono mt-4">
                    VERIFICATION ID: {id} · ORNATE '26 · RGUKT ONG
                </p>
            </div>
        </div>
    );
}
