import { useState, useEffect } from 'react';
import { useNavigate, NavLink, Outlet, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getProducts, deleteProduct, getCategories, deleteCategory, getOrders, updateOrderStatus, getContacts, markContactRead, deleteContact } from '../lib/api';
import './AdminDashboard.css';

/* ===== Sidebar ===== */
function AdminSidebar({ onLogout }) {
  const links = [
    { to: '/khona-admin-secure/dashboard/products', label: 'Products', icon: '◈' },
    { to: '/khona-admin-secure/dashboard/categories', label: 'Categories', icon: '◉' },
    { to: '/khona-admin-secure/dashboard/orders', label: 'Orders', icon: '◎' },
    { to: '/khona-admin-secure/dashboard/messages', label: 'Messages', icon: '◇' },
    { to: '/khona-admin-secure/dashboard/accounts', label: 'Accounts', icon: '👤' },
    { to: '/khona-admin-secure/dashboard/analytics', label: 'Analytics', icon: '📊' },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <img src="/khona.png" alt="Khona" className="admin-sidebar__logo" />
        <span>KHONA</span>
      </div>
      <nav className="admin-sidebar__nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
            id={`admin-nav-${l.to}`}
          >
            <span className="admin-nav-link__icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <button className="btn btn-ghost admin-sidebar__logout" onClick={onLogout} id="admin-logout">
        Sign Out
      </button>
    </aside>
  );
}

/* ===== Add / Edit Product Modal ===== */
function ProductFormModal({ categories, onClose, onSaved, initialData = null }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    nameEn: initialData?.name?.en || '', nameFr: initialData?.name?.fr || '', nameAr: initialData?.name?.ar || '',
    descEn: initialData?.description?.en || '', descFr: initialData?.description?.fr || '', descAr: initialData?.description?.ar || '',
    price: initialData?.price || '', quantity: initialData?.quantity || '',
    category: initialData?.category?._id || initialData?.category || categories[0]?._id || '',
    isNewProduct: initialData?.isNewProduct || false, isHotSelling: initialData?.isHotSelling || false,
    promoActive: initialData?.promotion?.active || false, promoDiscount: initialData?.promotion?.discountPercent || '',
  });
  const [models, setModels] = useState(
    initialData?.models?.length > 0 
      ? initialData.models 
      : [{ name: 'Default', specifications: initialData?.specifications || [] }]
  );
  const [activeModel, setActiveModel] = useState(0);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState(initialData?.images || []);
  const [existingImages, setExistingImages] = useState(initialData?.images || []);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const addModel = () => {
    setModels((m) => [...m, { name: `Variant ${m.length + 1}`, specifications: [] }]);
    setActiveModel(models.length);
  };
  const removeModel = (i) => {
    setModels((m) => m.filter((_, idx) => idx !== i));
    setActiveModel(0);
  };
  const updateModelName = (i, name) => setModels((m) => m.map((mod, idx) => idx === i ? { ...mod, name } : mod));
  
  const addSpec = (mi) => setModels((m) => m.map((mod, idx) => idx === mi ? { ...mod, specifications: [...mod.specifications, { key: '', value: '' }] } : mod));
  const removeSpec = (mi, si) => setModels((m) => m.map((mod, idx) => idx === mi ? { ...mod, specifications: mod.specifications.filter((_, sidx) => sidx !== si) } : mod));
  const updateSpec = (mi, si, field, val) => {
    setModels((m) => m.map((mod, idx) => {
      if (idx !== mi) return mod;
      return {
        ...mod,
        specifications: mod.specifications.map((sp, sidx) => sidx === si ? { ...sp, [field]: val } : sp)
      };
    }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((p) => [...p, ev.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i) => {
    // If it's an existing image, we remove it from existingImages
    if (i < existingImages.length) {
      setExistingImages((prev) => prev.filter((_, idx) => idx !== i));
    } else {
      // If it's a new image, we remove it from the `images` array (adjusting the index)
      const newImageIndex = i - existingImages.length;
      setImages((prev) => prev.filter((_, idx) => idx !== newImageIndex));
    }
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nameEn || !form.nameFr || !form.nameAr) return setError('All name fields required');
    if (!form.price || !form.category) return setError('Price and category required');

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', JSON.stringify({ en: form.nameEn, fr: form.nameFr, ar: form.nameAr }));
      fd.append('description', JSON.stringify({ en: form.descEn, fr: form.descFr, ar: form.descAr }));
      
      const cleanedModels = models.map(m => ({
        name: m.name,
        specifications: m.specifications.filter(s => s.key && s.value)
      })).filter(m => m.name.trim() !== '');
      fd.append('models', JSON.stringify(cleanedModels));
      
      if (cleanedModels.length > 0) {
        fd.append('specifications', JSON.stringify(cleanedModels[0].specifications));
      } else {
        fd.append('specifications', JSON.stringify([]));
      }
      fd.append('price', form.price);
      fd.append('quantity', form.quantity || '0');
      fd.append('category', form.category);
      if (!initialData) {
        fd.append('slug', form.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now());
      }
      fd.append('featured', 'false');
      fd.append('isNewProduct', String(form.isNewProduct));
      fd.append('isHotSelling', String(form.isHotSelling));
      fd.append('promotion', JSON.stringify({ active: form.promoActive, discountPercent: Number(form.promoDiscount) || 0 }));
      
      // Append new files
      images.forEach((img) => fd.append('images', img));

      let res;
      if (initialData) {
        // Only append existing image URLs if we are updating, and no new files are uploaded, 
        // wait, the backend replaces all images if `req.files.length > 0`. If we want to support mixing, it requires backend changes.
        // For now, if editing and user added new images, it overwrites old ones. If they didn't add new images, old ones remain.
        res = await axios.put(`/api/products/${initialData._id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
      } else {
        res = await axios.post('/api/products', fd, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
      }
      
      onSaved(res.data, !!initialData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal__header">
          <h3>{initialData ? 'Edit Product' : 'Add New Product'}</h3>
          <button className="admin-modal__close" onClick={onClose}>×</button>
        </div>

        <form className="product-form" onSubmit={handleSubmit}>
          {/* Names */}
          <p className="product-form__section-title">Product Name</p>
          <div className="product-form__row-3">
            <div className="form-group">
              <label className="form-label">English</label>
              <input className="form-input" name="nameEn" value={form.nameEn} onChange={handleChange} placeholder="Product name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Français</label>
              <input className="form-input" name="nameFr" value={form.nameFr} onChange={handleChange} placeholder="Nom du produit" required />
            </div>
            <div className="form-group">
              <label className="form-label">العربية</label>
              <input className="form-input" name="nameAr" value={form.nameAr} onChange={handleChange} placeholder="اسم المنتج" dir="rtl" required />
            </div>
          </div>

          {/* Descriptions */}
          <p className="product-form__section-title">Description</p>
          <div className="form-group">
            <label className="form-label">English</label>
            <textarea className="form-textarea" name="descEn" value={form.descEn} onChange={handleChange} placeholder="Product description..." rows="3" />
          </div>
          <div className="product-form__row">
            <div className="form-group">
              <label className="form-label">Français</label>
              <textarea className="form-textarea" name="descFr" value={form.descFr} onChange={handleChange} placeholder="Description du produit..." rows="3" />
            </div>
            <div className="form-group">
              <label className="form-label">العربية</label>
              <textarea className="form-textarea" name="descAr" value={form.descAr} onChange={handleChange} placeholder="وصف المنتج..." dir="rtl" rows="3" />
            </div>
          </div>

          {/* Price / Stock / Category */}
          <p className="product-form__section-title">Details</p>
          <div className="product-form__row-3">
            <div className="form-group">
              <label className="form-label">Price (MAD)</label>
              <input className="form-input" type="number" name="price" value={form.price} onChange={handleChange} placeholder="0.00" min="0" step="0.01" required />
            </div>
            <div className="form-group">
              <label className="form-label">Stock</label>
              <input className="form-input" type="number" name="quantity" value={form.quantity} onChange={handleChange} placeholder="0" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name?.fr || c.name?.en}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <p className="product-form__section-title">Tags</p>
          <div className="product-form__checks">
            <label className="product-form__check">
              <input type="checkbox" name="isNewProduct" checked={form.isNewProduct} onChange={handleChange} />
              New Product
            </label>
            <label className="product-form__check">
              <input type="checkbox" name="isHotSelling" checked={form.isHotSelling} onChange={handleChange} />
              Hot Selling
            </label>
            <label className="product-form__check">
              <input type="checkbox" name="promoActive" checked={form.promoActive} onChange={handleChange} />
              Promotion
            </label>
            {form.promoActive && (
              <div className="form-group" style={{ minWidth: 120 }}>
                <input className="form-input" type="number" name="promoDiscount" value={form.promoDiscount} onChange={handleChange} placeholder="Discount %" min="1" max="99" />
              </div>
            )}
          </div>

          {/* Models & Specifications */}
          <p className="product-form__section-title">Models & Specifications</p>
          <div className="models-tabs">
            <div className="models-tabs__header" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {models.map((m, i) => (
                <button 
                  type="button" 
                  key={i} 
                  className={`btn ${activeModel === i ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                  onClick={() => setActiveModel(i)}
                >
                  {m.name || `Model ${i+1}`}
                </button>
              ))}
              <button type="button" className="btn btn-ghost" onClick={addModel} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>+ Add Model</button>
            </div>

            {models.length > 0 && activeModel < models.length && (
              <div className="model-content" style={{ background: 'var(--color-glass)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                  <label className="form-label" style={{ margin: 0 }}>Model Name:</label>
                  <input 
                    className="form-input" 
                    value={models[activeModel].name} 
                    onChange={(e) => updateModelName(activeModel, e.target.value)} 
                    style={{ flex: 1 }} 
                    placeholder="e.g. 60cm Version"
                  />
                  {models.length > 1 && (
                    <button type="button" className="btn btn-danger" onClick={() => removeModel(activeModel)}>Delete Model</button>
                  )}
                </div>

                <div className="spec-rows">
                  {models[activeModel].specifications.map((s, i) => (
                    <div className="spec-row" key={i}>
                      <input className="form-input" placeholder="Name (e.g. Wattage)" value={s.key} onChange={(e) => updateSpec(activeModel, i, 'key', e.target.value)} />
                      <input className="form-input" placeholder="Value (e.g. 60W)" value={s.value} onChange={(e) => updateSpec(activeModel, i, 'value', e.target.value)} />
                      <button type="button" className="spec-row__remove" onClick={() => removeSpec(activeModel, i)}>×</button>
                    </div>
                  ))}
                  <button type="button" className="spec-add-btn" onClick={() => addSpec(activeModel)}>+ Add specification</button>
                </div>
              </div>
            )}
          </div>

          {/* Images */}
          <p className="product-form__section-title">Images</p>
          <div className="product-form__dropzone" onClick={() => document.getElementById('product-images-input').click()}>
            <input id="product-images-input" type="file" accept="image/*" multiple onChange={handleImages} />
            📷 Click to upload images (max 10)
          </div>
          {previews.length > 0 && (
            <div className="product-form__previews">
              {previews.map((src, i) => (
                <div className="product-form__preview" key={i}>
                  <img src={src} alt="" />
                  <button type="button" className="product-form__preview-remove" onClick={() => removeImage(i)}>×</button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="product-form__error">{error}</p>}

          <div className="product-form__actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===== Products panel ===== */
function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [tagFilter, setTagFilter] = useState(''); // 'new' | 'hot' | 'promo' | ''
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (search) params.search = search;
      if (catFilter) params.category = catFilter;
      if (tagFilter === 'new') params.isNew = 'true';
      if (tagFilter === 'hot') params.isHotSelling = 'true';
      if (tagFilter === 'promo') params.promotion = 'true';
      const res = await getProducts(params);
      setProducts(res.data.products);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, catFilter, tagFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts((p) => p.filter((x) => x._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleProductSaved = (product, isEdit) => {
    if (isEdit) {
      setProducts((p) => p.map((x) => x._id === product._id ? product : x));
    } else {
      setProducts((p) => [product, ...p]);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2>Products</h2>
        <span className="badge badge-gold">{products.length} items</span>
        <button className="btn btn-primary" onClick={() => setShowForm(true)} id="add-product-btn" style={{ marginLeft: 'auto' }}>
          + Add Product
        </button>
      </div>

      {/* Toolbar: Search + Filters */}
      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <span className="admin-toolbar__search-icon">🔍</span>
          <input
            className="form-input"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="product-search"
          />
        </div>
        <div className="admin-toolbar__filters">
          <button className={`admin-filter-btn ${catFilter === '' ? 'active' : ''}`} onClick={() => setCatFilter('')}>All</button>
          {categories.map((c) => (
            <button key={c._id} className={`admin-filter-btn ${catFilter === c._id ? 'active' : ''}`} onClick={() => setCatFilter(c._id)}>
              {c.name?.fr || c.name?.en}
            </button>
          ))}
        </div>
        <div className="admin-toolbar__filters">
          <button className={`admin-filter-btn ${tagFilter === '' ? 'active' : ''}`} onClick={() => setTagFilter('')}>All Tags</button>
          <button className={`admin-filter-btn ${tagFilter === 'new' ? 'active' : ''}`} onClick={() => setTagFilter(tagFilter === 'new' ? '' : 'new')}>New</button>
          <button className={`admin-filter-btn ${tagFilter === 'hot' ? 'active' : ''}`} onClick={() => setTagFilter(tagFilter === 'hot' ? '' : 'hot')}>Hot</button>
          <button className={`admin-filter-btn ${tagFilter === 'promo' ? 'active' : ''}`} onClick={() => setTagFilter(tagFilter === 'promo' ? '' : 'promo')}>Promo</button>
        </div>
      </div>

      {/* Product table */}
      {loading ? <div className="page-loader"><div className="spinner" /></div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Tags</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>No products found</td></tr>
              )}
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="admin-table__img">
                      <img src={p.images?.[0] || '/placeholder.jpg'} alt="" />
                    </div>
                  </td>
                  <td>{p.name?.en || p.name?.fr}</td>
                  <td>{p.category?.name?.fr || p.category?.name?.en || '—'}</td>
                  <td className="admin-table__price">{Number(p.price).toLocaleString()} MAD</td>
                  <td>
                    <span className={`badge ${p.quantity > 0 ? 'badge-green' : 'badge-red'}`}>
                      {p.quantity}
                    </span>
                  </td>
                  <td>
                    <div className="admin-product-tags">
                      {p.isNewProduct && <span className="admin-product-tag admin-product-tag--new">New</span>}
                      {p.isHotSelling && <span className="admin-product-tag admin-product-tag--hot">Hot</span>}
                      {p.promotion?.active && <span className="admin-product-tag admin-product-tag--promo">-{p.promotion.discountPercent}%</span>}
                    </div>
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <button className="btn btn-ghost" onClick={() => openEditModal(p)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Edit</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(p._id)} id={`del-product-${p._id}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit product modal */}
      {showForm && (
        <ProductFormModal
          categories={categories}
          initialData={editingProduct}
          onClose={closeForm}
          onSaved={handleProductSaved}
        />
      )}
    </div>
  );
}

/* ===== Categories panel ===== */
function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete category?')) return;
    await deleteCategory(id);
    setCategories((c) => c.filter((x) => x._id !== id));
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2>Categories</h2>
        <span className="badge badge-gold">{categories.length} items</span>
      </div>
      {loading ? <div className="page-loader"><div className="spinner" /></div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Name (EN)</th><th>Name (FR)</th><th>Name (AR)</th><th>Actions</th></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id}>
                  <td>{c.name?.en}</td>
                  <td>{c.name?.fr}</td>
                  <td dir="rtl">{c.name?.ar}</td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleDelete(c._id)} id={`del-cat-${c._id}`}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ===== Orders panel ===== */
function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders({ limit: 50 }).then((r) => setOrders(r.data.orders)).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id, status) => {
    await updateOrderStatus(id, { status });
    setOrders((o) => o.map((x) => x._id === id ? { ...x, status } : x));
  };

  const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2>Orders</h2>
        <span className="badge badge-gold">{orders.length} orders</span>
      </div>
      {loading ? <div className="page-loader"><div className="spinner" /></div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Customer</th><th>Location</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>
                    {o.customer?.name}
                    {o.isTestOrder && <span className="badge badge-gold" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>Test</span>}
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{o.customer?.email}</div>
                  </td>
                  <td>
                    {o.customer?.city && o.customer?.country ? `${o.customer.city}, ${o.customer.country}` : 'Unknown'}
                  </td>
                  <td className="admin-table__price">{o.totalAmount?.toLocaleString()} MAD</td>
                  <td>
                    <select
                      className="admin-status-select"
                      value={o.status}
                      onChange={(e) => handleStatusChange(o._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${o.paymentStatus === 'paid' ? 'badge-green' : 'badge-red'}`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ===== Messages panel ===== */
function AdminMessages() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContacts({ limit: 50 }).then((r) => setContacts(r.data.contacts)).finally(() => setLoading(false));
  }, []);

  const handleRead = async (id) => {
    await markContactRead(id);
    setContacts((c) => c.map((x) => x._id === id ? { ...x, read: true } : x));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete message?')) return;
    await deleteContact(id);
    setContacts((c) => c.filter((x) => x._id !== id));
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2>Messages</h2>
        <span className="badge badge-gold">{contacts.filter((c) => !c.read).length} unread</span>
      </div>
      {loading ? <div className="page-loader"><div className="spinner" /></div> : (
        <div className="admin-messages">
          {contacts.map((c) => (
            <div key={c._id} className={`admin-message glass ${c.read ? 'read' : 'unread'}`} id={`msg-${c._id}`}>
              <div className="admin-message__header">
                <div>
                  <strong>{c.name}</strong>
                  <span className="admin-message__email">{c.email}</span>
                  {c.phone && <span className="admin-message__email">{c.phone}</span>}
                </div>
                <div className="admin-message__meta">
                  <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  {!c.read && <span className="badge badge-gold">New</span>}
                </div>
              </div>
              <p className="admin-message__body">{c.message}</p>
              <div className="admin-message__actions">
                {!c.read && (
                  <button className="btn btn-ghost" onClick={() => handleRead(c._id)}>Mark Read</button>
                )}
                <button className="btn btn-danger" onClick={() => handleDelete(c._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== Accounts panel ===== */
function AdminAccounts() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../lib/api').then(({ getUsers }) => {
      getUsers().then((r) => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false));
    });
  }, []);

  const handleRoleChange = async (id, role) => {
    try {
      const { updateUserRole } = await import('../lib/api');
      await updateUserRole(id, { role });
      setUsers((u) => u.map((x) => x._id === id ? { ...x, role } : x));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const { deleteUser } = await import('../lib/api');
      await deleteUser(id);
      setUsers((u) => u.filter((x) => x._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2>Accounts</h2>
        <span className="badge badge-gold">{users.length} users</span>
      </div>
      {loading ? <div className="page-loader"><div className="spinner" /></div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Registered</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    {u.role === 'superadmin' ? (
                      <span className="badge badge-gold">Super Admin</span>
                    ) : (
                      <select
                        className="admin-status-select"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        disabled={user?.role !== 'superadmin' && user?.role !== 'admin'}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    {u.role !== 'superadmin' && (
                      <button className="btn btn-danger" onClick={() => handleDelete(u._id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ===== Analytics panel ===== */
function AdminAnalytics() {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../lib/api').then(({ getTopProducts }) => {
      getTopProducts().then((r) => setTopProducts(r.data)).catch(() => {}).finally(() => setLoading(false));
    });
  }, []);

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2>Analytics (Most Viewed Products)</h2>
      </div>
      {loading ? <div className="page-loader"><div className="spinner" /></div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Product</th><th>Total Views</th><th>Breakdown by Location</th></tr></thead>
            <tbody>
              {topProducts.length === 0 && (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>No view data available yet.</td></tr>
              )}
              {topProducts.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img src={p.productDetails?.images?.[0] || '/placeholder.jpg'} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                      <span>{p.productDetails?.name?.en || p.productDetails?.name?.fr}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-gold" style={{ fontSize: '1rem' }}>{p.totalViews}</span></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {p.locations.map((loc, i) => (
                        <div key={i} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-glass)', paddingBottom: '0.2rem' }}>
                          <span>{loc.city}, {loc.country}</span>
                          <strong>{loc.views} views</strong>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ===== Main Dashboard ===== */
export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/khona-admin-secure');
  };

  return (
    <div className="admin-layout">
      <AdminSidebar onLogout={handleLogout} />
      <main className="admin-main">
        <Routes>
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="*" element={<AdminProducts />} />
        </Routes>
      </main>
    </div>
  );
}
