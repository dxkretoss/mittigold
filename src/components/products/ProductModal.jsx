import React, { useState, useEffect, useRef } from 'react';
import { Check, Loader2, Upload, Image as ImageIcon, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { DEFAULT_PRODUCT_IMAGE, getProductImage } from '../../utils/productImageHelper';

export const ProductModal = ({
  isOpen,
  onClose,
  product = null,
  onSave,
}) => {
  const isEditing = !!product?.id;
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    pack: '',
    image: null,
    stock_qty: '',
    stock: 80,
    on: true,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        pack: product.pack || '',
        image: product.image || null,
        stock_qty: product.stock_qty != null ? product.stock_qty : '',
        stock: product.stock ?? 80,
        on: product.on ?? true,
      });
    } else {
      setFormData({
        name: '',
        pack: '',
        image: null,
        stock_qty: '',
        stock: 80,
        on: true,
      });
    }
  }, [product, isOpen]);

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, JPEG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.pack.trim()) return;

    setLoading(true);
    const productPayload = {
      name: formData.name.trim(),
      pack: formData.pack.trim(),
      image: formData.image || null,
      stock_qty: formData.stock_qty !== '' && formData.stock_qty != null ? parseInt(formData.stock_qty) || 0 : null,
      stock: parseInt(formData.stock) || 0,
      on: formData.on,
    };

    if (product?.price) {
      productPayload.price = product.price;
    }

    try {
      await onSave(productPayload, product?.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const activePreview = formData.image || DEFAULT_PRODUCT_IMAGE;

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
        {/* Product Image Upload Section */}
        <div className="f-group" style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px' }}>Product Thumbnail Image</label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px',
              background: '#FAF9F5',
              border: '1px solid var(--line)',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--line)',
                background: '#FFFFFF',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={activePreview}
                alt="Product Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  style={{ display: 'none' }}
                  id="productImageInput"
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    height: '30px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Upload className="w-3.5 h-3.5 text-wheat" />
                  <span>{formData.image ? 'Change Image' : 'Upload Image'}</span>
                </button>

                {formData.image && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleRemoveImage}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      height: '30px',
                      color: 'var(--red)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Reset to default image"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '6px' }}>
                {formData.image ? 'Custom image uploaded.' : 'Using default MittiGold product package.'}
              </div>
            </div>
          </div>
        </div>

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

        <div className="f-group">
          <label>Pack Size</label>
          <input
            type="text"
            required
            placeholder="e.g. 30 kg, 5 kg"
            value={formData.pack}
            onChange={(e) => setFormData({ ...formData, pack: e.target.value })}
          />
        </div>

        <div className="f-group f-check" style={{ marginTop: '8px' }}>
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
