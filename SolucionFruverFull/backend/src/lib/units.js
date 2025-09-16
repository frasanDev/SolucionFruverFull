// backend/src/lib/units.js
// Base de peso: kilogramo (kg). Para conteo, se usa "unit" (pieza/paquete).
const LB_TO_KG = 0.45359237;

// ¿La unidad es de peso?
export const isWeightUnit = (unit) => unit === 'kg' || unit === 'lb';

// Convierte una cantidad desde su unidad a la base (kg para peso, unit para conteo)
export function toBase(qty, unit) {
  if (!Number.isFinite(qty)) throw new Error('Cantidad inválida');
  if (isWeightUnit(unit)) return qty * (unit === 'kg' ? 1 : LB_TO_KG);
  // Para unidades por pieza/paquete, la base es la misma cantidad
  return qty;
}

// Convierte desde base a la unidad solicitada (útil para mostrar)
export function fromBase(qtyBase, unit) {
  if (!Number.isFinite(qtyBase)) throw new Error('Cantidad base inválida');
  if (isWeightUnit(unit)) return qtyBase / (unit === 'kg' ? 1 : LB_TO_KG);
  return qtyBase;
}

// Redondea cantidades de stock de peso a 3 decimales (ej. 0.289 kg)
export function normalizeQty(qty) {
  return Math.round((qty + Number.EPSILON) * 1000) / 1000;
}

// Valida la cantidad según tipo de unidad:
// - Peso (kg/lb): decimales positivos razonables
// - Conteo (unit/pack): enteros positivos
export function validateQty(qty, unit) {
  if (!Number.isFinite(qty) || qty <= 0) return false;
  if (isWeightUnit(unit)) return qty <= 100; // límite razonable por ítem
  return Number.isInteger(qty) && qty <= 100000;
}

// Calcula total a pagar a partir de precio base POR KG
// Nota: asumimos que en productos de peso el campo "precio" es COP/KG.
// Si el cajero ingresa en lb, convertimos a kg antes de multiplicar.
export function totalForInput(pricePerKg, inputUnit, inputQty) {
  if (!Number.isFinite(pricePerKg) || pricePerKg < 0) throw new Error('Precio inválido');
  const qtyKg = isWeightUnit(inputUnit) ? toBase(inputQty, inputUnit) : inputQty;
  const total = pricePerKg * qtyKg;
  return Math.round(total * 100) / 100; // 2 decimales para dinero
}

// Precio equivalente por libra si tu UI lo necesita mostrar
export function pricePerLbFromKg(pricePerKg) {
  return Math.round((pricePerKg * LB_TO_KG) * 100) / 100;
}
