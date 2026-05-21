"use strict";
// packages/utils/src/locale.utils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalized = getLocalized;
exports.detectLocaleFromHeader = detectLocaleFromHeader;
var types_1 = require("@vimovies/types");
/**
 * Obtiene un campo localizado con fallback a español.
 */
function getLocalized(obj, field, locale) {
    var _a;
    if (locale === void 0) { locale = types_1.SupportedLocale.ES; }
    var value = obj["".concat(field, "_").concat(locale)];
    var fallback = obj["".concat(field, "_es")];
    return ((_a = value !== null && value !== void 0 ? value : fallback) !== null && _a !== void 0 ? _a : null);
}
/**
 * Detecta locale desde Accept-Language.
 */
function detectLocaleFromHeader(acceptLanguage) {
    var _a, _b;
    var primary = (_b = (_a = acceptLanguage === null || acceptLanguage === void 0 ? void 0 : acceptLanguage.split(',')[0]) === null || _a === void 0 ? void 0 : _a.split('-')[0]) === null || _b === void 0 ? void 0 : _b.toLowerCase();
    return primary === types_1.SupportedLocale.EN
        ? types_1.SupportedLocale.EN
        : types_1.SupportedLocale.ES;
}
