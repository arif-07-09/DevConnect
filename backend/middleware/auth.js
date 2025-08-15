// authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password"); // fetch user from DB
    if (!user) return res.status(404).json({ msg: "User not found" });

    req.user = user; // now req.user.about will work
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};
