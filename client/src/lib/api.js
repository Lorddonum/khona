import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('khona_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock Data Fallback
const mockProducts = [
  {
    _id: 'mock1',
    title: 'Aura Pendant Light',
    titleAr: 'مصباح أورا المعلق',
    description: 'Modern minimalist pendant light perfect for dining rooms.',
    descriptionAr: 'مصباح معلق حديث وبسيط مثالي لغرف الطعام.',
    price: 249.99,
    images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop'],
    category: { _id: 'cat1', name: 'Pendants', nameAr: 'معلقات' },
    isNewProduct: true,
    featured: true
  },
  {
    _id: 'mock2',
    title: 'Lumina Chandelier',
    titleAr: 'ثريا لومينا',
    description: 'Elegant crystal chandelier that adds luxury to any space.',
    descriptionAr: 'ثريا كريستال أنيقة تضفي الفخامة على أي مساحة.',
    price: 899.00,
    images: ['https://images.unsplash.com/photo-1769018508631-fe4ebf3fba3a?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTh8fGx1eHVyeSUyMGxpZ2h0aW5nJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzc3Mjg5MTE0fDA&ixlib=rb-4.1.0&q=80&w=800&auto=format&fit=crop'],
    category: { _id: 'cat2', name: 'Chandeliers', nameAr: 'ثريات' },
    isNewProduct: false,
    featured: true
  },
  {
    _id: 'mock3',
    title: 'Zenith Table Lamp',
    titleAr: 'مصباح طاولة زينيث',
    description: 'Contemporary table lamp with adjustable brightness.',
    descriptionAr: 'مصباح طاولة معاصر مع إضاءة قابلة للتعديل.',
    price: 129.50,
    images: ['https://images.unsplash.com/photo-1759430711569-f2e52dc26548?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTl8fGx1eHVyeSUyMGxpZ2h0aW5nJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzc3Mjg5MTE0fDA&ixlib=rb-4.1.0&q=80&w=800&auto=format&fit=crop'],
    category: { _id: 'cat3', name: 'Lamps', nameAr: 'مصابيح' },
    isNewProduct: true,
    featured: true
  }
];

// Products
export const getProducts = async (params) => {
  try {
    return await api.get('/products', { params });
  } catch (err) {
    return { data: { products: mockProducts, total: 3, pages: 1 } };
  }
};

export const getProduct = async (id) => {
  try {
    return await api.get(`/products/${id}`);
  } catch (err) {
    const p = mockProducts.find(x => x._id === id) || mockProducts[0];
    return { data: p };
  }
};
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Auth
export const registerUser = (data) => api.post('/auth/register', data);

// Categories
export const getCategories = () => api.get('/categories');
export const getCategory = (id) => api.get(`/categories/${id}`);
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Orders
export const createOrder = (data) => api.post('/orders', data);
export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, data) => api.put(`/orders/${id}/status`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);

// Contact
export const submitContact = (data) => api.post('/contact', data);
export const getContacts = (params) => api.get('/contact', { params });
export const markContactRead = (id) => api.put(`/contact/${id}/read`);
export const deleteContact = (id) => api.delete(`/contact/${id}`);

// Checkout
export const createCheckoutSession = (data) => api.post('/checkout/create-session', data);
export const getOrderBySession = (sessionId) => api.get(`/checkout/success/${sessionId}`);

export default api;
