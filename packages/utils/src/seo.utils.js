"use strict";
// packages/utils/src/seo.utils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMediaTitle = buildMediaTitle;
exports.buildGenreTitle = buildGenreTitle;
exports.buildPersonTitle = buildPersonTitle;
exports.buildPlatformTitle = buildPlatformTitle;
exports.truncateForMeta = truncateForMeta;
var types_1 = require("@vimovies/types");
var locale_utils_1 = require("./locale.utils");
var SITE_NAME = 'Vimovies';
function buildMediaTitle(media, locale) {
    var _a, _b;
    if (locale === void 0) { locale = types_1.SupportedLocale.ES; }
    var title = (_a = (0, locale_utils_1.getLocalized)(media, 'title', locale)) !== null && _a !== void 0 ? _a : (locale === types_1.SupportedLocale.EN ? 'Movie' : 'Película');
    var year = (_b = media.release_date) === null || _b === void 0 ? void 0 : _b.split('-')[0];
    var yearStr = year ? " (".concat(year, ")") : '';
    return locale === types_1.SupportedLocale.EN
        ? "".concat(title).concat(yearStr, " \u2014 Where to Watch & Review | ").concat(SITE_NAME)
        : "".concat(title).concat(yearStr, " \u2014 D\u00F3nde Ver y Rese\u00F1a | ").concat(SITE_NAME);
}
function buildGenreTitle(genre, locale) {
    var _a;
    if (locale === void 0) { locale = types_1.SupportedLocale.ES; }
    var name = (_a = (0, locale_utils_1.getLocalized)(genre, 'name', locale)) !== null && _a !== void 0 ? _a : (locale === types_1.SupportedLocale.EN ? 'Genre' : 'Género');
    var year = new Date().getFullYear();
    return locale === types_1.SupportedLocale.EN
        ? "".concat(name, " Movies \u2014 The Best of ").concat(year, " | ").concat(SITE_NAME)
        : "Pel\u00EDculas de ".concat(name, " \u2014 Las Mejores de ").concat(year, " | ").concat(SITE_NAME);
}
function buildPersonTitle(name, locale) {
    if (locale === void 0) { locale = types_1.SupportedLocale.ES; }
    return locale === types_1.SupportedLocale.EN
        ? "".concat(name, " \u2014 Complete Filmography | ").concat(SITE_NAME)
        : "".concat(name, " \u2014 Filmograf\u00EDa Completa | ").concat(SITE_NAME);
}
function buildPlatformTitle(platform, locale) {
    var _a;
    if (locale === void 0) { locale = types_1.SupportedLocale.ES; }
    var name = (_a = (0, locale_utils_1.getLocalized)(platform, 'name', locale)) !== null && _a !== void 0 ? _a : (locale === types_1.SupportedLocale.EN
        ? 'Platform'
        : 'Plataforma');
    return locale === types_1.SupportedLocale.EN
        ? "What to Watch on ".concat(name, " \u2014 Full Catalog | ").concat(SITE_NAME)
        : "Qu\u00E9 Ver en ".concat(name, " \u2014 Cat\u00E1logo Completo | ").concat(SITE_NAME);
}
function truncateForMeta(text, maxLength) {
    if (maxLength === void 0) { maxLength = 160; }
    if (text.length <= maxLength)
        return text;
    var truncated = text.slice(0, maxLength - 3);
    return "".concat(truncated.slice(0, truncated.lastIndexOf(' ')), "...");
}
