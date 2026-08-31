import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Loader2, Package, RefreshCw } from 'lucide-react';
import { ProductCard } from '../../components/products/ProductCard';
import { ProductModal } from '../../components/products/ProductModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { productService } from '../../services/productService';
import { useToast } from '../../hooks/useToast';

export const Products = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'active' | 'inactive' | 'low_stock'

  const [modalState, setModalState] = useState({
    isOpen: false,
    product: null,
  });

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    product: null,
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data || []);
    } catch (err) {
      showError('Error Loading Products', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleToggleStock = async (productId, currentOn) => {
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, on: !currentOn } : p))
    );

    try {
      const updated = await productService.toggleStock(productId, currentOn);
      if (updated) {
        showInfo(
          updated.on ? 'Product Enabled' : 'Product Disabled',
          `${updated.name} (${updated.pack}) is now ${updated.on ? 'visible' : 'hidden'} on mobile ordering.`
        );
      }
    } catch (err) {
      showError('Failed to update product', err.message);
      loadProducts();
    }
  };

  const handleOpenAdd = () => {
    setModalState({ isOpen: true, product: null });
  };

  const handleOpenEdit = (product) => {
    setModalState({ isOpen: true, product });
  };

  const handleSaveProduct = async (productData, productId) => {
    try {
      if (productId) {
        const updated = await productService.update(productId, productData);
        showSuccess(
          'Product Updated',
          `${productData.name} (${productData.pack}) updated in catalog.`
        );
      } else {
        const added = await productService.add(productData);
        showSuccess(
          'Product Added',
          `${productData.name} (${productData.pack}) added to catalog.`
        );
      }
      await loadProducts();
    } catch (err) {
      showError('Save Failed', err.message);
    }
  };

  const handleOpenDelete = (product) => {
    setDeleteDialog({ isOpen: true, product });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.product?.id) return;
    try {
      const removed = await productService.delete(deleteDialog.product.id);
      showSuccess(
        'Product Deleted',
        `${deleteDialog.product.name} (${deleteDialog.product.pack}) was removed from the catalog.`
      );
      setDeleteDialog({ isOpen: false, product: null });
      await loadProducts();
    } catch (err) {
      showError('Delete Failed', err.message);
    }
  };

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.pack || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'active') return p.on === true;
    if (filterMode === 'inactive') return p.on === false;
    if (filterMode === 'low_stock') return (p.stock || 0) < 20;

    return true;
  });

  return (
    <div className="page-animate">
      {/* Header Info & Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '16px',
          margin: '-6px 0 20px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              color: 'var(--ink-soft)',
              maxWidth: '620px',
              fontSize: '13.5px',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            <b>{products.length} SKUs</b> across product lines. Stock toggle directly controls availability for Distributor, Broker, and Salesman ordering.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-outline"
            onClick={loadProducts}
            title="Refresh from Database"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenAdd}
          >
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '22px',
          flexWrap: 'wrap',
        }}
      >
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${products.length})` },
            { id: 'active', label: `Available (${products.filter((p) => p.on).length})` },
            { id: 'inactive', label: `Disabled (${products.filter((p) => !p.on).length})` },
            { id: 'low_stock', label: `Low Stock (${products.filter((p) => p.stock < 20).length})` },
          ].map((tab) => {
            const isSelected = filterMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 500,
                  border: isSelected ? '1.5px solid var(--wheat)' : '1px solid var(--line)',
                  background: isSelected ? 'var(--amber-bg)' : '#FFFFFF',
                  color: isSelected ? 'var(--navy)' : 'var(--ink-soft)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FFFFFF',
            border: '1px solid var(--line)',
            borderRadius: '9px',
            padding: '6px 12px',
            fontSize: '13px',
            width: '240px',
          }}
        >
          <Search className="w-4 h-4 text-ink-faint" />
          <input
            type="text"
            placeholder="Search products or pack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              width: '100%',
              fontSize: '12.5px',
              padding: 0,
            }}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-wheat mb-3" />
          <div>Loading catalog products from Supabase...</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: '#FFFFFF',
            border: '1px solid var(--line)',
            borderRadius: '12px',
          }}
        >
          <Package className="w-10 h-10 mx-auto text-ink-faint mb-3" />
          <h3 style={{ fontSize: '16px', color: 'var(--navy)', marginBottom: '6px' }}>
            No products found
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: '0 auto 16px', maxWidth: '380px' }}>
            {searchQuery
              ? `No products match your search "${searchQuery}".`
              : 'There are no products in this filter category.'}
          </p>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              setSearchQuery('');
              setFilterMode('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Products Grid */
        <div className="prodgrid">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onToggleStock={handleToggleStock}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <ProductModal
        isOpen={modalState.isOpen}
        product={modalState.product}
        onClose={() => setModalState({ isOpen: false, product: null })}
        onSave={handleSaveProduct}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, product: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        confirmText="Delete Product"
        confirmVariant="danger"
        message={
          deleteDialog.product ? (
            <>
              Delete{' '}
              <b style={{ color: 'var(--ink)' }}>
                {deleteDialog.product.name} ({deleteDialog.product.pack})
              </b>{' '}
              from the catalog? This will remove the SKU from ordering.
            </>
          ) : (
            ''
          )
        }
      />
    </div>
  );
};
