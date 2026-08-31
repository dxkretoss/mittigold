import { supabase } from '../lib/supabase';

/**
 * Custom Service Functions for Products
 * 100% Dynamic Supabase queries (No static data)
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

    return data || [];
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

    return data?.[0] || null;
  },

  /**
   * Add a new product to Supabase
   */
  async add(productData) {
    const payload = {
      name: productData.name,
      pack: productData.pack,
      price: productData.price,
      stock: productData.stock ?? 80,
      stock_qty: productData.stock_qty !== undefined ? productData.stock_qty : null,
      on: productData.on ?? true
    };

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select();

      if (error) {
        // Graceful fallback if stock_qty column not yet migrated in Supabase
        if (error.code === '42703' || error.message?.includes('stock_qty')) {
          console.warn('⚠️ stock_qty column not in Supabase schema. Run migration to persist.');
          const fallbackPayload = { ...payload };
          delete fallbackPayload.stock_qty;
          const { data: fbData, error: fbError } = await supabase
            .from('products')
            .insert([fallbackPayload])
            .select();
          if (fbError) throw fbError;
          return fbData?.[0] || null;
        }
        throw error;
      }

      return data?.[0] || null;
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
      price: productData.price,
      stock: productData.stock,
      stock_qty: productData.stock_qty !== undefined ? productData.stock_qty : null,
      on: productData.on,
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) {
        // Graceful fallback if stock_qty column not yet migrated in Supabase
        if (error.code === '42703' || error.message?.includes('stock_qty')) {
          console.warn('⚠️ stock_qty column not in Supabase schema. Run migration to persist.');
          const fallbackPayload = { ...payload };
          delete fallbackPayload.stock_qty;
          const { data: fbData, error: fbError } = await supabase
            .from('products')
            .update(fallbackPayload)
            .eq('id', id)
            .select();
          if (fbError) throw fbError;
          return fbData?.[0] || null;
        }
        throw error;
      }

      return data?.[0] || null;
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

    return data?.[0] || null;
  }
};
