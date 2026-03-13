import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLoading() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-md p-8 space-y-6 animate-pulse">
                <div className="text-center space-y-2">
                    <Skeleton width={160} height={32} borderRadius={8} className="mx-auto" />
                    <Skeleton width={240} height={16} borderRadius={6} className="mx-auto" />
                </div>
                <div className="space-y-4">
                    <Skeleton width="100%" height={44} borderRadius={8} />
                    <Skeleton width="100%" height={44} borderRadius={8} />
                    <Skeleton width="100%" height={44} borderRadius={12} />
                </div>
            </div>
        </div>
    );
}
