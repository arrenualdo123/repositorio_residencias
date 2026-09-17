import React, { useEffect, useState } from 'react';
import './AuthModal.css';

interface AuthModalProps {
  initialMode?: 'login' | 'register';
  onClose?: () => void;
  onLoginSuccess?: (userData: { email: string; role: string }) => void;
  onSuccess?: (userData: { email: string; role: string }) => void;
}

const API_URL = 'http://127.0.0.1:8000/api'; // Cambia el puerto si tu php artisan serve usa otro

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onClose,
  onLoginSuccess,
  onSuccess
}) => {
  const [isActive, setIsActive] = useState<boolean>(initialMode === 'register');
  const [role, setRole] = useState<'estudiante' | 'externo'>('estudiante');

  // Estados de inputs login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginState, setLoginState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [loginShake, setLoginShake] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Estados de inputs registro
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regState, setRegState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [regShake, setRegShake] = useState(false);
  const [regError, setRegError] = useState('');

  useEffect(() => {
    setIsActive(initialMode === 'register');
  }, [initialMode]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (email: string) => {
    if (!emailRegex.test(email)) return false;
    if (role === 'estudiante') return email.endsWith('@lahuerta.tecmm.edu.mx');
    return true;
  };

  const isLoginEmailValid = validateEmail(loginEmail);
  const isRegEmailValid = validateEmail(regEmail);

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

  // --- MANEJADOR DE LOGIN CONECTADO A LARAVEL ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginState !== 'idle') return;
    setLoginError('');

    if (!loginEmail.trim() || !loginPass.trim() || !isLoginEmailValid) {
      setLoginShake(true);
      setTimeout(() => setLoginShake(false), 500);
      return;
    }

    setLoginState('loading');

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPass,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // Guardar Token en localStorage para peticiones futuras
      localStorage.setItem('auth_token', data.token);

      setLoginState('success');
      setTimeout(() => {
        const userData = { email: data.user.email, role: data.user.role };
        onLoginSuccess?.(userData);
        onSuccess?.(userData);
        onClose?.();
      }, 1000);

    } catch (err: any) {
      setLoginState('idle');
      setLoginError(err.message || 'Credenciales inválidas');
      setLoginShake(true);
      setTimeout(() => setLoginShake(false), 500);
    }
  };

  // --- MANEJADOR DE REGISTRO CONECTADO A LARAVEL ---
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regState !== 'idle') return;
    setRegError('');

    if (!isRegEmailValid || regPass.length < 8 || !regName.trim()) {
      setRegShake(true);
      setTimeout(() => setRegShake(false), 500);
      return;
    }

    setRegState('loading');

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPass,
          password_confirmation: regPass, // Laravel exige la confirmación
          role: role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en el registro');
      }

      // Guardar Token
      localStorage.setItem('auth_token', data.token);

      setRegState('success');
      setTimeout(() => {
        const userData = { email: data.user.email, role: data.user.role };
        onSuccess?.(userData);
        onClose?.();
      }, 1000);

    } catch (err: any) {
      setRegState('idle');
      setRegError(err.message || 'Error al crear la cuenta');
      setRegShake(true);
      setTimeout(() => setRegShake(false), 500);
    }
  };

  return (
    <div className={`auth-page-container ${isActive ? 'reg-mode' : ''}`}>
      <div className="bg-layer bg-login"></div>
      <div className="bg-layer bg-register"></div>

      {onClose && (
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      )}

      <div className="brand-top">
        <span className="mark">H</span>Repositorio
      </div>

      <div className={`auth-wrap ${isActive ? 'active' : ''}`} id="authWrap">
        
        {/* LOGIN PANEL */}
        <div className={`form-panel ${loginShake ? 'shake' : ''}`} id="loginPanel">
          <form onSubmit={handleLoginSubmit}>
            <h2>Inicia sesión</h2>
            <div className="sub">Consulta el repositorio con tu cuenta institucional.</div>
            
            {loginError && <div style={{ color: '#ff4d63', fontSize: '13px', marginBottom: '10px' }}>{loginError}</div>}

            <div className="field">
              <label>Correo</label>
              <input 
                type="email" 
                placeholder="hu@lahuerta.tecmm.edu.mx" 
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
              <button type="button" className="pw-toggle" onClick={() => setShowLoginPass(!showLoginPass)}>
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

            {regError && <div style={{ color: '#ff4d63', fontSize: '13px', marginBottom: '10px' }}>{regError}</div>}

            <div className="role-select">
              <div className={`role-opt ${role === 'estudiante' ? 'active' : ''}`} onClick={() => setRole('estudiante')}>
                Estudiante
              </div>
              <div className={`role-opt ${role === 'externo' ? 'active' : ''}`} onClick={() => setRole('externo')}>
                Usuario externo
              </div>
            </div>

            <div className="field">
              <label>Nombre completo</label>
              <input type="text" placeholder="Tu nombre" value={regName} onChange={(e) => setRegName(e.target.value)} />
            </div>

            <div className="field">
              <label>Correo</label>
              <input
                type="email"
                placeholder={role === 'estudiante' ? "huXXXXXXXX@lahuerta.tecmm.edu.mx" : "tu@correo.com"}
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className={regEmail ? (isRegEmailValid ? 'valid' : 'invalid') : ''}
              />
            </div>

            <div className="field pw-wrap">
              <label>Contraseña</label>
              <input
                type={showRegPass ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
              />
              <button type="button" className="pw-toggle" onClick={() => setShowRegPass(!showRegPass)}>
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