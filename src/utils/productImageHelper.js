/**
 * Product Image Helper
 * Provides fallback product image and helper utils for MittiGold SKUs
 */

export const DEFAULT_PRODUCT_IMAGE = '/images/default-product.jpg';

export function getProductImage(product) {
  if (product && product.image && typeof product.image === 'string' && product.image.trim()) {
    return product.image.trim();
  }
  return DEFAULT_PRODUCT_IMAGE;
}
