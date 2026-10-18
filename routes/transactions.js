
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get all transactions
router.get("/", async (req, res) => {
    try {
        const [transactions] = await db.query(
            "SELECT * FROM transactions ORDER BY transaction_date DESC, id DESC"
        );

        res.json(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error.message);
        res.status(500).json({ message: "Failed to fetch transactions." });
    }
});

// Add a transaction
router.post("/", async (req, res) => {
    try {
        const { description, category, amount, type, transaction_date } = req.body;

        if (
            typeof description !== "string" ||
            !description.trim() ||
            description.trim().length > 100 ||
            typeof category !== "string" ||
            !category.trim() ||
            category.trim().length > 50 ||
            !["income", "expense"].includes(type) ||
            amount === "" ||
            amount === null ||
            amount === undefined ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0 ||
            !/^\d{4}-\d{2}-\d{2}$/.test(transaction_date || "")
        ) {
            return res.status(400).json({
                message: "Please provide valid transaction details."
            });
        }

        const [result] = await db.query(
            `INSERT INTO transactions
            (description, category, amount, type, transaction_date)
            VALUES (?, ?, ?, ?, ?)`,
            [
                description.trim(),
                category.trim(),
                Number(amount),
                type,
                transaction_date
            ]
        );

        const [rows] = await db.query(
            "SELECT * FROM transactions WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json(rows[0]);
    } catch (error) {
        console.error("Error adding transaction:", error.message);
        res.status(500).json({ message: "Failed to add transaction." });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { description, category, amount, type, transaction_date } = req.body;

        if (
            !Number.isInteger(id) || id <= 0 ||
            typeof description !== "string" ||
            !description.trim() || description.trim().length > 100 ||
            typeof category !== "string" ||
            !category.trim() || category.trim().length > 50 ||
            !["income", "expense"].includes(type) ||
            amount === "" || amount === null || amount === undefined ||
            !Number.isFinite(Number(amount)) || Number(amount) <= 0 ||
            !/^\d{4}-\d{2}-\d{2}$/.test(transaction_date || "")
        ) {
            return res.status(400).json({
                message: "Please provide valid transaction details."
            });
        }

        const [result] = await db.query(
            `UPDATE transactions
             SET description = ?, category = ?, amount = ?,
                 type = ?, transaction_date = ?
             WHERE id = ?`,
            [
                description.trim(),
                category.trim(),
                Number(amount),
                type,
                transaction_date,
                id
            ]
        );

        if (result.affectedRows === 0) {
            const [existing] = await db.query(
                "SELECT id FROM transactions WHERE id = ?",
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    message: "Transaction not found."
                });
            }
        }

        const [rows] = await db.query(
            "SELECT * FROM transactions WHERE id = ?",
            [id]
        );

        res.json(rows[0]);
    } catch (error) {
        console.error("Error updating transaction:", error.message);
        res.status(500).json({
            message: "Failed to update transaction."
        });
    }
});

// Delete a transaction
router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid transaction ID."
            });
        }

        const [result] = await db.query(
            "DELETE FROM transactions WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Transaction not found."
            });
        }

        res.json({ message: "Transaction deleted successfully." });
    } catch (error) {
        console.error("Error deleting transaction:", error.message);
        res.status(500).json({ message: "Failed to delete transaction." });
    }
});

module.exports = router;
