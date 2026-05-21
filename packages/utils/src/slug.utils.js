"use strict";
// packages/utils/src/slug.utils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = generateSlug;
exports.generateMediaSlug = generateMediaSlug;
exports.generatePersonSlug = generatePersonSlug;
/**
 * Genera un slug SEO-friendly desde cualquier texto.
 * Elimina acentos, caracteres especiales, convierte espacios a guiones.
 * REGLA: una vez que un slug está indexado, NUNCA cambiarlo.
 */
function generateSlug(text) {
    return text
        .toLowerCase()
        .normalize('NFD') // Descompone caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Elimina los diacríticos (acentos)
        .replace(/[^\p{L}\p{N}\s-]/gu, '') // Permite letras Unicode (incluyendo chino), números, espacios, guiones
        .trim()
        .replace(/\s+/g, '-') // Espacios → guión
        .replace(/-+/g, '-') // Guiones múltiples → uno solo
        .slice(0, 80); // Máximo 80 caracteres
}
/**
 * Para películas y series: agrega el año para desambiguar títulos repetidos.
 * Ejemplo: "batman" → "batman-1989" | "batman-2022"
 */
function generateMediaSlug(title, year) {
    var base = generateSlug(title);
    return year ? "".concat(base, "-").concat(year) : base;
}
/**
 * Para personas: usa el nombre completo.
 * Ejemplo: "Tom Hanks" → "tom-hanks"
 */
function generatePersonSlug(name) {
    return generateSlug(name);
}
// Ejemplo de uso:
// generateMediaSlug("Oppenheimer", 2023)   → "oppenheimer-2023"
// generateMediaSlug("El Señor de los Anillos", 2001) → "el-senor-de-los-anillos-2001"
// generatePersonSlug("Cillian Murphy") → "cillian-murphy"
