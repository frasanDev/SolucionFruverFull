<!-- frontend/src/views/Cierre.vue -->
<template>
    <div class="page">
      <h2>Cierre de caja</h2>
  
      <div class="toolbar">
        <label>Desde</label>
        <input class="input" type="date" v-model="desde">
        <label>Hasta</label>
        <input class="input" type="date" v-model="hasta">
        <button class="btn" :disabled="cargando" @click="cargar">Aplicar</button>
        <span class="spacer"></span>
        <button class="btn" :disabled="cargando || !data" @click="imprimir">Imprimir</button>
        <button class="btn" :disabled="cargando || !data" @click="exportCSV">Exportar CSV</button>
      </div>
  
      <div v-if="error" class="alert">{{ error }}</div>
  
      <div v-if="cargando">Cargando…</div>
      <div v-else-if="data" class="grid">
        <div class="card">
          <h3>Rango</h3>
          <div class="muted">{{ data.rango.desde }} → {{ data.rango.hasta }}</div>
          <div class="muted">{{ data.rango.from }} → {{ data.rango.to }}</div>
        </div>
  
        <div class="card stat"><div class="k">Ventas</div><div class="v">{{ data.totales.ventas }}</div></div>
        <div class="card stat"><div class="k">Válidas</div><div class="v">{{ data.totales.validas }}</div></div>
        <div class="card stat"><div class="k">Anuladas</div><div class="v">{{ data.totales.anuladas }}</div></div>
        <div class="card stat"><div class="k">Total bruto</div><div class="v">$ {{ money(data.totales.totalBruto) }}</div></div>
        <div class="card stat"><div class="k">Efectivo</div><div class="v">$ {{ money(data.totales.efectivoRecibido) }}</div></div>
        <div class="card stat"><div class="k">Cambio</div><div class="v">$ {{ money(data.totales.cambioEntregado) }}</div></div>
        <div class="card stat"><div class="k">Neto caja</div><div class="v">$ {{ money(data.totales.netoCaja) }}</div></div>
  
        <div class="card table-wrap">
          <h3>Por cajero</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Cajero</th>
                <th>Ventas</th>
                <th>Válidas</th>
                <th>Anuladas</th>
                <th style="text-align:right">Total</th>
                <th style="text-align:right">Efectivo</th>
                <th style="text-align:right">Cambio</th>
                <th style="text-align:right">Neto</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in data.porCajero" :key="c.cajeroId || c.cajero">
                <td>{{ c.cajero?.usuario || c.cajeroNombre || c.cajeroId || c.cajero }}</td>
                <td>{{ c.ventas }}</td>
                <td>{{ c.validas }}</td>
                <td>{{ c.anuladas }}</td>
                <td class="num">$ {{ money(c.total) }}</td>
                <td class="num">$ {{ money(c.efectivo) }}</td>
                <td class="num">$ {{ money(c.cambio) }}</td>
                <td class="num">$ {{ money(c.neto) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="!data.porCajero?.length" class="muted">Sin resultados</div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  // API y token
  const API   = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3000'
  const token = localStorage.getItem('token') || ''
  
  // fecha hoy por defecto
  function yyyy_mm_dd(d = new Date()){
    const y = d.getFullYear()
    const m = String(d.getMonth()+1).padStart(2,'0')
    const day = String(d.getDate()).padStart(2,'0')
    return `${y}-${m}-${day}`
  }
  
  const desde    = ref(yyyy_mm_dd())
  const hasta    = ref(yyyy_mm_dd())
  const cargando = ref(false)
  const error    = ref('')
  const data     = ref(null)
  
  function money(n){ return Number(n||0).toLocaleString('es-CO',{minimumFractionDigits:2, maximumFractionDigits:2}) }
  
  async function cargar(){
    error.value = ''
    data.value = null
    cargando.value = true
    try{
      const url = `${API}/ventas/cierre?desde=${encodeURIComponent(desde.value)}&hasta=${encodeURIComponent(hasta.value)}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json().catch(()=>({}))
      if(!res.ok || json.ok === false) throw new Error(json.message || 'Error obteniendo cierre')
      data.value = json
    }catch(e){
      error.value = String(e.message || e)
    }finally{
      cargando.value = false
    }
  }
  
  function imprimir(){
    if(!data.value) return
    const d = data.value
    const rows = (d.porCajero || []).map(c => 
      `<tr>
        <td>${c.cajero?.usuario || c.cajeroNombre || c.cajeroId || c.cajero}</td>
        <td>${c.ventas}</td>
        <td>${c.validas}</td>
        <td>${c.anuladas}</td>
        <td class="num">$ ${money(c.total)}</td>
        <td class="num">$ ${money(c.efectivo)}</td>
        <td class="num">$ ${money(c.cambio)}</td>
        <td class="num">$ ${money(c.neto)}</td>
      </tr>`).join('')
    const html = `<!doctype html><html><head><meta charset="utf-8">
      <title>Cierre ${d.rango.desde} → ${d.rango.hasta}</title>
      <style>
        body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Arial,sans-serif;font-size:12px;padding:10px}
        h2,h3{margin:0 0 6px}
        .muted{color:#6b7280}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th,td{padding:4px;border-bottom:1px solid #eee}
        th{text-align:left}.num{text-align:right;font-variant-numeric:tabular-nums}
      </style></head><body>
      <h2>Cierre de caja</h2>
      <div class="muted">${d.rango.desde} → ${d.rango.hasta}</div>
      <h3>Totales</h3>
      <div>Ventas: ${d.totales.ventas} — Válidas: ${d.totales.validas} — Anuladas: ${d.totales.anuladas}</div>
      <div>Total bruto: $ ${money(d.totales.totalBruto)} — Efectivo: $ ${money(d.totales.efectivoRecibido)} — Cambio: $ ${money(d.totales.cambioEntregado)} — Neto: $ ${money(d.totales.netoCaja)}</div>
      <h3>Por cajero</h3>
      <table>
        <thead><tr><th>Cajero</th><th>Ventas</th><th>Válidas</th><th>Anuladas</th><th class="num">Total</th><th class="num">Efectivo</th><th class="num">Cambio</th><th class="num">Neto</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <script>window.onload=function(){setTimeout(function(){window.print()},100)}<\/script>
    </body></html>`
    const w = window.open('', 'cierre', 'width=820,height=900')
    if(!w) return
    w.document.write(html); w.document.close()
  }
  
  function exportCSV(){
    if(!data.value) return
    const d = data.value
    const header = ['cajero','ventas','validas','anuladas','total','efectivo','cambio','neto']
    const lines = [header.join(',')]
    for(const c of (d.porCajero || [])){
      const row = [
        (c.cajero?.usuario || c.cajeroNombre || c.cajeroId || c.cajero || '').replace(/,/g,' '),
        c.ventas, c.validas, c.anuladas,
        c.total, c.efectivo, c.cambio, c.neto
      ]
      lines.push(row.join(','))
    }
    const blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8'})
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cierre_${desde.value}_a_${hasta.value}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }
  
  // carga inicial (hoy)
  cargar()
  </script>
  
  <style scoped>
  .page { display: grid; gap: 14px; }
  .toolbar { display: flex; gap: 8px; align-items: center; }
  .input { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 8px; }
  .btn { background: #3b82f6; color: #fff; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
  .spacer { flex: 1; }
  .alert { background: #fee2e2; color: #991b1b; padding: 8px 10px; border-radius: 6px; }
  .grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  .card { border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; padding: 12px; }
  .card.stat .k { color:#6b7280; font-size: 12px; }
  .card.stat .v { font-size: 18px; font-weight: 600; }
  .table-wrap { grid-column: 1 / -1; }
  .table { width: 100%; border-collapse: collapse; }
  .table th, .table td { border-bottom: 1px solid #e5e7eb; padding: 8px; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .muted { color:#6b7280; }
  </style>
  