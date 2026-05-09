const jwt = require("jsonwebtoken");

const authMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: No token provided",
        });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded;

      // Auto-log heartbeat to track "online" status for active users
      try {
        const { logActivity } = require("../services/activityLogger");
        // We use a non-blocking call here so auth doesn't slow down
        logActivity(req.user.id, 'HEARTBEAT', null, 'user', req.ip);
      } catch (err) {
        // Silent catch to ensure auth still works even if logging fails
      }

      // Role Check Logic
      // If allowedRoles is empty, anyone with a valid token gets through.
      // If roles are specified, check if the user's role matches.
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: You do not have the required permissions (${allowedRoles.join(", ")})`,
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  };
};

module.exports = authMiddleware;