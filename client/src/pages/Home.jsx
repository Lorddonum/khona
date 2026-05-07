import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import { getProducts, submitContact } from '../lib/api';
import './Home.css';

function MinimalProductCard({ product }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const name = product.name?.[lang] || product.name?.en || product.title || 'Unnamed';
  
  const isPromo = product.promotion?.active;
  const discount = product.promotion?.discountPercent || 0;
  const finalPrice = isPromo ? (product.price * (1 - discount / 100)) : product.price;

  return (
    <div className="product-card minimal-card">
      <Link to={`/products/${product._id}`} className="product-card__img-wrap" style={{ position: 'relative' }}>
        <img src={product.images?.[0] || '/placeholder.jpg'} alt={name} className="product-card__img" />
        {isPromo && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--color-gold)', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            -{discount}%
          </div>
        )}
      </Link>
      <div className="product-card__info" style={{ textAlign: 'center', padding: '1rem' }}>
        <Link to={`/products/${product._id}`}>
          <h3 className="product-card__name" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{name}</h3>
        </Link>
        <p className="product-card__price">
          {isPromo && (
            <span style={{ textDecoration: 'line-through', color: 'var(--color-muted)', fontSize: '0.9rem', marginRight: '0.5rem' }}>
              {product.price?.toLocaleString()} MAD
            </span>
          )}
          <span>{finalPrice.toLocaleString()} MAD</span>
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const [newProducts, setNewProducts] = useState([]);
  const [hotProducts, setHotProducts] = useState([]);
  const [promoProducts, setPromoProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [formStatus, setFormStatus] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const intervalRef = useRef(null);

  const slides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1920&auto=format&fit=crop',
      gradient: 'linear-gradient(135deg, rgba(28,26,25,0.7) 0%, rgba(51,48,46,0.6) 60%, rgba(28,26,25,0.8) 100%)',
      accent: 'rgba(232, 226, 213, 0.08)',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1768848419619-bc78bdf1b212?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTV8fGx1eHVyeSUyMGxpZ2h0aW5nJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzc3Mjg5MTE0fDA&ixlib=rb-4.1.0&q=80&w=1920&auto=format&fit=crop',
      gradient: 'linear-gradient(135deg, rgba(38,36,35,0.7) 0%, rgba(28,26,25,0.6) 60%, rgba(51,48,46,0.8) 100%)',
      accent: 'rgba(232, 226, 213, 0.05)',
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1766802033683-77fc32c2b6a5?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTZ8fGx1eHVyeSUyMGxpZ2h0aW5nJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzc3Mjg5MTE0fDA&ixlib=rb-4.1.0&q=80&w=1920&auto=format&fit=crop',
      gradient: 'linear-gradient(135deg, rgba(28,26,25,0.7) 0%, rgba(38,36,35,0.6) 60%, rgba(51,48,46,0.8) 100%)',
      accent: 'rgba(232, 226, 213, 0.06)',
    },
  ];

  // Auto-advance slides
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    Promise.all([
      getProducts({ isNew: true, limit: 4 }),
      getProducts({ isHotSelling: true, limit: 4 }),
      getProducts({ promotion: true, limit: 4 })
    ])
      .then(([newRes, hotRes, promoRes]) => {
        setNewProducts(newRes.data.products);
        setHotProducts(hotRes.data.products);
        setPromoProducts(promoRes.data.products);
      })
      .catch(() => {
        setNewProducts([]);
        setHotProducts([]);
        setPromoProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFormChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitContact(form);
      setFormStatus('success');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      setFormStatus('error');
    }
  };

  return (
    <main className="home">
      {/* Hero Slider — pure CSS, no dependency */}
      <section className="hero" id="hero-section">
        <div
          className="hero__bg"
          style={{
            backgroundImage: `${slides[slideIndex].gradient}, url(${slides[slideIndex].image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'background 1.2s ease',
          }}
        />

        {/* Ambient glow */}
        <div className="hero__glow" />

        {/* Particles */}
        <div className="hero__particles" aria-hidden="true">
          {[...Array(10)].map((_, j) => (
            <div
              key={j}
              className="hero__particle"
              style={{ '--delay': `${j * 0.6}s`, '--x': `${8 + j * 9}%` }}
            />
          ))}
        </div>

        <div className="container hero__content">
          <div className="badge badge-gold hero__label">KHONA Lighting</div>
          <h1 className="hero__title">{t('home.hero_title')}</h1>
          <p className="hero__subtitle">{t('home.hero_subtitle')}</p>
          <div className="hero__actions">
            <Link to="/products" className="btn btn-primary" id="hero-cta">
              {t('home.hero_cta')}
            </Link>
            <Link to="/contact" className="btn btn-outline">
              {t('nav.contact')}
            </Link>
          </div>
        </div>

        {/* Slide dots */}
        <div className="hero__dots">
          {slides.map((s, i) => (
            <button
              key={s.id}
              className={`hero__dot ${slideIndex === i ? 'active' : ''}`}
              onClick={() => { setSlideIndex(i); clearInterval(intervalRef.current); }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Inspiration Gallery */}
      <section className="section home-gallery" id="gallery-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">{t('home.inspiration_subtitle') || 'Inspiration'}</span>
            <h2 className="section-title">{t('home.inspiration_title') || 'Design Gallery'}</h2>
            <div className="divider" />
          </div>
          <div className="gallery-grid">
            <div className="gallery-item glass">
              <img src="https://images.unsplash.com/photo-1769018508631-fe4ebf3fba3a?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTh8fGx1eHVyeSUyMGxpZ2h0aW5nJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzc3Mjg5MTE0fDA&ixlib=rb-4.1.0&q=80&w=800&auto=format&fit=crop" alt="Interior lighting" />
            </div>
            <div className="gallery-item glass">
              <img src="https://images.unsplash.com/photo-1759430711569-f2e52dc26548?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTl8fGx1eHVyeSUyMGxpZ2h0aW5nJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzc3Mjg5MTE0fDA&ixlib=rb-4.1.0&q=80&w=800&auto=format&fit=crop" alt="Pendant lights" />
            </div>
            <div className="gallery-item glass">
              <img src="https://images.unsplash.com/photo-1768051297578-1ea70392c307?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MjB8fGx1eHVyeSUyMGxpZ2h0aW5nJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzc3Mjg5MTE0fDA&ixlib=rb-4.1.0&q=80&w=800&auto=format&fit=crop" alt="Living room lighting" />
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="section home-products" id="featured-section">
        <div className="container">
          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : (
            <>
              {/* New Products */}
              {newProducts.length > 0 && (
                <div className="home-product-row">
                  <div className="section-header" style={{ marginBottom: '2rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>New Arrivals</h2>
                    <Link to="/products?tag=new" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>View all New →</Link>
                  </div>
                  <div className="grid-auto">
                    {newProducts.map((p) => <MinimalProductCard key={p._id} product={p} />)}
                  </div>
                </div>
              )}

              {/* Hot Selling */}
              {hotProducts.length > 0 && (
                <div className="home-product-row" style={{ marginTop: '4rem' }}>
                  <div className="section-header" style={{ marginBottom: '2rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>Hot Selling</h2>
                    <Link to="/products?tag=hot" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>View all Hot →</Link>
                  </div>
                  <div className="grid-auto">
                    {hotProducts.map((p) => <MinimalProductCard key={p._id} product={p} />)}
                  </div>
                </div>
              )}

              {/* Promotions */}
              {promoProducts.length > 0 && (
                <div className="home-product-row" style={{ marginTop: '4rem' }}>
                  <div className="section-header" style={{ marginBottom: '2rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>Promotions</h2>
                    <Link to="/products?tag=promo" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>View all Promos →</Link>
                  </div>
                  <div className="grid-auto">
                    {promoProducts.map((p) => <MinimalProductCard key={p._id} product={p} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Contact section */}
      <section className="section home-contact" id="home-contact-section">
        <div className="container">
          <div className="home-contact__inner glass">
            <div className="home-contact__info">
              <span className="section-subtitle">{t('home.contact_subtitle')}</span>
              <h2 className="section-title">{t('home.contact_title')}</h2>
              <div className="divider" />
              <div className="home-contact__details">
                <div className="home-contact__detail">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.2 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.9v2z"/>
                  </svg>
                  <span>+213 XX XXX XXXX</span>
                </div>
                <div className="home-contact__detail">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span>contact@khona.com</span>
                </div>
              </div>
            </div>

            <form className="home-contact__form" onSubmit={handleFormSubmit} id="home-contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('contact.name')}</label>
                  <input className="form-input" type="text" name="name" value={form.name} onChange={handleFormChange} required id="contact-name" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('contact.email')}</label>
                  <input className="form-input" type="email" name="email" value={form.email} onChange={handleFormChange} required id="contact-email" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('contact.phone')}</label>
                <input className="form-input" type="tel" name="phone" value={form.phone} onChange={handleFormChange} id="contact-phone" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('contact.message')}</label>
                <textarea className="form-textarea" name="message" value={form.message} onChange={handleFormChange} required id="contact-message" />
              </div>
              {formStatus === 'success' && <p className="form-success">{t('contact.success')}</p>}
              {formStatus === 'error' && <p className="form-error">{t('contact.error')}</p>}
              <button type="submit" className="btn btn-primary" id="contact-submit">
                {t('contact.send')}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
