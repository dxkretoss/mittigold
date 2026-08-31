import { supabase } from '../lib/supabase';

/**
 * Custom Service Functions for Brokers
 * 100% Dynamic Supabase queries (No static data)
 */
export const brokerService = {
  /**
   * Fetch all brokers from Supabase database
   */
  async getAll() {
    const { data, error } = await supabase
      .from('brokers')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Failed to load brokers from Supabase:', error.message);
      return [];
    }

    return data || [];
  },

  /**
   * Add a new broker to Supabase database
   */
  async add(brokerData) {
    const newBroker = {
      name: brokerData.name,
      phone: brokerData.phone || '',
      rate: brokerData.rate !== undefined ? Number(brokerData.rate) : 5,
      orders: brokerData.orders !== undefined ? Number(brokerData.orders) : 0,
      commission: brokerData.commission || '₹0',
      paid: brokerData.paid || '₹0',
      pending: brokerData.pending || '₹0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (brokerData.id) {
      newBroker.id = brokerData.id;
    }

    const { data, error } = await supabase
      .from('brokers')
      .insert([newBroker])
      .select();

    if (error) {
      throw new Error(`Failed to create broker: ${error.message}`);
    }

    return data?.[0] || newBroker;
  },

  /**
   * Update an existing broker in Supabase
   */
  async update(brokerId, updateData) {
    const { data, error } = await supabase
      .from('brokers')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', brokerId)
      .select();

    if (error) {
      throw new Error(`Failed to update broker: ${error.message}`);
    }

    return data?.[0] || null;
  },

  /**
   * Delete a broker from Supabase database
   */
  async delete(brokerId) {
    const { error } = await supabase
      .from('brokers')
      .delete()
      .eq('id', brokerId);

    if (error) {
      throw new Error(`Failed to delete broker: ${error.message}`);
    }

    return true;
  }
};
