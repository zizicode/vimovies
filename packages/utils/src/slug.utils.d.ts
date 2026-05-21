/**
 * Genera un slug SEO-friendly desde cualquier texto.
 * Elimina acentos, caracteres especiales, convierte espacios a guiones.
 * REGLA: una vez que un slug está indexado, NUNCA cambiarlo.
 */
export declare function generateSlug(text: string): string;
/**
 * Para películas y series: agrega el año para desambiguar títulos repetidos.
 * Ejemplo: "batman" → "batman-1989" | "batman-2022"
 */
export declare function generateMediaSlug(title: string, year?: number | null): string;
/**
 * Para personas: usa el nombre completo.
 * Ejemplo: "Tom Hanks" → "tom-hanks"
 */
export declare function generatePersonSlug(name: string): string;
