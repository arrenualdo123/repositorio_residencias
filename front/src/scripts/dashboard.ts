const sessionData = localStorage.getItem('userSession');
if (!sessionData) {
    window.location.href = 'login.html';
} else {
    const user = JSON.parse(sessionData);
    console.log('Bienvenido:', user.email);
}