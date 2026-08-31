import React from 'react';
import { Package, Edit2, Trash2 } from 'lucide-react';

export const ProductCard = ({
  product,
  onToggleStock,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="prodcard">
      <div className="top">
        <div className="sku-ic">
          <Package className="w-5 h-5" style={{ color: 'var(--wheat)' }} />
        </div>
        <div
          className={`toggle ${product.on ? '' : 'off'}`}
          onClick={() => onToggleStock(product.id, product.on)}
          title={product.on ? 'Available — Click to disable' : 'Disabled — Click to enable'}
          role="button"
          tabIndex={0}
        />
      </div>

      {/* Product Name, Pack & Price aligned in one cohesive row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          marginTop: '12px',
        }}
      >
        <div>
          <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 600 }}>{product.name}</h4>
          <div className="pack" style={{ marginTop: '2px' }}>{product.pack} bag</div>
        </div>
        <div
          className="price"
          style={{
            margin: 0,
            whiteSpace: 'nowrap',
            fontSize: '18px',
            textAlign: 'right',
            color: 'var(--navy)',
            fontWeight: 700,
          }}
        >
          {product.price}
        </div>
      </div>

      <div className="card-actions" style={{ marginTop: '14px' }}>
        <button
          type="button"
          className="icon-sm"
          onClick={() => onEdit(product)}
          title="Edit Product"
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          type="button"
          className="icon-sm danger"
          onClick={() => onDelete(product)}
          title="Delete Product"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
};
