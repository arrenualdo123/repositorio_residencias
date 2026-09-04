import React, { useEffect, useState } from 'react';
import './AuthModal.css';

interface AuthModalProps {
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ initialMode = 'login' }) => {
  const [isActive, setIsActive] = useState<boolean>(initialMode === 'register');
  const [role, setRole] = useState<'estudiante' | 'externo'>('estudiante');

  // Estados de inputs login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginState, setLoginState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [loginShake, setLoginShake] = useState(false);

  // Estados de inputs registro
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regState, setRegState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [regShake, setRegShake] = useState(false);

  useEffect(() => {
    setIsActive(initialMode === 'register');
  }, [initialMode]);

  // Validaciones auxiliares
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isLoginEmailValid = emailRegex.test(loginEmail);
  const isRegEmailValid = emailRegex.test(regEmail);

  // Calcular fuerza contraseña
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passScore = getPasswordStrength(regPass);
  const strengthColors = ['#ff4d63', '#ffae31', '#308fff', '#54c98f'];
  const strengthLabels = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte'];

  // Manejador de Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginState !== 'idle') return;

    if (!loginEmail.trim() || !loginPass.trim() || !isLoginEmailValid) {
      setLoginShake(true);
      setTimeout(() => setLoginShake(false), 500);
      return;
    }

    setLoginState('loading');
    setTimeout(() => {
      setLoginState('success');
      setTimeout(() => setLoginState('idle'), 1600);
    }, 1100);
  };

  // Manejador de Registro
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (regState !== 'idle') return;

    if (!isRegEmailValid || regPass.length < 8) {
      setRegShake(true);
      setTimeout(() => setRegShake(false), 500);
      return;
    }

    setRegState('loading');
    setTimeout(() => {
      setRegState('success');
      setTimeout(() => setRegState('idle'), 1600);
    }, 1100);
  };

  return (
    <div className={`auth-page-container ${isActive ? 'reg-mode' : ''}`}>
      <div className="bg-layer bg-login"></div>
      <div className="bg-layer bg-register"></div>

      <div className="brand-top">
        <span className="mark">M</span>Repositorio · UA Meridiano
      </div>

      <div className={`auth-wrap ${isActive ? 'active' : ''}`} id="authWrap">
        
        {/* LOGIN PANEL */}
        <div className={`form-panel ${loginShake ? 'shake' : ''}`} id="loginPanel">
          <form onSubmit={handleLoginSubmit}>
            <h2>Inicia sesión</h2>
            <div className="sub">Consulta el repositorio con tu cuenta institucional.</div>
            
            <div className="field">
              <label>Correo</label>
              <input
                type="email"
                placeholder="tú@meridiano.edu.mx"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className={loginEmail ? (isLoginEmailValid ? 'valid' : 'invalid') : ''}
              />
              <span className={`status-icon show ${isLoginEmailValid ? 'ok' : 'err'}`} style={{ opacity: loginEmail ? 1 : 0 }}>
                {isLoginEmailValid ? '✓' : '!'}
              </span>
            </div>

            <div className="field pw-wrap">
              <label>Contraseña</label>
              <input
                type={showLoginPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowLoginPass(!showLoginPass)}
              >
                {showLoginPass ? '🙈' : '👁'}
              </button>
            </div>

            <button className={`submit-btn ${loginState}`} type="submit">
              <span className="btn-text">Entrar</span>
              <span className="spinner"></span>
              <span className="check-mark">✓</span>
            </button>

            <div className="altlink">
              ¿No tienes cuenta?{' '}
              <button type="button" className="text-link" onClick={() => setIsActive(true)}>
                Crear cuenta
              </button>
            </div>
            <div className="altlink">¿Olvidaste tu contraseña? <a href="#recuperar">Recuperar</a></div>
          </form>
        </div>

        {/* REGISTER PANEL */}
        <div className={`form-panel ${regShake ? 'shake' : ''}`} id="registerPanel">
          <form onSubmit={handleRegisterSubmit}>
            <h2>Crea tu cuenta</h2>
            <div className="sub">Solo para consulta — el registro no otorga permisos de edición.</div>

            <div className="role-select">
              <div
                className={`role-opt ${role === 'estudiante' ? 'active' : ''}`}
                onClick={() => setRole('estudiante')}
              >
                Estudiante
              </div>
              <div
                className={`role-opt ${role === 'externo' ? 'active' : ''}`}
                onClick={() => setRole('externo')}
              >
                Usuario externo
              </div>
            </div>
            <div className="role-note">
              {role === 'estudiante'
                ? 'Se validará con tu correo institucional (@meridiano.edu.mx).'
                : 'Cuenta de solo lectura, sin necesidad de correo institucional.'}
            </div>

            <div className={`greeting ${regName.trim().length > 1 ? 'show' : ''}`}>
              {regName.trim().length > 1 ? `¡Hola, ${regName.trim().split(' ')[0]}! 👋` : ''}
            </div>

            <div className="field">
              <label>Nombre completo</label>
              <input
                type="text"
                placeholder="Tu nombre"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Correo</label>
              <input
                type="email"
                placeholder="tú@meridiano.edu.mx"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className={regEmail ? (isRegEmailValid ? 'valid' : 'invalid') : ''}
              />
              <span className={`status-icon show ${isRegEmailValid ? 'ok' : 'err'}`} style={{ opacity: regEmail ? 1 : 0 }}>
                {isRegEmailValid ? '✓' : '!'}
              </span>
              <div className={`hint ${regEmail && !isRegEmailValid ? 'show' : ''}`}>Correo no válido.</div>
            </div>

            <div className="field pw-wrap">
              <label>Contraseña</label>
              <input
                type={showRegPass ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowRegPass(!showRegPass)}
              >
                {showRegPass ? '🙈' : '👁'}
              </button>
            </div>

            <div className="strength-meter">
              <div className="bar" style={{ background: passScore >= 1 ? strengthColors[Math.max(passScore - 1, 0)] : 'var(--line)' }}></div>
              <div className="bar" style={{ background: passScore >= 2 ? strengthColors[Math.max(passScore - 1, 0)] : 'var(--line)' }}></div>
              <div className="bar" style={{ background: passScore >= 3 ? strengthColors[Math.max(passScore - 1, 0)] : 'var(--line)' }}></div>
              <div className="bar" style={{ background: passScore >= 4 ? strengthColors[Math.max(passScore - 1, 0)] : 'var(--line)' }}></div>
            </div>
            <div className="strength-label" style={{ color: strengthColors[Math.max(passScore - 1, 0)] }}>
              {regPass.length ? strengthLabels[Math.max(passScore - 1, 0)] : ''}
            </div>

            <button className={`submit-btn ${regState}`} type="submit" style={{ marginTop: '14px' }}>
              <span className="btn-text">Crear cuenta</span>
              <span className="spinner"></span>
              <span className="check-mark">✓</span>
            </button>

            <div className="altlink">
              ¿Ya tienes cuenta?{' '}
              <button type="button" className="text-link" onClick={() => setIsActive(false)}>
                Iniciar sesión
              </button>
            </div>
          </form>
        </div>

        {/* OVERLAY DESLIZANTE */}
        <div className="overlay-container" id="overlayContainer">
          <div className="overlay">
            <div className="float-shape fs1"></div>
            <div className="float-shape fs2"></div>
            <div className="float-shape fs3"></div>
            
            <div className="overlay-panel">
              <h3>¿Ya tienes cuenta?</h3>
              <p>Inicia sesión para guardar búsquedas y acceder más rápido a tus consultas frecuentes.</p>
              <button className="ghost-btn" onClick={() => setIsActive(false)}>Iniciar sesión</button>
            </div>

            <div className="overlay-panel">
              <h3>¿Primera vez aquí?</h3>
              <p>Crea una cuenta gratuita para consultar el repositorio de tesis y proyectos de residencia.</p>
              <button className="ghost-btn" onClick={() => setIsActive(true)}>Crear cuenta</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};