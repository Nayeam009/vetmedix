import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Extracts the storage path from a full Supabase public URL.
 * E.g., "https://xxx.supabase.co/storage/v1/object/public/pet-media/user-id/avatars/123.webp"
 * returns "user-id/avatars/123.webp"
 */
export function extractStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(publicUrl.substring(idx + marker.length));
  } catch {
    return null;
  }
}

/**
 * Removes files from a storage bucket given their full public URLs.
 * Silently skips URLs that don't match the bucket pattern.
 */
export async function removeStorageFiles(urls: string[], bucket = 'pet-media'): Promise<void> {
  const paths = urls
    .map((url) => extractStoragePath(url, bucket))
    .filter((p): p is string => p !== null);

  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) {
    logger.error('Failed to remove storage files:', error);
  }
}
