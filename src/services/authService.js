const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

  // Generate JWT
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  // Remove sensitive fields before returning
  const { password_hash, ...userWithoutPassword } = user;

  return { accessToken, user: userWithoutPassword };
};