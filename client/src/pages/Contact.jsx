import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { submitContact } from '../lib/api';
import './Contact.css';

export default function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitContact(form);
      setStatus('success');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="contact-page" style={{ paddingTop: '100px' }}>
      <div className="container">
        <div className="contact-page__header">
          <h1 className="section-title">{t('contact.title')}</h1>
          <p className="section-subtitle">{t('contact.subtitle')}</p>
          <div className="divider" />
        </div>

        <div className="contact-page__inner">
          {/* Info cards */}
          <div className="contact-info">
            {[
              {
                id: 'phone',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.2 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.9v2z"/>
                  </svg>
                ),
                label: 'Phone',
                value: '+213 XX XXX XXXX',
              },
              {
                id: 'email',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                ),
                label: 'Email',
                value: 'contact@khona.com',
              },
              {
                id: 'address',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                ),
                label: 'Address',
                value: 'Algeria',
              },
            ].map((item) => (
              <div key={item.id} className="contact-info-card glass" id={`contact-${item.id}`}>
                <div className="contact-info-card__icon">{item.icon}</div>
                <div>
                  <p className="contact-info-card__label">{item.label}</p>
                  <p className="contact-info-card__value">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <form className="contact-form glass" onSubmit={handleSubmit} id="contact-page-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('contact.name')}</label>
                <input className="form-input" type="text" name="name" value={form.name} onChange={handleChange} required id="cp-name" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('contact.email')}</label>
                <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} required id="cp-email" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('contact.phone')}</label>
              <input className="form-input" type="tel" name="phone" value={form.phone} onChange={handleChange} id="cp-phone" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('contact.message')}</label>
              <textarea className="form-textarea" name="message" value={form.message} onChange={handleChange} required rows={6} id="cp-message" />
            </div>
            {status === 'success' && <p className="form-success">{t('contact.success')}</p>}
            {status === 'error' && <p className="form-error">{t('contact.error')}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading} id="cp-submit">
              {loading ? t('common.loading') : t('contact.send')}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
