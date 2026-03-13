type AlbumPhotoLike = {
  id?: string | number | null;
  url?: string | null;
  caption?: string | null;
  filename?: string | null;
  name?: string | null;
};

const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

const sanitizeName = (value: string, fallback: string) => {
  const cleaned = value
    .trim()
    .replace(INVALID_FILENAME_CHARS, '_')
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '');

  return cleaned || fallback;
};

const extensionFromBlobType = (mimeType: string) => {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('gif')) return 'gif';
  if (mimeType.includes('bmp')) return 'bmp';
  if (mimeType.includes('svg')) return 'svg';
  return 'jpg';
};

const extensionFromUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const lastSegment = parsed.pathname.split('/').pop() || '';
    const extension = lastSegment.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(extension)) {
      return extension === 'jpeg' ? 'jpg' : extension;
    }
  } catch {
    return '';
  }
  return '';
};

const uniqueFilename = (candidate: string, usedNames: Set<string>) => {
  if (!usedNames.has(candidate)) {
    usedNames.add(candidate);
    return candidate;
  }

  const dotIndex = candidate.lastIndexOf('.');
  const base = dotIndex >= 0 ? candidate.slice(0, dotIndex) : candidate;
  const ext = dotIndex >= 0 ? candidate.slice(dotIndex) : '';

  let suffix = 2;
  while (usedNames.has(`${base} (${suffix})${ext}`)) {
    suffix += 1;
  }

  const nextName = `${base} (${suffix})${ext}`;
  usedNames.add(nextName);
  return nextName;
};

export async function downloadAlbumPhotosAsZip(albumName: string, photos: AlbumPhotoLike[]) {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const usedNames = new Set<string>();

  let added = 0;
  let failed = 0;

  for (let index = 0; index < photos.length; index += 1) {
    const photo = photos[index]!;
    const sourceUrl = photo.url?.trim();
    if (!sourceUrl) {
      failed += 1;
      continue;
    }

    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error('Unable to fetch image');
      }

      const blob = await response.blob();
      const baseName = sanitizeName(
        photo.caption || photo.filename || photo.name || `photo-${index + 1}`,
        `photo-${index + 1}`
      );
      const extension = extensionFromUrl(sourceUrl) || extensionFromBlobType(blob.type);
      const finalName = uniqueFilename(`${baseName}.${extension}`, usedNames);
      zip.file(finalName, blob);
      added += 1;
    } catch {
      failed += 1;
    }
  }

  if (added === 0) {
    throw new Error('No photos could be downloaded for this album');
  }

  const archiveBlob = await zip.generateAsync({ type: 'blob' });
  const safeAlbumName = sanitizeName(albumName, 'album').replace(/\s+/g, '-');
  const downloadUrl = window.URL.createObjectURL(archiveBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `${safeAlbumName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);

  return { added, failed };
}