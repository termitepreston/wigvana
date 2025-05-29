import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authService } from "../../../src/services/auth.service.js";
import User from "../../../src/models/User.model.js";
import { redisService } from "../../../src/services/redis.service.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../../src/config/index.js";
import ApiError from "../../../src/errors/ApiError.js";

// Mock dependencies
vi.mock("../../../src/models/User.model.js");
vi.mock("../../../src/services/redis.service.js");
vi.mock("bcryptjs");
vi.mock("jsonwebtoken");
vi.mock("../../../src/utils/logger.js", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Auth Service", () => {
  beforeEach(() => {
    vi.resetAllMocks(); // Reset mocks before each test
  });

  describe("registerUser", () => {
    it("should register a new user and return tokens", async () => {
      const userData = {
        firstName: "Unit",
        lastName: "Tester",
        email: "unit@example.com",
        password: "password123",
      };
      const mockUserInstance = {
        id: "mockUserId",
        ...userData,
        emailVerified: false,
        accountStatus: "pending_verification",
        emailVerificationToken: "mockVerificationToken",
        toObject: vi.fn().mockReturnValue({
          id: "mockUserId",
          ...userData,
          emailVerified: false,
        }), // Mock toObject
      };

      User.findOne.mockResolvedValue(null); // No existing user
      User.create.mockResolvedValue(mockUserInstance);
      bcrypt.hash.mockResolvedValue("hashedPassword");
      jwt.sign.mockImplementation((payload, secret, options) => {
        if (
          options.expiresIn === `${config.JWT_REFRESH_TOKEN_EXPIRATION_DAYS}d`
        )
          return "mockRefreshToken";
        return "mockAccessToken";
      });
      redisService.set.mockResolvedValue("OK");

      const result = await authService.registerUser(userData);

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
          passwordHash: "hashedPassword",
          accountStatus: "pending_verification",
        }),
      );
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining("refreshToken:mockUserId:"),
        "true",
        expect.any(Number),
      );
      expect(result.user.email).toBe(userData.email);
      expect(result.accessToken).toBe("mockAccessToken");
      expect(result.refreshToken).toBe("mockRefreshToken");
    });

    it("should throw ApiError if email is already taken", async () => {
      const userData = { email: "taken@example.com", password: "password" };
      User.findOne.mockResolvedValue({
        id: "existingUserId",
        email: "taken@example.com",
      }); // User exists

      await expect(authService.registerUser(userData)).rejects.toThrow(
        ApiError,
      );
      await expect(authService.registerUser(userData)).rejects.toMatchObject({
        message: "Email already taken",
        statusCode: 400,
      });
    });
  });

  // ... More unit tests for loginUser, refreshAccessToken, logoutUser, verifyEmail
  // Example for verifyEmail:
  describe("verifyEmail", () => {
    it("should verify email and update user status", async () => {
      const mockUser = {
        id: "userIdToVerify",
        emailVerificationToken: "validToken123",
        emailVerified: false,
        accountStatus: "pending_verification",
        save: vi.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(mockUser);

      await authService.verifyEmail("validToken123");

      expect(User.findOne).toHaveBeenCalledWith({
        emailVerificationToken: "validToken123",
        emailVerificationTokenExpiresAt: { $gt: expect.any(Date) },
      });
      expect(mockUser.emailVerified).toBe(true);
      expect(mockUser.accountStatus).toBe("active");
      expect(mockUser.emailVerificationToken).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should throw ApiError for invalid or expired token", async () => {
      User.findOne.mockResolvedValue(null); // Token not found or expired

      await expect(
        authService.verifyEmail("invalidOrExpiredToken"),
      ).rejects.toThrow(ApiError);
      await expect(
        authService.verifyEmail("invalidOrExpiredToken"),
      ).rejects.toMatchObject({
        message: "Invalid or expired email verification token.",
        statusCode: 400,
      });
    });
  });
});
