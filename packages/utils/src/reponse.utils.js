"use strict";
// packages/utils/src/lib/response.ts
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.fail = fail;
exports.notFound = notFound;
exports.serverError = serverError;
exports.paginated = paginated;
/**
 * Success response
 */
function ok(c, data, status, message) {
    if (status === void 0) { status = 200; }
    return c.json(__assign({ success: true, status: status, data: data }, (message && { message: message })), status);
}
/**
 * Generic fail response
 */
function fail(c, error, status) {
    if (error === void 0) { error = 'Bad request'; }
    if (status === void 0) { status = 400; }
    return c.json({
        success: false,
        status: status,
        data: null,
        error: error,
    }, status);
}
/**
 * Not found response
 */
function notFound(c, entity) {
    if (entity === void 0) { entity = 'Recurso'; }
    return fail(c, "".concat(entity, " no encontrado"), 404);
}
/**
 * Internal server error response
 */
function serverError(c, err) {
    return c.json({
        success: false,
        status: 500,
        data: null,
        error: err instanceof Error
            ? err.message
            : 'Internal server error',
    }, 500);
}
/**
 * Paginated response
 */
function paginated(c, data, total, page, per_page, status) {
    if (page === void 0) { page = 1; }
    if (per_page === void 0) { per_page = 20; }
    if (status === void 0) { status = 200; }
    return c.json({
        success: true,
        status: status,
        data: data,
        pagination: {
            total: total,
            page: page,
            per_page: per_page,
            total_pages: Math.ceil(total / per_page),
        },
    }, status);
}
