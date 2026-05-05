import { useTranslation } from 'react-i18next';
import './About.css';

const VALUES = [
  {
    id: 'quality',
    icon: '◈',
    titleKey: 'about.quality',
    textKey: 'about.quality_text',
  },
  {
    id: 'innovation',
    icon: '◉',
    titleKey: 'about.innovation',
    textKey: 'about.innovation_text',
  },
  {
    id: 'service',
    icon: '◎',
    titleKey: 'about.service',
    textKey: 'about.service_text',
  },
];

export default function About() {
  const { t } = useTranslation();

  return (
    <main className="about-page" style={{ paddingTop: '100px' }}>
      {/* Hero banner */}
      <section className="about-hero">
        <div className="about-hero__bg" />
        <div className="container about-hero__content">
          <span className="badge badge-gold">EST. 2020</span>
          <h1 className="about-hero__title">{t('about.title')}</h1>
          <p className="about-hero__subtitle">{t('about.subtitle')}</p>
        </div>
      </section>

      {/* Mission */}
      <section className="section about-mission">
        <div className="container about-mission__inner">
          <div className="about-mission__text">
            <span className="section-subtitle">{t('about.mission_title')}</span>
            <h2 className="section-title">{t('about.mission_title')}</h2>
            <div className="divider" />
            <p className="about-mission__body">{t('about.mission_text')}</p>
          </div>
          <div className="about-mission__visual">
            <div className="about-mission__orb" />
            <div className="about-mission__logo-wrap">
              <img src="/khona.png" alt="Khona" className="about-mission__logo" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section about-values">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">{t('about.values_title')}</span>
            <h2 className="section-title">{t('about.values_title')}</h2>
            <div className="divider" style={{ margin: '1rem auto' }} />
          </div>
          <div className="about-values__grid">
            {VALUES.map((v) => (
              <div key={v.id} className="about-value-card glass" id={`value-${v.id}`}>
                <div className="about-value-card__icon">{v.icon}</div>
                <h3 className="about-value-card__title">{t(v.titleKey)}</h3>
                <p className="about-value-card__text">{t(v.textKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
