const sessionData = localStorage.getItem('userSession');

if (!sessionData) {
    window.location.href = '/';
} else {
    const user = JSON.parse(sessionData);
    const greeting = document.querySelector('.topbar span');

    if (greeting) {
        greeting.textContent = `Hola, ${user.email}`;
    }
}
