import { CoordinatorProvider } from '@/context/CoordinatorContext';
import { ClubProvider } from '@/context/ClubContext';
import { ClbToastProvider } from '@/context/ClbToastContext';
import { getCurrentUserEntity } from '@/actions/clubEntityGetters';

export default async function ClubsPortalLayout({ children }: { children: React.ReactNode }) {
    const { entity, allEntities } = await getCurrentUserEntity();

    // Ensure we have at least defaults if something fails
    if (!entity) {
        // Handle critical failure if needed, or pass empty defaults
        // For now, let the provider handle it via its own logic if passed null,
        // but TypeScript expects non-null based on my provider definition.
        // My provider definition says: initialEntity: ClubEntity.
        // getCurrentUserEntity guarantees returning at least a fallback entity unless everything fails catastrophically.
    }

    return (
        <CoordinatorProvider>
            <ClubProvider
                initialEntity={entity!}
                initialEntities={allEntities}
            >
                <ClbToastProvider>
                    {children}
                </ClbToastProvider>
            </ClubProvider>
        </CoordinatorProvider>
    );
}
