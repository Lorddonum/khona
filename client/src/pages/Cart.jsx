import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { initiateCmiPayment } from '../lib/api';
import './Cart.css';

export default function Cart() {
  const { t, i18n } = useTranslation();
  const { cartItems, removeFromCart, updateQty, totalPrice, clearCart } = useCart();
  const lang = i18n.language;

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customer, setCustomer] = useState({ name: '', email: '' });
  const [paying, setPaying] = useState(false);

  const handleCheckout = () => setShowCustomerForm(true);

  const submitPayment = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      const items = cartItems.map((i) => ({
        _id: i._id,
        name: i.name?.[lang] || i.name?.en,
        price: i.price,
        quantity: i.qty,
        image: i.images?.[0] || '',
      }));

      // Backend returns an HTML auto-submit form for CMI redirect
      const res = await initiateCmiPayment({ items, customer });
      
      // Inject the HTML into the page — it auto-submits to CMI
      const div = document.createElement('div');
      div.innerHTML = res.data;
      document.body.appendChild(div);
      // The body onload triggers the form submit automatically
    } catch (err) {
      alert('Erreur de paiement: ' + (err.response?.data?.message || err.message));
      setPaying(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main style={{ paddingTop: '120px', minHeight: '60vh' }}>
        <div className="container cart-empty">
          <div className="cart-empty__icon">🛒</div>
          <h2>{t('cart.empty')}</h2>
          <Link to="/products" className="btn btn-primary">{t('cart.continue_shopping')}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page" style={{ paddingTop: '100px' }}>
      <div className="container">
        <h1 className="section-title">{t('cart.title')}</h1>
        <div className="cart-page__layout">
          <div className="cart-items">
            {cartItems.map((item) => {
              const name = item.name?.[lang] || item.name?.en;
              return (
                <div key={item._id} className="cart-item glass" id={`cart-item-${item._id}`}>
                  <div className="cart-item__img">
                    <img src={item.images?.[0] || '/placeholder.jpg'} alt={name} />
                  </div>
                  <div className="cart-item__info">
                    <h3 className="cart-item__name">{name}</h3>
                    <p className="cart-item__price">{item.price?.toLocaleString()} DA</p>
                  </div>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => updateQty(item._id, item.qty - 1)}>−</button>
                    <span className="qty-val">{item.qty}</span>
                    <button className="qty-btn" onClick={() => updateQty(item._id, item.qty + 1)}>+</button>
                  </div>
                  <p className="cart-item__subtotal">{(item.price * item.qty).toLocaleString()} DA</p>
                  <button className="btn btn-danger cart-item__remove" onClick={() => removeFromCart(item._id)}>
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <div className="cart-summary glass">
            <h3 className="cart-summary__title">{t('cart.subtotal')}</h3>
            <div className="divider" />
            <p className="cart-summary__total">{totalPrice.toLocaleString()} DA</p>
            <button className="btn btn-primary" onClick={handleCheckout} id="checkout-btn" disabled={paying}>
              {paying ? 'Redirection...' : t('cart.checkout')}
            </button>
            <Link to="/products" className="btn btn-ghost">{t('cart.continue_shopping')}</Link>
          </div>
        </div>
      </div>

      {/* CMI Customer Info Modal */}
      {showCustomerForm && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCustomerForm(false)}>
          <div className="admin-modal" style={{ maxWidth: 420 }}>
            <div className="admin-modal__header">
              <h3>Informations de paiement</h3>
              <button className="admin-modal__close" onClick={() => setShowCustomerForm(false)}>×</button>
            </div>
            <form onSubmit={submitPayment} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Nom complet</label>
                <input
                  className="form-input"
                  placeholder="Votre nom"
                  value={customer.name}
                  onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="votre@email.com"
                  value={customer.email}
                  onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                  required
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', textAlign: 'center' }}>
                Vous serez redirigé vers la page sécurisée CMI pour finaliser votre paiement.
              </p>
              <button type="submit" className="btn btn-primary" disabled={paying}>
                {paying ? 'Redirection vers CMI...' : `Payer ${totalPrice.toLocaleString()} DA`}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
