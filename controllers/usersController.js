import * as userService from "./../services/userService.js";
import {
  generateToken,
  setTokenCookie,
  clearTokenCookie,
} from "../middleware/authMiddleware.js";

export async function register(req, res, next) {
  try {
    const { email, password, timezone } = req.body;

    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.status = 400;
      return next(error);
    }

    if (password.length < 6) {
      const error = new Error("Password must be at least 6 characters long");
      error.status = 400;
      return next(error);
    }

    const validTimezone = timezone || "America/Bogota";

    const user = await userService.createUser(email, password, validTimezone);

    try {
      const token = generateToken(user);

      //set httpOnly cookie
      setTokenCookie(res, token);

      res.status(201).json({
        message: "User created successfully",
        user,
        token,
      });
    } catch (error) {
      next(error);
    }
  } catch (error) {
    if (error.message === "Email already exists") {
      error.status = 409;
    }
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.status = 400;
      return next(error);
    }

    const user = await userService.getUserByEmail(email);

    if (!user) {
      const error = new Error("Invalid credentials");
      error.status = 401;
      return next(error);
    }

    const isValidPassword = await userService.verifyPassword(
      password,
      user.passwordHash
    );

    if (!isValidPassword) {
      const error = new Error("Invalid credentials");
      error.status = 401;
      return next(error);
    }

    const token = generateToken(user);

    //set httpOnly cookie
    setTokenCookie(res, token);

    res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email, timezone: user.timezone },
      token,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    // Clear the token cookie
    clearTokenCookie(res);

    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserProfile(req, res, next) {
  try {
    const userId = req.apiUserId;

    const user = await userService.getUserById(userId);

    res.json({ user });
  } catch (error) {
    if (error.message === "User not found") {
      error.status = 404;
    }
    next(error);
  }
}

export async function getDashboard(req, res, next) {
  try {
    const userId = req.apiUserId;

    const dashboard = await userService.getUserDashboard(userId);

    res.json({ dashboard });
  } catch (error) {
    if (error.message === "User not found") {
      error.status = 404;
    }
    next(error);
  }
}
