import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';

export const ProductModal = ({
  isOpen,
  onClose,
  product = null,
  onSave,
}) => {
  const isEditing = !!product?.id;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    pack: '',
    price: '',
    stock_qty: '',
    stock: 80,
    on: true,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        pack: product.pack || '',
        price: String(product.price || '').replace('₹', '').trim(),
        stock_qty: product.stock_qty != null ? product.stock_qty : '',
        stock: product.stock ?? 80,
        on: product.on ?? true,
      });
    } else {
      setFormData({
        name: '',
        pack: '',
        price: '',
        stock_qty: '',
        stock: 80,
        on: true,
      });
    }
  }, [product, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.pack || !formData.price) return;

    setLoading(true);
    const cleanPrice = formData.price.trim().replace('₹', '');
    const productPayload = {
      name: formData.name.trim(),
      pack: formData.pack.trim(),
      price: `₹${cleanPrice}`,
      stock_qty: formData.stock_qty !== '' && formData.stock_qty != null ? parseInt(formData.stock_qty) || 0 : null,
      stock: parseInt(formData.stock) || 0,
      on: formData.on,
    };

    try {
      await onSave(productPayload, product?.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Product' : 'Add New Product'}
      footer={
        <>
          <button className="btn-outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={loading}
            onClick={() => {
              const form = document.getElementById('productForm');
              if (form) form.requestSubmit();
            }}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {isEditing ? 'Save Changes' : 'Add Product'}
          </button>
        </>
      }
    >
      <form id="productForm" onSubmit={handleSubmit}>
        <div className="f-group">
          <label>Product Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Chakki Fresh Atta"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="f-row">
          <div className="f-group">
            <label>Pack Size</label>
            <input
              type="text"
              required
              placeholder="e.g. 30 kg"
              value={formData.pack}
              onChange={(e) => setFormData({ ...formData, pack: e.target.value })}
            />
          </div>
          <div className="f-group">
            <label>Price (₹)</label>
            <input
              type="text"
              required
              placeholder="e.g. 1,340"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
            />
          </div>
        </div>

        {/* Stock Qty & Level fields commented out for future phase
        <div className="f-group">
          <label>Stock Qty (Bags / Units)</label>
          <input
            type="number"
            min="0"
            placeholder="e.g. 150"
            value={formData.stock_qty}
            onChange={(e) =>
              setFormData({ ...formData, stock_qty: e.target.value })
            }
          />
        </div>

        <div className="f-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ margin: 0 }}>Stock Level</label>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', fontWeight: 600, color: formData.stock < 20 ? 'var(--red)' : 'var(--navy)' }}>
              {formData.stock}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.stock}
            onChange={(e) =>
              setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
            }
            style={{
              marginTop: '10px',
              background: `linear-gradient(to right, ${formData.stock < 20 ? 'var(--red)' : 'var(--wheat)'} 0%, ${formData.stock < 20 ? 'var(--red)' : 'var(--wheat)'} ${formData.stock}%, #E4E0D6 ${formData.stock}%, #E4E0D6 100%)`
            }}
          />
        </div>
        */}

        <div className="f-group f-check" style={{ marginTop: '6px' }}>
          <input
            type="checkbox"
            id="pOn"
            checked={formData.on}
            onChange={(e) => setFormData({ ...formData, on: e.target.checked })}
          />
          <label htmlFor="pOn" style={{ cursor: 'pointer' }}>Available for ordering (Distributor / Broker / Salesman)</label>
        </div>
      </form>
    </Modal>
  );
};
