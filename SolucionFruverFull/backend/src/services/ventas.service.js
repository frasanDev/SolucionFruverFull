// backend/src/services/ventas.service.js
import ProductoNS from '../models/Product.js';
const Producto = ProductoNS.default || ProductoNS; // compat CJS/ESM

import Venta from '../models/Venta.model.js';
import { nextSequence } from '../lib/sequence.js';
import { isWeightUnit, toBase, normalizeQty } from '../lib/units.js';
import mongoose from 'mongoose';

// Crear venta (admite kg/lb/unit), normaliza kg a 3 decimales y redondea dinero a 2 decimales
export async function crearVentaService({ userId, productos = [], efectivo = 0 }) {
  if (!Array.isArray(productos) || productos.length === 0) {
    throw new Error('Debe enviar productos para la venta');
  }

  const items = [];
  let subtotal = 0;

  for (const p of productos) {
    const { productoId, cantidad, unidad } = p;
    if (!productoId || !Number.isFinite(cantidad) || cantidad <= 0) {
      throw new Error('Ítem inválido en la venta');
    }

    const prod = await Producto.findById(productoId);
    if (!prod) throw new Error('Producto no encontrado');

    const unidadProducto = prod.unidadBase || 'unit';
    const unidadIngresada = unidad || unidadProducto;

    let precioUnitarioEfectivo = 0;
    let precioBaseKg = 0;
    let cantidadKg = 0;
    let totalItem = 0;

    if (isWeightUnit(unidadProducto)) {
      // precio por KG
      const pricePerKg = Number(prod.precio) || 0;
      precioBaseKg = pricePerKg;

      // convertir a kg exactos y normalizar a 3 decimales para cuadrar con stock
      const qtyKgRaw = toBase(cantidad, unidadIngresada);
      const qtyKgNorm = normalizeQty(qtyKgRaw);
      cantidadKg = qtyKgNorm;

      // validar stock con cantidad NORMALIZADA
      const stockKgActual = Number(prod.stock);
      if (!Number.isFinite(stockKgActual) || stockKgActual < qtyKgNorm) {
        throw new Error(`Stock insuficiente para ${prod.nombre}`);
      }

      totalItem = Math.round(pricePerKg * qtyKgNorm * 100) / 100;
      precioUnitarioEfectivo = pricePerKg;
    } else {
      // conteo por unidad/pack
      const pricePerUnit = Number(prod.precio) || 0;
      precioUnitarioEfectivo = pricePerUnit;
      totalItem = Math.round(pricePerUnit * cantidad * 100) / 100;

      const stockActual = Number(prod.stock);
      if (!Number.isFinite(stockActual) || stockActual < cantidad) {
        throw new Error(`Stock insuficiente para ${prod.nombre}`);
      }
    }

    subtotal += totalItem;

    items.push({
      producto: prod._id,
      nombre: prod.nombre,
      unidad: unidadProducto,     // base del producto (kg/lb/unit/pack)
      precioBaseKg,
      precioUnitario: precioUnitarioEfectivo,
      cantidadIngresada: cantidad,
      unidadIngresada,
      cantidadKg,                 // 0 para unit/pack
      totalItem,
    });
  }

  subtotal = Math.round(subtotal * 100) / 100;
  const total = subtotal;
  const cambio = Math.max(0, Math.round((Number(efectivo || 0) - total) * 100) / 100);

  // ---------- Intentar con transacción y, si no se puede, fallback sin transacción ----------
  let venta;
  let session;
  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // Descuento de stock con condición de suficiencia
      for (const it of items) {
        const prod = await Producto.findById(it.producto).session(session);
        if (!prod) throw new Error('Producto no encontrado');

        if (isWeightUnit(prod.unidadBase || 'unit')) {
          const qtyKg = it.cantidadKg;
          const dec = await Producto.updateOne(
            { _id: prod._id, stock: { $gte: qtyKg } },
            { $inc: { stock: -qtyKg } },
            { session }
          );
          if (dec.modifiedCount === 0) {
            throw new Error(`Stock insuficiente para ${prod.nombre}`);
          }
        } else {
          const qty = it.cantidadIngresada;
          const dec = await Producto.updateOne(
            { _id: prod._id, stock: { $gte: qty } },
            { $inc: { stock: -qty } },
            { session }
          );
          if (dec.modifiedCount === 0) {
            throw new Error(`Stock insuficiente para ${prod.nombre}`);
          }
        }
      }

      const factura = await nextSequence('sale');
      venta = await Venta.create([{
        factura,
        cajero: userId || null,
        items,
        subtotal,
        total,
        efectivo: Number(efectivo || 0),
        cambio,
        anulada: false,
        anuladoPor: null,
        anuladoAt: null,
        motivoAnulacion: '',
      }], { session }).then(r => r[0]);
    });
    session.endSession();
  } catch (err) {
    if (session) session.endSession();

    // Si el servidor no soporta transacciones (standalone), usar fallback con rollback manual
    const msg = String(err && err.message || err);
    const noTx =
      msg.includes('Transaction numbers are only allowed') ||
      msg.includes('does not support transactions') ||
      msg.toLowerCase().includes('replica set');

    if (!noTx) throw err;

    // Fallback: aplicar $inc condicional por ítem y hacer rollback manual si algo falla
    const applied = []; // { id, qty } en kg o unidades según corresponda
    try {
      for (const it of items) {
        const prod = await Producto.findById(it.producto);
        if (!prod) throw new Error('Producto no encontrado');

        if (isWeightUnit(prod.unidadBase || 'unit')) {
          const qtyKg = it.cantidadKg;
          const dec = await Producto.updateOne(
            { _id: prod._id, stock: { $gte: qtyKg } },
            { $inc: { stock: -qtyKg } }
          );
          if (dec.modifiedCount === 0) {
            throw new Error(`Stock insuficiente para ${prod.nombre}`);
          }
          applied.push({ id: prod._id, qty: qtyKg });
        } else {
          const qty = it.cantidadIngresada;
          const dec = await Producto.updateOne(
            { _id: prod._id, stock: { $gte: qty } },
            { $inc: { stock: -qty } }
          );
          if (dec.modifiedCount === 0) {
            throw new Error(`Stock insuficiente para ${prod.nombre}`);
          }
          applied.push({ id: prod._id, qty });
        }
      }

      const factura = await nextSequence('sale');
      venta = await Venta.create({
        factura,
        cajero: userId || null,
        items,
        subtotal,
        total,
        efectivo: Number(efectivo || 0),
        cambio,
        anulada: false,
        anuladoPor: null,
        anuladoAt: null,
        motivoAnulacion: '',
      });
    } catch (e) {
      // rollback manual de los $inc aplicados
      for (const a of applied.reverse()) {
        await Producto.updateOne({ _id: a.id }, { $inc: { stock: a.qty } });
      }
      throw e;
    }
  }

  return venta;
}

// Anular venta (solo admin): revierte stock y marca campos de anulación
export async function anularVentaService({ ventaId, userId, motivo = '' }) {
  const venta = await Venta.findById(ventaId);
  if (!venta) throw new Error('Venta no encontrada');
  if (venta.anulada) throw new Error('La venta ya está anulada');

  // Reversar stock
  for (const it of venta.items) {
    const prod = await Producto.findById(it.producto);
    if (!prod) continue;

    if (isWeightUnit(prod.unidadBase || 'unit')) {
      const qtyKg = Number(it.cantidadKg || 0);
      if (qtyKg > 0) {
        await Producto.updateOne({ _id: prod._id }, { $inc: { stock: qtyKg } });
      }
    } else {
      const qty = Number(it.cantidadIngresada || 0);
      if (qty > 0) {
        await Producto.updateOne({ _id: prod._id }, { $inc: { stock: qty } });
      }
    }
  }

  // Persistir anulación de forma robusta aunque el schema estuviera desactualizado
  await Venta.updateOne(
    { _id: venta._id },
    {
      $set: {
        anulada: true,
        anuladoPor: userId || null,
        anuladoAt: new Date(),
        motivoAnulacion: String(motivo || ''),
      },
    },
    { strict: false }
  );

  // Devolver la versión actualizada
  const ventaActualizada = await Venta.findById(venta._id).populate('cajero', 'usuario');
  return ventaActualizada;
}
