import React, { useEffect, useRef } from 'react';
import './Landing.css';

interface LandingProps {
  openAuth: (mode: 'login' | 'register') => void;
}

interface Role {
  word: string;
  color: string;
}

const roles: Role[] = [
  { word: 'Ingeniero', color: '#9fd0ff' },
  { word: 'Arquitecto', color: '#b9ebd2' },
  { word: 'Administrador', color: '#ffe0ad' },
  { word: 'Contadora', color: '#f5c6e7' }
];

export const Landing: React.FC<LandingProps> = ({ openAuth }) => {
  const roleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let ri = 0;
    const roleEl = roleRef.current;
    if (!roleEl) return;

    roleEl.style.transition = 'opacity .22s ease';

    const interval = setInterval(() => {
      ri = (ri + 1) % roles.length;
      roleEl.style.opacity = '0';
      setTimeout(() => {
        if (roleEl) {
          roleEl.textContent = roles[ri].word;
          roleEl.style.color = roles[ri].color;
          roleEl.style.opacity = '1';
        }
      }, 220);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-container">
      {/* NAVBAR */}
      <nav className="landing-nav">
        <div className="landing-wrap">
          <div className="landing-logo">
            TSJ <span className="landing-tag">La Huerta</span>
          </div>
          <div className="landing-links">
            <span>Oferta educativa</span>
            <span>Admisión</span>
            <span>Becas</span>
          </div>
          <div className="landing-nav-actions">
            <button
              type="button"
              className="landing-login-btn"
              aria-label="Iniciar sesión"
              onClick={() => openAuth('login')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
              </svg>
              Login
            </button>
            <button type="button" className="landing-navcta" onClick={() => openAuth('register')}>
              Solicitar información
            </button>
          </div>
        </div>
      </nav>

      <div className="landing-hero">
        <div className="landing-wrap landing-hero-grid">
          <div className="landing-hero-content">
            <div className="landing-eyebrow">Convocatoria 2026 · TSJ La Huerta</div>
            <h1>
              Aquí formamos al próximo
              <span className="role-line">
                <span className="role-swap" ref={roleRef}>Ingeniero</span>&nbsp;que tu región necesita.
              </span>
            </h1>
            <p className="landing-sub">
              La sede que forma a más profesionales técnicos de la región — con vinculación directa a empresas locales.
            </p>
            <div className="landing-search">
              <input placeholder="¿Qué quieres estudiar?" />
              <button>Buscar</button>
            </div>
            <div className="landing-actions">
              <a className="landing-btn-primary" href="#oferta">Ver oferta educativa</a>
              <a className="landing-btn-ghost" href="#visita">Agenda tu visita</a>
            </div>
            <div className="landing-ticker-mask">
              <div className="landing-ticker">
                <span>Inscripciones 2026 abiertas</span>
                <span>15 empresas aliadas</span>
                <span>7 carreras activas</span>
              </div>
            </div>
          </div>
          <div className="landing-visual">
            <div className="fcard fc1"><span>Práctica en planta piloto</span></div>
            <div className="fcard fc2"><span>Concursos de programación</span></div>
            <div className="fcard fc3"><span>Feria de emprendimiento</span></div>
            <div className="stat-chip sc1">92%<small>Empleabilidad</small></div>
            <div className="stat-chip sc2">1,500<small>Estudiantes</small></div>
          </div>
        </div>
      </div>

    </div>
  );
};