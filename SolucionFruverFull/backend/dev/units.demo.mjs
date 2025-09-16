import { toBase, totalForInput, pricePerLbFromKg } from '../src/lib/units.js';

// Demo: 0.289 lb, precio 8,000 COP/KG
const qtyLb = 0.289;
const pricePerKg = 8000;

const qtyKg = toBase(qtyLb, 'lb');
const total = totalForInput(pricePerKg, 'lb', qtyLb);
const pricePerLb = pricePerLbFromKg(pricePerKg);

console.log('0.289 lb en kg =', qtyKg);
console.log('Precio por lb (derivado) =', pricePerLb, 'COP/lb');
console.log('Total a pagar para 0.289 lb =', total, 'COP');
