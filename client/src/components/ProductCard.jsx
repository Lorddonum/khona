import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { t, i18n } = useTranslation();
  const { addToCart } = useCart();
  const lang = i18n.language;

  const name = product.name?.[lang] || product.name?.en || '';
  const image = product.images?.[0] || '/placeholder.jpg';
  const inStock = product.quantity > 0;

  return (
    <div className="product-card card" id={`product-${product._id}`}>
      <Link to={`/products/${product._id}`} className="product-card__img-wrap">
        <img
          src={image.startsWith('/uploads') ? image : image}
          alt={name}
          className="product-card__img"
          loading="lazy"
        />
        {product.featured && (
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
        <p className="product-card__price">{product.price?.toLocaleString()} MAD</p>

        <div className="product-card__actions">
          <button
            className="btn btn-primary product-card__btn"
            onClick={() => addToCart(product)}
            disabled={!inStock}
            id={`add-cart-${product._id}`}
          >
            {inStock ? t('products.add_to_cart') : t('products.out_of_stock')}
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
