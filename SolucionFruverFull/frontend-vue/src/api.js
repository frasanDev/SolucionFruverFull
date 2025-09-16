const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getToken() { return localStorage.getItem('token') }

export async function api(path, { method='GET', body, headers={}, auth=true }={}){
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers }, credentials: 'include' }
  if (body) opts.body = JSON.stringify(body)
  if (auth) {
    const t = getToken()
    if (t) opts.headers['Authorization'] = `Bearer ${t}`
  }
  const res = await fetch(`${API_URL}${path}`, opts)
  const data = await res.json().catch(()=>({}))
  if (!res.ok) throw new Error(data?.error || res.statusText || 'Error de red')
  return data
}

export const login = async (usuario, clave) => {
  const data = await api('/auth/login', { method:'POST', body:{ usuario, clave }, auth:false })
  if (data?.token) localStorage.setItem('token', data.token)
  return data
}
export const logout = () => localStorage.removeItem('token')