
require("dotenv").config();

const express = require("express");
const path = require("path");
const db = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/budgets", require("./routes/budgets"));

app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            status: "ok",
            database: "connected",
            message: "SpendWise API is running."
        });
    } catch (error) {
        console.error("Database health check failed:", error.message);

        res.status(500).json({
            status: "error",
            database: "disconnected",
            message: "Database connection failed."
        });
    }
});

async function startServer() {
    try {
        await db.query("SELECT 1");

        app.listen(PORT, "0.0.0.0", () => {
    console.log(`SpendWise is running on port ${PORT}`);
});
    } catch (error) {
        console.error("Could not connect to the database:", error.message);
        process.exitCode = 1;
    }
}

startServer();
