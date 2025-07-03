// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Import Route files
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const postRoutes = require('./routes/post');
const notificationRoutes = require('./routes/notifications');

const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // ✅ serve images
// ✅ Middleware
app.use(cors());
app.use(express.json());           // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Route Registration
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api", userRoutes);
// ✅ Test Route
app.get("/", (req, res) => {
  res.send("API is working!");
});

const followRoutes = require('./routes/follow');
app.use('/api', followRoutes);

// ✅ Connect to MongoDB and Start Server
const PORT = process.env.PORT || 5000;

app.use('/api/notifications', notificationRoutes);
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    app.listen(PORT, () =>
      console.log(`✅ Server running on port ${PORT}`)
    )
  )
  .catch((err) => console.error("❌ DB Connection error:", err));

// ✅ Optional error handler for unexpected errors
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(500)
    .json({ msg: "Something went wrong. Please try again later." });
});
