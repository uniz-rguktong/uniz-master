export const ASSETS_BASE_URL = process.env.NEXT_PUBLIC_ASSETS_URL || '';

/**
 * Returns the cloud URL for an asset if it exists, otherwise returns the local path.
 * @param path The local path to the asset (e.g., '/assets/logo.svg')
 */
export const getAssetUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // If it's an asset in the /assets folder and we have a cloud base URL
    if (ASSETS_BASE_URL && cleanPath.startsWith('assets/')) {
        // Remove 'assets/' prefix from the clean path because the base URL already points to the prefix
        const assetRelativePath = cleanPath.replace('assets/', '');
        return `${ASSETS_BASE_URL}/${assetRelativePath}`;
    }

    return path;
};
