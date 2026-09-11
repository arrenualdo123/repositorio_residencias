import React, { useEffect, useRef, useState } from 'react';
import './Landing.css';

interface LandingProps {
  openAuth: (mode: 'login' | 'register') => void;
}

type Role = { word: string; color: string };
type GalleryCategory = 'all' | 'ing' | 'gas' | 'adm';

const roles: Role[] = [
  { word: 'Ingeniero', color: '#9fd0ff' },
  { word: 'Chef', color: '#b9ebd2' },
  { word: 'Administrador', color: '#ffe0ad' },
];

const galleryItems = [
  { category: 'ing', color: 'bg-B', title: 'Práctica en planta piloto', label: 'Ingeniería', tall: true },
  { category: 'gas', color: 'bg-C', title: 'Cocina de autor', label: 'Gastronomía', tall: false },
  { category: 'adm', color: 'bg-A', title: 'Simulador de negocios', label: 'Administración', tall: false },
  { category: 'gas', color: 'bg-E', title: 'Panadería y repostería', label: 'Gastronomía', tall: true },
  { category: 'ing', color: 'bg-B60', title: 'Laboratorio de automatización', label: 'Ingeniería', tall: false },
  { category: 'adm', color: 'bg-A60', title: 'Feria de emprendimiento', label: 'Administración', tall: false },
];

const secondGalleryItems = [
  { category: 'gas', color: 'bg-E60', title: 'Servicio en restaurante escuela', label: 'Gastronomía', tall: false },
  { category: 'adm', color: 'bg-A', title: 'Visita a empresa aliada', label: 'Administración', tall: true },
  { category: 'ing', color: 'bg-B', title: 'Proyecto de manufactura', label: 'Ingeniería', tall: false },
  { category: 'gas', color: 'bg-C', title: 'Concurso culinario', label: 'Gastronomía', tall: false },
  { category: 'ing', color: 'bg-B60', title: 'Robótica aplicada', label: 'Ingeniería', tall: true },
  { category: 'adm', color: 'bg-A60', title: 'Auditorio y conferencias', label: 'Administración', tall: false },
];

function GalleryRow({ items, activeCategory }: { items: typeof galleryItems; activeCategory: GalleryCategory }) {
  const repeatedItems = [...items, ...items];

  return (
    <div className="marquee-row">
      {repeatedItems.map((item, index) => (
        <div
          className={`mcard ${item.tall ? 'tall' : ''} ${item.color} ${activeCategory !== 'all' && activeCategory === item.category ? 'pulse' : ''}`}
          data-c={item.category}
          key={`${item.title}-${index}`}
        >
          <span className="career-badge">{item.label}</span>
          <div className="info">{item.title}</div>
        </div>
      ))}
    </div>
  );
}

export const Landing: React.FC<LandingProps> = ({ openAuth }) => {
  const roleRef = useRef<HTMLSpanElement>(null);
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('all');
  const categories: { id: GalleryCategory; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'ing', label: 'Ingeniería Industrial' },
    { id: 'gas', label: 'Gastronomía' },
    { id: 'adm', label: 'Administración' },
  ];

  useEffect(() => {
    let roleIndex = 0;
    const roleElement = roleRef.current;
    if (!roleElement) return;

    roleElement.style.transition = 'opacity .22s ease';
    const interval = window.setInterval(() => {
      roleIndex = (roleIndex + 1) % roles.length;
      roleElement.style.opacity = '0';
      window.setTimeout(() => {
        roleElement.textContent = roles[roleIndex].word;
        roleElement.style.color = roles[roleIndex].color;
        roleElement.style.opacity = '1';
      }, 220);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="landing-wrap">
          <a className="landing-logo" href="#inicio" aria-label="TSJ La Huerta">
            TSJ <span className="landing-tag">La Huerta</span>
          </a>
          <div className="landing-links">
            <a href="#oferta">Oferta educativa</a>
            <a href="#admision">Admisión</a>
            <a href="#visita">Agenda tu visita</a>
          </div>
          <div className="landing-nav-actions">
            <button type="button" className="landing-login-btn" onClick={() => openAuth('login')}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" /></svg>
              Login
            </button>
            <button type="button" className="landing-navcta" onClick={() => openAuth('register')}>Solicitar información</button>
          </div>
        </div>
      </nav>

      <main id="inicio">
        <section className="landing-hero">
          <div className="landing-wrap landing-hero-grid">
            <div className="landing-hero-content">
              <div className="landing-eyebrow">Convocatoria 2027 · TSJ La Huerta</div>
              <h1>Aquí formamos al próximo <span className="role-line"><span className="role-swap" ref={roleRef}>Ingeniero</span>&nbsp;que tu región necesita.</span></h1>
              <p className="landing-sub">La sede que forma a más profesionales técnicos de la región, con vinculación directa a empresas locales.</p>
              <div className="landing-search">
                <input aria-label="Buscar carrera" placeholder="¿Qué quieres estudiar?" />
                <button type="button">Buscar</button>
              </div>
              <div className="landing-actions">
                <a className="landing-btn-primary" href="#oferta">Ver oferta educativa</a>
                <a className="landing-btn-ghost" href="#visita">Agenda tu visita</a>
              </div>
              <div className="landing-ticker-mask"><div className="landing-ticker"><span>Inscripciones 2027 abiertas</span><span>92% empleabilidad local</span><span>35 empresas aliadas</span><span>3 carreras activas</span></div></div>
            </div>
            <div className="landing-visual" aria-label="Experiencias de la sede">
              <div className="fcard fc1"><span>Práctica en planta piloto</span></div>
              <div className="fcard fc2"><span>Cocina de autor</span></div>
              <div className="fcard fc3"><span>Feria de emprendimiento</span></div>
              <div className="stat-chip sc1">92%<small>Empleabilidad</small></div>
              <div className="stat-chip sc2">4,200<small>Estudiantes</small></div>
            </div>
          </div>
        </section>

        <div className="accred"><div className="landing-wrap accred-wrap"><span><i />Reconocimiento de Validez Oficial (RVOE)</span><span><i />Sistema TSJ / Educación Jalisco</span><span><i />Acreditación nacional vigente</span></div></div>

        <section id="admision" className="landing-section landing-light-section">
          <div className="landing-wrap">
            <h2 className="section-title">Misión, visión y objetivos</h2>
            <p className="section-sub">Lo que nos define como sede académica.</p>
            <div className="mvo-grid">
              <article className="mvo mision"><div className="mvo-icon">◆</div><h3>Misión</h3><p>Formar profesionales técnicos competentes, éticos e innovadores, vinculados directamente con las necesidades productivas de la región.</p></article>
              <article className="mvo vision"><div className="mvo-icon">◇</div><h3>Visión</h3><p>Ser la sede de referencia en educación técnica superior del estado, reconocida por la empleabilidad de sus egresados.</p></article>
              <article className="mvo objetivos"><div className="mvo-icon">✓</div><h3>Objetivos</h3><ul><li>Fortalecer la vinculación con el sector productivo</li><li>Ampliar la cobertura de becas</li><li>Elevar los índices de titulación y empleabilidad</li></ul></article>
            </div>
          </div>
        </section>

        <section id="oferta" className="landing-section">
          <div className="landing-wrap">
            <h2 className="section-title">Carreras en esta sede</h2>
            <p className="section-sub">La oferta educativa disponible en TSJ La Huerta.</p>
            <div className="carousel">
              <article className="card"><div className="img course-ing" /><div className="body"><h3>Ingeniería Industrial</h3><span className="badge">4.5 años</span><span className="badge">Presencial</span></div></article>
              <article className="card"><div className="img course-gas" /><div className="body"><h3>Gastronomía</h3><span className="badge">4 años</span><span className="badge">Presencial</span></div></article>
              <article className="card"><div className="img course-adm" /><div className="body"><h3>Administración</h3><span className="badge">4 años</span><span className="badge">Híbrida</span></div></article>
            </div>
          </div>
        </section>

        <section className="gallery-section landing-section">
          <div className="blob-decor" /><div className="blob-decor2" />
          <div className="landing-wrap">
            <h2 className="section-title">La vida en TSJ La Huerta</h2>
            <p className="section-sub">Instalaciones, prácticas y proyectos reales que forman parte de cada carrera.</p>
            <div className="chips">{categories.map((category) => <button type="button" className={`chip ${activeCategory === category.id ? 'active' : ''}`} key={category.id} onClick={() => setActiveCategory(category.id)}>{category.label}</button>)}</div>
            <div className="marquee-mask"><GalleryRow items={galleryItems} activeCategory={activeCategory} /><GalleryRow items={secondGalleryItems} activeCategory={activeCategory} /></div>
          </div>
        </section>

        <section className="landing-section"><div className="landing-wrap"><h2 className="section-title">Esta sede en números</h2><div className="stats-panel"><div className="stats-grid"><div className="stat"><div className="num">4,200</div><div className="label">Estudiantes en esta sede</div></div><div className="stat"><div className="num">92%</div><div className="label">Empleabilidad local</div></div><div className="stat"><div className="num">35</div><div className="label">Empresas aliadas en la región</div></div></div></div></div></section>
      </main>

      <footer className="landing-footer"><div className="landing-wrap"><div className="footer-byadges"><span>RVOE vigente</span><span>Miembro del Sistema Tecnológico</span><span>Educación Jalisco</span></div><div className="footer-content"><div className="footer-col"><div className="landing-logo">TSJ <span className="landing-tag">La Huerta</span></div><p>Instituto Tecnológico Superior de Jalisco, plantel La Huerta.</p></div><div className="footer-col"><h4>Programas</h4><p>Ingeniería Industrial<br />Gastronomía<br />Administración</p></div><div className="footer-col"><h4>Admisión</h4><p>Proceso<br />Becas<br />Preguntas frecuentes</p></div><div className="footer-col"><h4>Contacto</h4><p>Av. Tecnológico s/n, La Huerta, Jalisco.</p></div></div><div className="footer-bottom">© 2027 TSJ La Huerta, parte del Sistema Tecnológico Estatal</div></div></footer>
    </div>
  );
};