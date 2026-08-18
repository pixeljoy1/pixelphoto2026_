import manifest from '../data/photo-assets.json';
import hotlinkAllowlist from '../data/drive-hotlinks.json';

export interface PhotoAsset {
  thumb: string;
  full: string;
}

const assets = manifest as Record<string, PhotoAsset>;
const hotlinkEligible = hotlinkAllowlist as Record<string, true>;

// Temporary fallback for while Drive's download_file_content connector is
// down: the JOYDEEP_PHOTOGRAPHY root is link-shared, so Google's own image
// CDN can serve a resolution-capped copy directly. Only fileIds confirmed
// reachable (src/data/drive-hotlinks.json) get this treatment — files
// outside the shared root fall through to the pending placeholder instead
// of a broken image. Self-heals: once resize-images.mjs syncs a file, its
// photo-assets.json entry takes priority here automatically.
function driveHotlink(fileId: string): PhotoAsset {
  return {
    thumb: `https://lh3.googleusercontent.com/d/${fileId}=w640`,
    full: `https://lh3.googleusercontent.com/d/${fileId}=w2000`,
  };
}

// Local, resized copies live in public/photos/<discipline>/. Rows without an
// entry here haven't been pulled from Drive yet (see scripts/resize-images.mjs).
export function localPhoto(fileId: string): PhotoAsset | null {
  if (assets[fileId]) return assets[fileId];
  if (hotlinkEligible[fileId]) return driveHotlink(fileId);
  return null;
}
