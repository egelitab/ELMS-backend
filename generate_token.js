const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const token = jwt.sign({ id: "ac7400fc-0e97-4848-b386-dc69deab2271", role: "instructor" }, process.env.JWT_SECRET);
console.log(token);
