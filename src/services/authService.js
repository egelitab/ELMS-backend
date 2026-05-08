const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../config/db");

exports.register = async (data) => {
  const { title, first_name, last_name, email, password, role } = data;

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (title, first_name, last_name, email, password_hash, role)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, title, email, first_name, last_name, role`,
    [title, first_name, last_name, email, hashedPassword, role]
  );

  return result.rows[0];
};

exports.login = async (email, password) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email=$1`,
    [email]
  );

  if (result.rows.length === 0) throw new Error("User not found");

  const user = result.rows[0];

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error("Invalid credentials");

  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15d" }
  );

  const { password_hash, ...userWithoutPassword } = user;

  try {
    const { logActivity } = require("./activityLogger");
    await logActivity(user.id, 'LOGIN', null, 'user');
  } catch (err) {
    console.error("Failed to log activity:", err);
  }

  return { accessToken, user: userWithoutPassword };
};

// ========================
// Password Reset Flow
// ========================

exports.requestPasswordReset = async (email) => {
  // 1. Find the user
  const result = await pool.query("SELECT id, email FROM users WHERE email = $1", [email]);
  if (result.rows.length === 0) {
    // Don't reveal whether the email exists — return silently
    return { message: "If that email is registered, a reset code has been generated." };
  }

  const user = result.rows[0];

  // 2. Generate a 6-digit code + secure token
  const resetCode = String(Math.floor(100000 + Math.random() * 900000));
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // 3. Invalidate any previous tokens for this user
  await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.id]);

  // 4. Store the reset token
  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, reset_code, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [user.id, hashedToken, resetCode, expiresAt]
  );

  // In production, you'd send this code via email.
  // For development, we return it in the response.
  console.log(`[DEV] Password reset code for ${email}: ${resetCode}`);

  return {
    message: "If that email is registered, a reset code has been generated.",
    // Include code in dev mode for testing (remove in production)
    resetCode,
    resetToken,
  };
};

exports.verifyResetCode = async (email, code) => {
  const result = await pool.query(
    `SELECT prt.*, u.email
     FROM password_reset_tokens prt
     JOIN users u ON prt.user_id = u.id
     WHERE u.email = $1 AND prt.reset_code = $2 AND prt.expires_at > NOW()`,
    [email, code]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid or expired reset code");
  }

  // Generate a short-lived confirmation token
  const confirmToken = jwt.sign(
    { userId: result.rows[0].user_id, purpose: "password_reset" },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  return { confirmToken };
};

exports.resetPassword = async (confirmToken, newPassword) => {
  // 1. Verify the confirmation token
  let decoded;
  try {
    decoded = jwt.verify(confirmToken, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error("Invalid or expired reset token");
  }

  if (decoded.purpose !== "password_reset") {
    throw new Error("Invalid token purpose");
  }

  // 2. Hash new password and update
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await pool.query(
    "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [hashedPassword, decoded.userId]
  );

  // 3. Clean up used tokens
  await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [decoded.userId]);

  return { message: "Password reset successfully" };
};