import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Download, Home } from 'lucide-react';

export const metadata = {
    title: 'Certificate Verification | Ornate EMS',
    description: 'Verify the authenticity of a certificate issued by Ornate EMS.',
};

interface VerificationPageProps {
    params: Promise<{ id: string }>;
}

export default async function VerificationPage({ params }: VerificationPageProps) {
    const { id } = await params;

    if (!id) return notFound();

    const registration = await prisma.registration.findUnique({
        where: { id },
        include: {
            event: true,
        },
    });

    if (!registration || !registration.certificateUrl) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Certificate</h1>
                    <p className="text-gray-600">
                        The certificate ID you scanned does not exist or has not been issued yet.
                    </p>
                </div>
            </div>
        );
    }

    const { studentName, event, rank, certificateType, certificateIssuedAt } = registration;
    const isWinner = rank && rank <= 3;

    // Format date
    const issuedDate = new Date(certificateIssuedAt || registration.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="max-w-lg w-full bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100 relative">

                {/* Status Indicator */}
                <div className="bg-green-600 px-6 py-4 text-center">
                    <div className="mx-auto bg-white rounded-full p-2 w-16 h-16 flex items-center justify-center shadow-lg -mb-10 relative z-10">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                </div>

                <div className="pt-12 pb-8 px-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Certificate Verified</h1>
                    <p className="text-sm text-gray-500 mb-6">This certificate is valid and issued by Ornate EMS</p>

                    <div className="space-y-6">
                        {/* Recipient Info */}
                        <div>
                            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Presented To</p>
                            <h2 className="text-3xl font-serif text-gray-800 font-bold">{studentName}</h2>
                        </div>

                        {/* Event Info */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-600">
                                <span>{new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                <span>&bull;</span>
                                <span className="font-medium">
                                    {isWinner ? `${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} Prize Winner` : 'Participation'}
                                </span>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4 text-left text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <span className="block text-gray-400 uppercase tracking-wider font-semibold">Issue Date</span>
                                <span className="block mt-1 font-medium text-gray-700">{issuedDate}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-gray-400 uppercase tracking-wider font-semibold">Certificate ID</span>
                                <span className="block mt-1 font-mono text-gray-700">{id}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 pt-4">
                            <a href={`/api/certificates/download/${id}`}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm">
                                <Download className="w-5 h-5" />
                                Download Certificate
                            </a>
                            <Link href="/" className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-600 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition">
                                <Home className="w-5 h-5" />
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400 font-medium">
                        Verified by Ornate Event Management System
                    </p>
                </div>
            </div>
        </div>
    );
}
