// frontend/src/services/api.js
const API =
  (import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3000');

function authHeaders() {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function request(method, path, body) {
  const url = `${API}${path}`;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  let data;
  let res;
  try {
    res = await fetch(url, opts);
  } catch (e) {
    throw new Error('No se pudo establecer conexión con el servidor.');
  }

  // Intenta parsear JSON; si falla, usa texto
  try {
    data = await res.json();
  } catch {
    data = await res.text();
  }

  if (res.status === 401) {
    // Token inválido/expirado → limpiar y mandar a login
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('rol');
    localStorage.removeItem('usuario');
    localStorage.removeItem('username');
    // Redirige si estamos en navegador
    if (typeof window !== 'undefined') {
      const r = encodeURIComponent(location.hash?.slice(1) || location.pathname || '/');
      location.hash = `#/login?r=${r}`;
    }
    throw new Error((data && data.message) || 'No autenticado');
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `Error HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export const get  = (path)        => request('GET', path);
export const post = (path, body)  => request('POST', path, body);
export const put  = (path, body)  => request('PUT', path, body);
export const del  = (path)        => request('DELETE', path);

export { API };
