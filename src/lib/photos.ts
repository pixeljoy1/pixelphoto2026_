import manifest from '../data/photo-assets.json';

export interface PhotoAsset {
  thumb: string;
  full: string;
}

const assets = manifest as Record<string, PhotoAsset>;

// Local, resized copies live in public/photos/<discipline>/. Rows without an
// entry here haven't been pulled from Drive yet (see scripts/resize-images.mjs).
export function localPhoto(fileId: string): PhotoAsset | null {
  return assets[fileId] ?? null;
}
