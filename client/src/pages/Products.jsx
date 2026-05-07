import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories, getProduct } from '../lib/api';
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
      .then((r) => setDetail(r.data))
      .catch(() => navigate('/products'))
      .finally(() => setDetailLoading(false));
  }, [id]);

  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  useEffect(() => { setActiveImg(0); setQty(1); }, [id]);

  if (id) {
    if (detailLoading) return <div className="page-loader"><div className="spinner" /></div>;
    if (!detail) return null;
    const name = detail.name?.[lang] || detail.name?.en;
    const desc = detail.description?.[lang] || detail.description?.en;
    return (
      <main className="product-detail" style={{ paddingTop: '100px' }}>
        <div className="container">
          <button className="btn btn-ghost back-btn" onClick={() => navigate('/products')}>
            ← {t('common.back')}
          </button>
          <div className="product-detail__inner">
            {/* Images */}
            <div className="product-detail__gallery">
              <div className="product-detail__main-img">
                <img src={detail.images?.[activeImg] || '/placeholder.jpg'} alt={name} />
              </div>
              {detail.images?.length > 1 && (
                <div className="product-detail__thumbs">
                  {detail.images.map((img, i) => (
                    <button
                      key={i}
                      className={`product-detail__thumb ${activeImg === i ? 'active' : ''}`}
                      onClick={() => setActiveImg(i)}
                    >
                      <img src={img} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="product-detail__info">
              <div className="badge badge-gold">{detail.category?.name?.[lang]}</div>
              <h1 className="product-detail__name">{name}</h1>
              <p className="product-detail__price">{detail.price?.toLocaleString()} MAD</p>
              <div className="divider" />
              {desc && <p className="product-detail__desc">{desc}</p>}

              <div className="product-detail__stock">
                <span className={`badge ${detail.quantity > 0 ? 'badge-green' : 'badge-red'}`}>
                  {detail.quantity > 0 ? t('products.in_stock') : t('products.out_of_stock')}
                </span>
              </div>

              <div className="product-detail__qty">
                <label className="form-label">{t('products.quantity')}</label>
                <div className="qty-control">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="qty-btn">−</button>
                  <span className="qty-val">{qty}</span>
                  <button onClick={() => setQty(Math.min(detail.quantity, qty + 1))} className="qty-btn">+</button>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => addToCart(detail, qty)}
                disabled={detail.quantity === 0}
                id="detail-add-cart"
              >
                {t('products.add_to_cart')}
              </button>
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
