"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.envValidation = void 0;
const Joi = __importStar(require("joi"));
exports.envValidation = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(4000),
    DB_TYPE: Joi.string().valid('postgres', 'sqlite', 'better-sqlite3').default('better-sqlite3'),
    DB_HOST: Joi.string().default('localhost'),
    DB_PORT: Joi.number().default(5432),
    DB_NAME: Joi.string().default('lenz'),
    DB_USER: Joi.string().default('postgres'),
    DB_PASS: Joi.string().default('postgres'),
    DB_PATH: Joi.string().default('./data/lenz.db'),
    DB_LOG: Joi.string().valid('true', 'false').default('false'),
    JWT_ACCESS_SECRET: Joi.string().default('lenz-access-secret-change-me'),
    JWT_REFRESH_SECRET: Joi.string().default('lenz-refresh-secret-change-me'),
    JWT_ACCESS_TTL: Joi.string().default('15m'),
    JWT_REFRESH_TTL: Joi.string().default('7d'),
    UPLOAD_DIR: Joi.string().default('./uploads'),
    MAX_FILE_SIZE: Joi.number().default(50_000_000),
    FRONTEND_URL: Joi.string().default('http://localhost:3000'),
});
//# sourceMappingURL=env.validation.js.map