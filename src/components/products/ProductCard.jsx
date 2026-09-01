import React from 'react';
import { Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { getProductImage } from '../../utils/productImageHelper';

export const ProductCard = ({
  product,
  onToggleStock,
  onEdit,
  onDelete,
}) => {
  const imageUrl = getProductImage(product);

  return (
    <div
      className="prodcard"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        overflow: 'hidden',
        background: '#FFFFFF',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Image Showcase */}
      <div
        style={{
          position: 'relative',
          height: '160px',
          background: 'linear-gradient(180deg, #FBF9F4 0%, #F5F1E8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px',
          borderBottom: '1px solid var(--line)',
          overflow: 'hidden',
        }}
      >
        {/* Top-Left: Pack Size Badge */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(228, 224, 214, 0.8)',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--navy)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            zIndex: 2,
          }}
        >
          {product.pack} bag
        </div>

        {/* Top-Right: Stock Toggle Switch */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 2,
          }}
        >
          <div
            className={`toggle ${product.on ? '' : 'off'}`}
            onClick={() => onToggleStock(product.id, product.on)}
            title={product.on ? 'Available — Click to disable' : 'Disabled — Click to enable'}
            role="button"
            tabIndex={0}
            style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
          />
        </div>

        {/* Bottom-Left: Stock Status Badge inside image */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            zIndex: 2,
          }}
        >
          {product.on ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--green)',
                background: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(6px)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(61, 122, 92, 0.25)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
              }}
            >
              <CheckCircle2 className="w-3 h-3" />
              Available for Ordering
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--ink-soft)',
                background: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(6px)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
              }}
            >
              <XCircle className="w-3 h-3" />
              Disabled from App
            </span>
          )}
        </div>

        {/* Centered Product Image */}
        <img
          src={imageUrl}
          alt={product.name}
          style={{
            maxHeight: '135px',
            maxWidth: '85%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))',
            transition: 'transform 0.3s ease',
          }}
          onError={(e) => {
            e.currentTarget.src = '/images/default-product.jpg';
          }}
        />
      </div>

      {/* Card Body: Compact Title, Pack & Price */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div>
            <h4
              style={{
                margin: 0,
                fontSize: '14.5px',
                fontWeight: 700,
                color: 'var(--navy)',
                lineHeight: 1.25,
              }}
            >
              {product.name}
            </h4>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
              Standard Pack: {product.pack}
            </div>
          </div>

          <div
            className="mono"
            style={{
              fontSize: '17px',
              fontWeight: 800,
              color: 'var(--navy)',
              whiteSpace: 'nowrap',
            }}
          >
            {product.price}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid var(--line)',
          }}
        >
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onEdit(product)}
            style={{
              padding: '4px 10px',
              fontSize: '11.5px',
              height: '30px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              borderRadius: '6px',
            }}
            title="Edit SKU and Pricing"
          >
            <Edit2 className="w-3.5 h-3.5 text-wheat" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onDelete(product)}
            style={{
              padding: '4px 10px',
              fontSize: '11.5px',
              height: '30px',
              color: 'var(--red)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              borderRadius: '6px',
            }}
            title="Delete SKU from Catalog"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
