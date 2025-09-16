// backend/src/controllers/ventas.controller.js
import Venta from '../models/Venta.model.js';
import { crearVentaService, anularVentaService } from '../services/ventas.service.js';

// Utilidades locales
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const startOfDay = (s) => {
  // interpreta YYYY-MM-DD en zona local del servidor
  return new Date(`${s}T00:00:00`);
};
const endOfDay = (s) => {
  return new Date(`${s}T23:59:59.999`);
};

// POST /ventas
export async function crearVenta(req, res) {
  try {
    const userId = req.user?.id || req.user?.uid || req.user?._id || null;
    const { productos, efectivo } = req.body;

    const venta = await crearVentaService({ userId, productos, efectivo });
    await venta.populate('items.producto', 'nombre unidadBase');

    return res.status(201).json({
      ok: true,
      factura: venta.factura,
      subtotal: venta.subtotal,
      total: venta.total,
      efectivo: venta.efectivo,
      cambio: venta.cambio,
      items: venta.items.map(it => ({
        productoId: it.producto?._id || null,
        nombre: it.nombre,
        unidadBaseProducto: it.unidad,
        unidadIngresada: it.unidadIngresada,
        cantidadIngresada: it.cantidadIngresada,
        cantidadKg: it.cantidadKg || 0,
        precioUnitario: it.precioUnitario,
        totalItem: it.totalItem,
      })),
      createdAt: venta.createdAt,
    });
  } catch (err) {
    return res.status(400).json({ ok: false, message: err.message });
  }
}

// GET /ventas
export async function listarVentas(req, res) {
  try {
    const items = await Venta.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const norm = items.map(v => ({
      ...v,
      anulada: v?.anulada ?? false,
      motivoAnulacion: v?.motivoAnulacion ?? '',
    }));

    return res.json({ ok: true, items: norm });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Error listando ventas' });
  }
}

// GET /ventas/ultima
export async function ultimaVenta(req, res) {
  try {
    const venta = await Venta.findOne({})
      .sort({ createdAt: -1 })
      .populate('cajero', 'usuario')
      .populate('items.producto', 'nombre precio unidadBase');

    if (!venta) return res.json({ ok: true, venta: null });

    const v = venta.toObject();
    v.anulada = v.anulada ?? false;
    v.motivoAnulacion = v.motivoAnulacion ?? '';
    return res.json({ ok: true, venta: v });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Error obteniendo última venta' });
  }
}

// GET /ventas/:id
export async function obtenerVentaPorId(req, res) {
  try {
    const { id } = req.params;
    const venta = await Venta.findById(id)
      .populate('cajero', 'usuario')
      .populate('items.producto', 'nombre precio unidadBase');

    if (!venta) return res.status(404).json({ ok: false, message: 'No encontrada' });

    const v = venta.toObject();
    v.anulada = v.anulada ?? false;
    v.motivoAnulacion = v.motivoAnulacion ?? '';
    return res.json({ ok: true, venta: v });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Error obteniendo venta' });
  }
}

// POST /ventas/:id/anular
export async function anularVenta(req, res) {
  try {
    const id = req.params.id;
    const userId = req.user?.id || req.user?.uid || req.user?._id || null;
    const { motivo = '' } = req.body || {};
    const venta = await anularVentaService({ ventaId: id, userId, motivo });
    await venta.populate('cajero', 'usuario');
    return res.status(200).json({ ok: true, anulada: true, venta });
  } catch (err) {
    return res.status(400).json({ ok: false, message: err.message });
  }
}

/**
 * GET /ventas/cierre?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Devuelve totales del rango y desglose por cajero.
 * Permisos: admin o cajero (se controla en rutas).
 */
export async function cierreCaja(req, res) {
  try {
    const { desde, hasta } = req.query;

    // Rango por defecto: hoy
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const dDefault = `${yyyy}-${mm}-${dd}`;

    const d1 = (desde && /^\d{4}-\d{2}-\d{2}$/.test(desde)) ? desde : dDefault;
    const d2 = (hasta && /^\d{4}-\d{2}-\d{2}$/.test(hasta)) ? hasta : dDefault;

    const from = startOfDay(d1);
    const to   = endOfDay(d2);

    const ventas = await Venta.find({
      createdAt: { $gte: from, $lte: to }
    }).lean();

    // Totales generales
    let ventasCnt = ventas.length;
    let validas   = 0;
    let anuladas  = 0;
    let totalBruto = 0;
    let efectivoRec = 0;
    let cambioEnt   = 0;
    let netoCaja    = 0; // sum(efectivo - cambio) en válidas

    // Por cajero
    const por = new Map();
    const labelFor = (caj) => {
      // Si viene poblado (raro en este endpoint), usa usuario/username
      if (caj && typeof caj === 'object' && (caj.usuario || caj.username)) {
        return caj.usuario || caj.username;
      }
      // Si viene como string o ObjectId -> a string
      return caj ? String(caj) : '—';
    };

    for (const v of ventas) {
      const isAnulada = !!v.anulada;
      if (isAnulada) anuladas++; else validas++;

      const total  = Number(v.total)    || 0;
      const efect  = Number(v.efectivo) || 0;
      const camb   = Number(v.cambio)   || 0;

      totalBruto   += total;
      efectivoRec  += efect;
      cambioEnt    += camb;
      if (!isAnulada) netoCaja += (efect - camb);

      const key = v.cajero ? String(v.cajero) : 'null';
      const row = por.get(key) || {
        cajeroId: v.cajero || null,
        cajero: labelFor(v.cajero),
        ventas: 0, validas: 0, anuladas: 0,
        total: 0, efectivo: 0, cambio: 0, neto: 0
      };

      row.ventas   += 1;
      row.total    = round2(row.total + total);
      row.efectivo = round2(row.efectivo + efect);
      row.cambio   = round2(row.cambio + camb);
      if (isAnulada) row.anuladas += 1; else {
        row.validas += 1;
        row.neto    = round2(row.neto + (efect - camb));
      }

      por.set(key, row);
    }

    const out = {
      ok: true,
      rango: { desde: d1, hasta: d2, from, to },
      totales: {
        ventas: ventasCnt,
        validas,
        anuladas,
        totalBruto: round2(totalBruto),
        efectivoRecibido: round2(efectivoRec),
        cambioEntregado: round2(cambioEnt),
        netoCaja: round2(netoCaja),
      },
      porCajero: Array.from(por.values())
        .sort((a,b) => (b.neto - a.neto) || (b.total - a.total)),
    };

    return res.json(out);
  } catch (err) {
    console.error('cierreCaja error:', err);
    return res.status(500).json({ ok: false, message: 'Error obteniendo venta' });
  }
}
