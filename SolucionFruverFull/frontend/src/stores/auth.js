// frontend/src/stores/auth.js

// Guarda sesión tras login
export function setSession({ token, usuario, rol } = {}) {
    if (token)   localStorage.setItem('token', token);
    if (usuario) localStorage.setItem('usuario', usuario);
    if (rol)     localStorage.setItem('role', rol); // usamos "role" como clave estable
  
    // notifica a otros componentes/pestañas
    window.dispatchEvent(new StorageEvent('storage', { key: 'token' }));
  }
  
  // Limpia sesión (logout)
  export function clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('rol');
  
    window.dispatchEvent(new StorageEvent('storage', { key: 'token' }));
  }
  
  // Lectores rápidos
  export function getToken()    { return localStorage.getItem('token') || ''; }
  export function getRole()     { return localStorage.getItem('role') || localStorage.getItem('rol') || ''; }
  export function getUsername() { return localStorage.getItem('usuario') || localStorage.getItem('username') || ''; }
  
  // Predicados de conveniencia
  export function isLogged() { return !!getToken(); }
  export function isAdmin()  {
    const r = getRole();
    const u = getUsername();
    return r === 'admin' || u === 'admin';
  }
  
  // Headers para fetch con Authorization
  export function authHeaders(extra = {}) {
    const t = getToken();
    return { ...extra, ...(t ? { Authorization: `Bearer ${t}` } : {}) };
  }
  