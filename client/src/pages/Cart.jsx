import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createCheckoutSession } from '../lib/api';
import UserAuthModal from '../components/UserAuthModal';
import './Cart.css';

export default function Cart() {
  const { t, i18n } = useTranslation();
  const { cartItems, removeFromCart, updateQty, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const lang = i18n.language;
  const [showAuth, setShowAuth] = useState(false);

  const handleCheckout = async () => {
    // Gate: must be logged in
    if (!user) {
      setShowAuth(true);
      return;
    }
    try {
      const items = cartItems.map((i) => ({
        product: i._id,
        name: i.name?.[lang] || i.name?.en,
        price: i.price,
        quantity: i.qty,
        image: i.images?.[0] || '',
      }));
      let city = 'Unknown';
      let country = 'Unknown';
      try {
        const locRes = await fetch('https://ipapi.co/json/');
        const locData = await locRes.json();
        if (locData.city) city = locData.city;
        if (locData.country_name) country = locData.country_name;
      } catch (err) {
        console.warn('Could not fetch location:', err);
      }

      const customer = { 
        name: user.username || user.name, 
        email: user.email,
        city,
        country
      };
      
      const res = await createCheckoutSession({ items, customer });
      window.location.href = res.data.url;
    } catch (err) {
      alert('Checkout error: ' + (err.response?.data?.message || err.message));
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
    <>
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
                      <p className="cart-item__price">{item.price?.toLocaleString()} MAD</p>
                    </div>
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => updateQty(item._id, item.qty - 1)}>−</button>
                      <span className="qty-val">{item.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item._id, item.qty + 1)}>+</button>
                    </div>
                    <p className="cart-item__subtotal">{(item.price * item.qty).toLocaleString()} MAD</p>
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
              <p className="cart-summary__total">{totalPrice.toLocaleString()} MAD</p>

              {/* Auth nudge — shown only when not logged in */}
              {!user && (
                <p className="cart-auth-nudge">
                  You need to <button onClick={() => setShowAuth(true)}>sign in</button> to checkout
                </p>
              )}

              <button className="btn btn-primary" onClick={handleCheckout} id="checkout-btn">
                {t('cart.checkout')}
              </button>
              <Link to="/products" className="btn btn-ghost">{t('cart.continue_shopping')}</Link>
            </div>
          </div>
        </div>
      </main>

      {/* Auth modal triggered by checkout if not logged in */}
      {showAuth && (
        <UserAuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}
    </>
  );
}
