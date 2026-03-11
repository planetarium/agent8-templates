/**
 * Resolves image URL from assets.json by key.
 */

type AssetsLike = { images: Record<string, { url?: string }> };

export function getImageUrl(assets: AssetsLike, key: string): string | undefined {
  const img = assets.images[key as keyof typeof assets.images];
  return img?.url;
}
