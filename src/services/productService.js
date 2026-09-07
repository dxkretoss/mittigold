import { supabase } from '../lib/supabase';

const PRODUCT_IMAGES_KEY = 'mittigold_product_images';

function getLocalImages() {
  try {
    const raw = localStorage.getItem(PRODUCT_IMAGES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function saveLocalImage(productId, imageBase64) {
  try {
    const map = getLocalImages();
    if (imageBase64) {
      map[productId] = imageBase64;
    } else {
      delete map[productId];
    }
    localStorage.setItem(PRODUCT_IMAGES_KEY, JSON.stringify(map));
  } catch (_) {}
}

/**
 * Custom Service Functions for Products
 * 100% Dynamic Supabase queries with image support
 */
export const productService = {
  /**
   * Fetch all products from Supabase
   */
  async getAll() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to load products: ${error.message}`);
    }

    const localImages = getLocalImages();

    return (data || []).map((p) => ({
      ...p,
      image: localImages[p.id] || p.image || null,
    }));
  },

  /**
   * Toggle product stock availability
   */
  async toggleStock(id, currentOnState) {
    const newOnState = !currentOnState;
    const { data, error } = await supabase
      .from('products')
      .update({ on: newOnState, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) {
      throw new Error(`Failed to update stock: ${error.message}`);
    }

    const localImages = getLocalImages();
    const res = data?.[0] || null;
    return res ? { ...res, image: localImages[res.id] || res.image || null } : null;
  },

  /**
   * Add a new product to Supabase
   */
  async add(productData) {
    const payload = {
      name: productData.name,
      pack: productData.pack,
      stock: productData.stock ?? 80,
      stock_qty: productData.stock_qty !== undefined ? productData.stock_qty : null,
      on: productData.on ?? true,
    };

    if (productData.price !== undefined) {
      payload.price = productData.price;
    }

    if (productData.image) {
      payload.image = productData.image;
    }

    try {
      let result = null;
      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select();

      if (error) {
        // Fallback without extra non-schema columns
        const fallbackPayload = {
          name: productData.name,
          pack: productData.pack,
          stock: productData.stock ?? 80,
          on: productData.on ?? true,
        };
        if (productData.price !== undefined) {
          fallbackPayload.price = productData.price;
        }
        const { data: fbData, error: fbError } = await supabase
          .from('products')
          .insert([fallbackPayload])
          .select();
        if (fbError) throw fbError;
        result = fbData?.[0] || null;
      } else {
        result = data?.[0] || null;
      }

      if (result && productData.image) {
        saveLocalImage(result.id, productData.image);
        result.image = productData.image;
      }

      return result;
    } catch (err) {
      throw new Error(`Failed to add product: ${err.message}`);
    }
  },

  /**
   * Update an existing product in Supabase
   */
  async update(id, productData) {
    const payload = {
      name: productData.name,
      pack: productData.pack,
      stock: productData.stock,
      stock_qty: productData.stock_qty !== undefined ? productData.stock_qty : null,
      on: productData.on,
      updated_at: new Date().toISOString(),
    };

    if (productData.price !== undefined) {
      payload.price = productData.price;
    }

    if (productData.image !== undefined) {
      payload.image = productData.image;
    }

    try {
      let result = null;
      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) {
        // Fallback without extra non-schema columns
        const fallbackPayload = {
          name: productData.name,
          pack: productData.pack,
          stock: productData.stock,
          on: productData.on,
          updated_at: new Date().toISOString(),
        };
        if (productData.price !== undefined) {
          fallbackPayload.price = productData.price;
        }
        const { data: fbData, error: fbError } = await supabase
          .from('products')
          .update(fallbackPayload)
          .eq('id', id)
          .select();
        if (fbError) throw fbError;
        result = fbData?.[0] || null;
      } else {
        result = data?.[0] || null;
      }

      if (result) {
        if (productData.image !== undefined) {
          saveLocalImage(id, productData.image);
          result.image = productData.image;
        } else {
          const localImages = getLocalImages();
          result.image = localImages[id] || result.image || null;
        }
      }

      return result;
    } catch (err) {
      throw new Error(`Failed to update product: ${err.message}`);
    }
  },

  /**
   * Delete a product from Supabase
   */
  async delete(id) {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }

    saveLocalImage(id, null);

    return data?.[0] || null;
  }
};
