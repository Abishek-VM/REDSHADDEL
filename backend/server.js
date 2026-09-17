const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");
const seedProducts = require("./config/seedProducts");
const seedAdmin = require("./config/seedAdmin");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

connectDB().then(seedProducts).then(seedAdmin).catch((error) => {
  console.error(`Startup error: ${error.message}`);
});

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "RedShaddel Clothing API is running"
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});