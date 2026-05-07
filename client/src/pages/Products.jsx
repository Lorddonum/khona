import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories, getProduct, recordProductView } from '../lib/api';
import { useCart } from '../context/CartContext';
import './Products.css';

export default function Products() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const lang = i18n.language;

  const searchParams = new URLSearchParams(location.search);
  const tagParam = searchParams.get('tag');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch categories once
  useEffect(() => {
    getCategories().then((r) => setCategories(r.data)).catch(console.error);
  }, []);

  // Fetch products on filter/page change
  useEffect(() => {
    if (id) return; // detail view handles its own data
    setLoading(true);
    
    const params = { category: selectedCat || undefined, search: search || undefined, page, limit: 12 };
    if (tagParam === 'new') params.isNew = true;
    if (tagParam === 'hot') params.isHotSelling = true;
    if (tagParam === 'promo') params.promotion = true;

    getProducts(params)
      .then((r) => {
        setProducts(r.data.products);
        setPages(r.data.pages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCat, search, page, id, tagParam]);

  // Detail view
  useEffect(() => {
    if (!id) { setDetail(null); return; }
    setDetailLoading(true);
    getProduct(id)
      .then((r) => {
        setDetail(r.data);
        // Record analytics view asynchronously
        fetch('https://ipapi.co/json/')
          .then(res => res.json())
          .then(loc => recordProductView(id, { country: loc.country_name, city: loc.city }))
          .catch(() => recordProductView(id, { country: 'Unknown', city: 'Unknown' }));
      })
      .catch(() => navigate('/products'))
      .finally(() => setDetailLoading(false));
  }, [id]);

  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedModel, setSelectedModel] = useState('');
  useEffect(() => { setActiveImg(0); setQty(1); setSelectedModel(''); }, [id]);

  if (id) {
    if (detailLoading) return <div className="page-loader"><div className="spinner" /></div>;
    if (!detail) return null;
    const name = detail.name?.[lang] || detail.name?.en;
    const desc = detail.description?.[lang] || detail.description?.en;
    
    const modelsToRender = detail.models?.length > 0 
      ? detail.models 
      : (detail.specifications?.length > 0 ? [{ name: 'Default', specifications: detail.specifications }] : []);
      
    const uniqueKeys = Array.from(new Set(
      modelsToRender.flatMap(m => m.specifications?.map(s => s.key) || [])
    )).filter(Boolean);
    
    // Auto-select first model if none selected and models exist
    const actualSelectedModel = selectedModel || (modelsToRender.length > 0 ? modelsToRender[0].name : '');

    return (
      <main className="product-detail" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
        <div className="product-detail__bg">
          <div className="product-detail__bg-shape1"></div>
          <div className="product-detail__bg-shape2"></div>
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <button className="btn btn-ghost back-btn" onClick={() => navigate('/products')} style={{ marginBottom: '2rem', background: 'var(--color-surface)', backdropFilter: 'blur(10px)' }}>
            ← {t('common.back')}
          </button>
          <div className="product-detail__inner fade-in">
            {/* Left Column */}
            <div className="product-detail__left" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <h1 className="product-detail__name" style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)', lineHeight: '1.1' }}>{name}</h1>
              
              <div className="product-detail__gallery glass" style={{ padding: '1rem', borderRadius: '16px' }}>
                <div className="product-detail__main-img" style={{ borderRadius: '12px' }}>
                  <img src={detail.images?.[activeImg] || '/placeholder.jpg'} alt={name} />
                </div>
                {detail.images?.length > 1 && (
                  <div className="product-detail__thumbs">
                    {detail.images.map((img, i) => (
                      <button
                        key={i}
                        className={`product-detail__thumb ${activeImg === i ? 'active' : ''}`}
                        onClick={() => setActiveImg(i)}
                        style={{ borderRadius: '8px' }}
                      >
                        <img src={img} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Specs Card */}
              {modelsToRender.length > 0 && uniqueKeys.length > 0 && (
                <div className="glass" style={{ padding: '2.5rem', borderRadius: '16px', overflowX: 'auto' }}>
                  <h3 style={{ fontSize: '2rem', marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>Specifications</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '1rem 0.5rem', color: 'var(--color-muted)', fontWeight: '500' }}>Model</th>
                        {uniqueKeys.map(key => (
                          <th key={key} style={{ padding: '1rem 0.5rem', color: 'var(--color-muted)', fontWeight: '500' }}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {modelsToRender.map((m, i) => (
                        <tr key={i} style={{ borderBottom: i === modelsToRender.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                          <td style={{ padding: '1.2rem 0.5rem', fontWeight: '500', color: 'var(--color-primary)' }}>{m.name}</td>
                          {uniqueKeys.map(key => {
                            const spec = m.specifications?.find(s => s.key === key);
                            return <td key={key} style={{ padding: '1.2rem 0.5rem' }}>{spec ? spec.value : '-'}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="product-detail__right" style={{ position: 'sticky', top: '120px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Badges & Stock */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div className="badge badge-gold" style={{ padding: '0.4rem 1rem', background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                    {detail.category?.name?.[lang] || 'CHANDELIER'}
                  </div>
                  {detail.promotion?.active && (
                    <div className="badge badge-gold" style={{ padding: '0.4rem 1rem', background: '#d4af37', color: '#000', border: 'none' }}>
                      -{detail.promotion.discountPercent}% OFF
                    </div>
                  )}
                </div>
                <div className={`badge ${detail.quantity > 0 ? 'badge-green' : 'badge-red'}`} style={{ padding: '0.4rem 1.5rem', fontSize: '0.8rem', background: detail.quantity > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: 'none' }}>
                  {detail.quantity > 0 ? t('products.in_stock') : t('products.out_of_stock')}
                </div>
              </div>

              {/* Description (Used as large heading per mockup) */}
              {desc && (
                <p className="product-detail__desc" style={{ fontSize: 'clamp(2rem, 3vw, 3.5rem)', lineHeight: '1.2', color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                  {desc}
                </p>
              )}

              {/* Price */}
              <p className="product-detail__price" style={{ fontSize: '2rem' }}>
                {detail.promotion?.active && (
                  <span style={{ textDecoration: 'line-through', color: 'var(--color-muted)', fontSize: '1.2rem', marginRight: '1rem' }}>
                    {detail.price?.toLocaleString()} MAD
                  </span>
                )}
                <span>
                  {detail.promotion?.active 
                    ? (detail.price * (1 - detail.promotion.discountPercent / 100)).toLocaleString() 
                    : detail.price?.toLocaleString()} MAD
                </span>
              </p>

              {/* Purchase Block */}
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.5rem' }}>
                
                {modelsToRender.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', width: '100px' }}>Select Model</span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
                      {modelsToRender.map(m => (
                        <button
                          key={m.name}
                          type="button"
                          className="btn"
                          onClick={() => setSelectedModel(m.name)}
                          style={{ 
                            padding: '0.5rem 1rem', 
                            fontSize: '0.8rem', 
                            borderRadius: '4px',
                            background: actualSelectedModel === m.name ? 'var(--color-primary)' : 'transparent',
                            color: actualSelectedModel === m.name ? 'var(--color-contrast)' : 'var(--color-text)',
                            border: `1px solid ${actualSelectedModel === m.name ? 'var(--color-primary)' : 'var(--color-border)'}`
                          }}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100px' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)' }}>Quantity</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ background: 'transparent', color: 'var(--color-text)', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>−</button>
                      <span style={{ fontSize: '1rem', fontWeight: '500', width: '20px', textAlign: 'center', color: 'var(--color-text)' }}>{qty}</span>
                      <button onClick={() => setQty(Math.min(detail.quantity, qty + 1))} style={{ background: 'transparent', color: 'var(--color-text)', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>+</button>
                    </div>
                  </div>

                  <button
                    className="btn"
                    onClick={() => addToCart(detail, qty, actualSelectedModel !== 'Default' ? actualSelectedModel : null)}
                    disabled={detail.quantity === 0}
                    style={{ 
                      flex: 1, 
                      padding: '1rem', 
                      fontSize: '0.9rem', 
                      fontWeight: '600',
                      borderRadius: '4px', 
                      justifyContent: 'center',
                      background: 'var(--color-primary)',
                      color: 'var(--color-contrast)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: 'none'
                    }}
                  >
                    {t('products.add_to_cart')}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="products-page" style={{ paddingTop: '100px' }}>
      <div className="container">
        <div className="products-page__header">
          <h1 className="section-title">
            {tagParam === 'new' ? 'New Arrivals' :
             tagParam === 'hot' ? 'Hot Selling' :
             tagParam === 'promo' ? 'Promotions' :
             t('products.title')}
          </h1>
          <p className="section-subtitle">{t('products.subtitle')}</p>
          {tagParam && (
            <button className="btn btn-ghost" onClick={() => navigate('/products')} style={{ marginTop: '1rem' }}>
              Clear Filter ✕
            </button>
          )}
        </div>

        <div className="products-page__layout">
          {/* Sidebar */}
          <aside className="products-sidebar" id="products-sidebar">
            <div className="products-sidebar__search">
              <input
                type="text"
                className="form-input"
                placeholder={t('products.search_placeholder')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                id="products-search"
              />
            </div>
            <div className="products-sidebar__cats">
              <button
                className={`sidebar-cat-btn ${!selectedCat ? 'active' : ''}`}
                onClick={() => { setSelectedCat(''); setPage(1); }}
                id="cat-all"
              >
                {t('products.all_categories')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  className={`sidebar-cat-btn ${selectedCat === cat._id ? 'active' : ''}`}
                  onClick={() => { setSelectedCat(cat._id); setPage(1); }}
                  id={`cat-${cat._id}`}
                >
                  {cat.name?.[lang] || cat.name?.en}
                </button>
              ))}
            </div>
          </aside>

          {/* Grid */}
          <div className="products-grid-area">
            {loading ? (
              <div className="page-loader"><div className="spinner" /></div>
            ) : products.length === 0 ? (
              <p className="products-empty">{t('products.no_products')}</p>
            ) : (
              <div className="grid-auto">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="products-pagination">
                {[...Array(pages)].map((_, i) => (
                  <button
                    key={i}
                    className={`page-btn ${page === i + 1 ? 'active' : ''}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
