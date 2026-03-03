const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// Import routes
const authRoutes = require("./routes/authRoutes");
// You can add other routes later, e.g. coursesRoutes, materialsRoutes

const app = express();
const coursesRoutes = require("./routes/coursesRoutes");
app.use("/api/courses", coursesRoutes);

const testRoutes = require("./routes/testRoutes");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Routes
app.use("/api/auth", authRoutes);
// Example: app.use("/api/courses", coursesRoutes);


app.use("/api/test", testRoutes);

// Health check route
app.get("/", (req, res) => {
  res.send("ELMS API Running...");
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const courseRoutes = require("./routes/courseRoutes");

app.use("/api/courses", courseRoutes);

module.exports = app;