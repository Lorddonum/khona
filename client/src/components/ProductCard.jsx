import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { addToCart } = useCart();
  const lang = i18n.language;

  const name = product.name?.[lang] || product.name?.en || '';
  const image = product.images?.[0] || '/placeholder.jpg';
  const inStock = product.quantity > 0;
  const hasModels = product.models?.length > 1;
  
  const isPromo = product.promotion?.active;
  const discount = product.promotion?.discountPercent || 0;
  const finalPrice = isPromo ? (product.price * (1 - discount / 100)) : product.price;

  return (
    <div className="product-card card" id={`product-${product._id}`}>
      <Link to={`/products/${product._id}`} className="product-card__img-wrap" style={{ position: 'relative' }}>
        <img
          src={image.startsWith('/uploads') ? image : image}
          alt={name}
          className="product-card__img"
          loading="lazy"
        />
        {isPromo && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--color-gold)', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            -{discount}%
          </div>
        )}
        {product.featured && !isPromo && (
          <span className="product-card__badge badge badge-gold">★ Featured</span>
        )}
        {!inStock && (
          <div className="product-card__overlay">
            <span>{t('products.out_of_stock')}</span>
          </div>
        )}
      </Link>

      <div className="product-card__body">
        <Link to={`/products/${product._id}`}>
          <h3 className="product-card__name">{name}</h3>
        </Link>
        <p className="product-card__price">
          {isPromo && (
            <span style={{ textDecoration: 'line-through', color: 'var(--color-muted)', fontSize: '0.9rem', marginRight: '0.5rem' }}>
              {product.price?.toLocaleString()} MAD
            </span>
          )}
          <span>{finalPrice.toLocaleString()} MAD</span>
        </p>

        <div className="product-card__actions">
          <button
            className="btn btn-primary product-card__btn"
            onClick={() => hasModels ? navigate(`/products/${product._id}`) : addToCart(product)}
            disabled={!inStock && !hasModels}
            id={`add-cart-${product._id}`}
          >
            {hasModels ? 'Select Options' : (inStock ? t('products.add_to_cart') : t('products.out_of_stock'))}
          </button>
          <Link
            to={`/products/${product._id}`}
            className="btn btn-ghost product-card__btn-detail"
          >
            →
          </Link>
        </div>
      </div>
    </div>
  );
}
