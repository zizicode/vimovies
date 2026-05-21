"use strict";
// packages/utils/src/date.utils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRuntime = formatRuntime;
exports.getYear = getYear;
exports.formatDate = formatDate;
exports.isoRuntime = isoRuntime;
var types_1 = require("@vimovies/types");
function formatRuntime(minutes, locale) {
    if (locale === void 0) { locale = types_1.SupportedLocale.ES; }
    if (!minutes || minutes <= 0)
        return null;
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    if (locale === types_1.SupportedLocale.EN) {
        return h
            ? "".concat(h, "h").concat(m ? " ".concat(m, "m") : '')
            : "".concat(m, "m");
    }
    return h
        ? "".concat(h, "h").concat(m ? " ".concat(m, "min") : '')
        : "".concat(m, "min");
}
function getYear(dateStr) {
    var year = Number(dateStr === null || dateStr === void 0 ? void 0 : dateStr.split('-')[0]);
    return Number.isNaN(year) ? null : year;
}
function formatDate(dateStr, locale) {
    if (locale === void 0) { locale = types_1.SupportedLocale.ES; }
    if (!dateStr)
        return null;
    var date = new Date(dateStr);
    return Number.isNaN(date.getTime())
        ? null
        : date.toLocaleDateString(locale === types_1.SupportedLocale.EN
            ? 'en-US'
            : 'es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
}
function isoRuntime(minutes) {
    if (!minutes || minutes <= 0)
        return null;
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    return "PT".concat(h ? "".concat(h, "H") : '').concat(m ? "".concat(m, "M") : '');
}
