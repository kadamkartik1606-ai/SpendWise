
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get all monthly budgets
router.get("/", async (req, res) => {
    try {
        const [budgets] = await db.query(
            "SELECT * FROM budgets ORDER BY budget_month DESC"
        );

        res.json(budgets);
    } catch (error) {
        console.error("Error fetching budgets:", error.message);
        res.status(500).json({ message: "Failed to fetch budgets." });
    }
});

// Create or update a monthly budget
router.post("/", async (req, res) => {
    try {
        const { budget_month, amount } = req.body;

        if (
            typeof budget_month !== "string" ||
            !/^\d{4}-(0[1-9]|1[0-2])$/.test(budget_month) ||
            amount === "" ||
            amount === null ||
            amount === undefined ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0
        ) {
            return res.status(400).json({
                message: "Provide a valid month and positive budget amount."
            });
        }

        await db.query(
            `INSERT INTO budgets (budget_month, amount)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
            [budget_month, Number(amount)]
        );

        const [rows] = await db.query(
            "SELECT * FROM budgets WHERE budget_month = ?",
            [budget_month]
        );

        res.json(rows[0]);
    } catch (error) {
        console.error("Error saving budget:", error.message);
        res.status(500).json({ message: "Failed to save budget." });
    }
});

module.exports = router;
