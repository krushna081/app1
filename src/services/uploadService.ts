import { supabase } from '../lib/supabase';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function extensionFor(contentType: string): string {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  return 'jpg';
}

export const uploadService = {
  async uploadVisitorPhoto(
    uri: string,
    societyId: string,
    mimeType?: string | null,
  ): Promise<string> {
    const contentType = mimeType && ALLOWED_IMAGE_TYPES.has(mimeType) ? mimeType : 'image/jpeg';
    const photoPath = `${societyId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}.${extensionFor(contentType)}`;

    const response = await fetch(uri);
    const imageData = await response.arrayBuffer();

    const { error } = await supabase.storage.from('visitor-photos').upload(photoPath, imageData, {
      contentType,
      upsert: false,
    });

    if (error) throw error;

    return photoPath;
  },
};
