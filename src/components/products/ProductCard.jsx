import React from 'react';
import { Package, Edit2, Trash2 } from 'lucide-react';

export const ProductCard = ({
  product,
  onToggleStock,
  onEdit,
  onDelete,
}) => {
  const isLowStock = product.stock < 20;

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

      <h4>{product.name}</h4>
      <div className="pack">{product.pack} bag</div>
      <div className="price">{product.price}</div>

      <div className="stockbar">
        <div className="stocklbl">
          <span>
            Stock Level
            {product.stock_qty != null && (
              <span style={{ marginLeft: '6px', color: 'var(--navy)', fontWeight: 600 }}>
                · {product.stock_qty} bags
              </span>
            )}
          </span>
          <span style={{ fontWeight: 600, color: isLowStock ? 'var(--red)' : 'var(--ink)' }}>
            {product.stock}%
          </span>
        </div>
        <div className="gfill-track">
          <div
            className="gfill"
            style={{
              width: `${Math.min(100, Math.max(0, product.stock))}%`,
              ...(isLowStock
                ? { background: 'linear-gradient(90deg, var(--red), #d17a6e)' }
                : {}),
            }}
          />
        </div>
      </div>

      <div className="card-actions">
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
