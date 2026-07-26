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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const user_entity_1 = require("../users/user.entity");
let AuthService = AuthService_1 = class AuthService {
    userRepo;
    jwtService;
    config;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(userRepo, jwtService, config) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
        this.config = config;
    }
    async register(input) {
        const exists = await this.userRepo.findOne({
            where: [{ email: input.email }, { username: input.username }],
        });
        if (exists) {
            throw new common_1.ConflictException('email or username already in use');
        }
        const passwordHash = await bcrypt.hash(input.password, 12);
        const user = this.userRepo.create({
            username: input.username.toLowerCase(),
            email: input.email.toLowerCase(),
            password: passwordHash,
            fullName: input.fullName,
        });
        const saved = await this.userRepo.save(user);
        return this.buildPayload(saved);
    }
    async login(input) {
        const user = await this.userRepo
            .createQueryBuilder('u')
            .addSelect('u.password')
            .where('u.email = :email', { email: input.email.toLowerCase() })
            .getOne();
        if (!user) {
            throw new common_1.UnauthorizedException('invalid credentials');
        }
        const ok = await bcrypt.compare(input.password, user.password);
        if (!ok) {
            throw new common_1.UnauthorizedException('invalid credentials');
        }
        return this.buildPayload(user);
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('invalid or expired refresh token');
        }
        const user = await this.userRepo.findOne({ where: { id: payload.sub } });
        if (!user)
            throw new common_1.UnauthorizedException('user not found');
        return this.buildPayload(user);
    }
    async logout(userId) {
        await this.userRepo.update(userId, { refreshToken: '' });
        return true;
    }
    async buildPayload(user) {
        const payload = {
            sub: user.id,
            username: user.username,
            email: user.email,
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.config.get('JWT_ACCESS_SECRET'),
            expiresIn: this.config.get('JWT_ACCESS_TTL', '15m'),
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.config.get('JWT_REFRESH_SECRET'),
            expiresIn: this.config.get('JWT_REFRESH_TTL', '7d'),
        });
        const hashed = await bcrypt.hash(refreshToken, 10);
        await this.userRepo.update(user.id, { refreshToken: hashed });
        return { user, accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map