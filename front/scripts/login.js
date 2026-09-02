const wrap = document.getElementById('authWrap');
document.getElementById('toRegister').addEventListener('click', () => {
    wrap.classList.add('active');
    document.body.classList.add('reg-mode');
});
document.getElementById('toLogin').addEventListener('click', () => {
    wrap.classList.remove('active');
    document.body.classList.remove('reg-mode');
});

document.querySelectorAll('.role-opt').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.role-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        const note = document.getElementById('roleNote');
        note.textContent = opt.dataset.role === 'estudiante'
                ? 'Se validará con tu correo institucional (@meridiano.edu.mx).'
                : 'Cuenta de solo lectura, sin necesidad de correo institucional.';
    });
});

// mostrar/ocultar contraseña
document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.textContent = isPass ? '🙈' : '👁';
    });
});

// saludo dinámico según el nombre
const regName = document.getElementById('regName');
const greeting = document.getElementById('greeting');
regName.addEventListener('input', () => {
    const v = regName.value.trim();
    if (v.length > 1) {
        greeting.textContent = `¡Hola, ${v.split(' ')[0]}! 👋`;
        greeting.classList.add('show');
    } else {
        greeting.classList.remove('show');
    }
});

// validación de correo en vivo
function wireEmailValidation(inputId, iconId, hintId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    const hint = hintId ? document.getElementById(hintId) : null;
    input.addEventListener('input', () => {
        const v = input.value.trim();
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (v.length === 0) {
            input.classList.remove('valid', 'invalid');
            icon.classList.remove('show', 'ok', 'err');
            if (hint)
                hint.classList.remove('show');
            return;
        }
        if (emailRe.test(v)) {
            input.classList.add('valid');
            input.classList.remove('invalid');
            icon.textContent = '✓';
            icon.classList.add('show', 'ok');
            icon.classList.remove('err');
            if (hint)
                hint.classList.remove('show');
        } else {
            input.classList.add('invalid');
            input.classList.remove('valid');
            icon.textContent = '!';
            icon.classList.add('show', 'err');
            icon.classList.remove('ok');
            if (hint)
                hint.classList.add('show');
        }
    });
}
wireEmailValidation('emailReg', 'emailIcon', 'emailHint');
wireEmailValidation('loginEmail', 'loginEmailIcon', null);

// medidor de fuerza de contraseña
const regPass = document.getElementById('regPass');
const bars = [document.getElementById('bar1'), document.getElementById('bar2'), document.getElementById('bar3'), document.getElementById('bar4')];
const strengthLabel = document.getElementById('strengthLabel');
regPass.addEventListener('input', () => {
    const v = regPass.value;
    let score = 0;
    if (v.length >= 8)
        score++;
    if (/[A-Z]/.test(v))
        score++;
    if (/[0-9]/.test(v))
        score++;
    if (/[^A-Za-z0-9]/.test(v))
        score++;
    const colors = ['#ff4d63', '#ffae31', '#308fff', '#54c98f'];
    const labels = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte'];
    bars.forEach((b, i) => {
        b.style.background = i < score ? colors[Math.max(score - 1, 0)] : 'var(--line)';
    });
    strengthLabel.textContent = v.length ? labels[Math.max(score - 1, 0)] : '';
    strengthLabel.style.color = v.length ? colors[Math.max(score - 1, 0)] : '';
});

// envío con estado de carga -> éxito (simulado, sin backend real)
function wireSubmit(formId, btnId, validateFn) {
    const form = document.getElementById(formId);
    const btn = document.getElementById(btnId);
    form.addEventListener('submit', () => {
        if (btn.classList.contains('loading') || btn.classList.contains('success'))
            return;
        if (validateFn && !validateFn()) {
            form.closest('.form-panel').classList.add('shake');
            setTimeout(() => form.closest('.form-panel').classList.remove('shake'), 500);
            return;
        }
        btn.classList.add('loading');
        setTimeout(() => {
            btn.classList.remove('loading');
            btn.classList.add('success');
            setTimeout(() => btn.classList.remove('success'), 1600);
        }, 1100);
    });
}
wireSubmit('loginForm', 'loginBtn', () => document.getElementById('loginEmail').value.trim() && document.getElementById('loginPass').value.trim());
wireSubmit('registerForm', 'registerBtn', () => document.getElementById('emailReg').classList.contains('valid') && regPass.value.length >= 8);