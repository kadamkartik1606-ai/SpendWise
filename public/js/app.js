"use strict";

/* SpendWise - Frontend JavaScript */

// 1. Currency formatting
const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

function formatCurrency(amount) {
    return currencyFormatter.format(amount);
}

// 2. Date helpers
function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getMonthString(date = new Date()) {
    return getLocalDateString(date).slice(0, 7);
}

function formatDate(dateString) {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString(
        "en-IN",
        { day: "2-digit", month: "short", year: "numeric" }
    );
}

// 3. Categories
const expenseCategories = [
    { value: "Food", label: "Food and Groceries" },
    { value: "Transport", label: "Transportation" },
    { value: "Housing", label: "Housing and Rent" },
    { value: "Bills", label: "Bills and Utilities" },
    { value: "Health", label: "Healthcare" },
    { value: "Education", label: "Education" },
    { value: "Shopping", label: "Shopping" },
    { value: "Entertainment", label: "Entertainment" },
    { value: "Other", label: "Other" }
];

const incomeCategories = [
    { value: "Salary", label: "Salary" },
    { value: "Freelance", label: "Freelance Income" },
    { value: "Other", label: "Other Income" }
];

// 4. Database-backed application data
let transactions = [];
let monthlyBudget = 0;
let editingTransactionId = null;
let selectedBudgetMonth = getMonthString();
let categoryChart = null;
let spendingChart = null;

// 5. HTML elements
const transactionForm = document.getElementById("transactionForm");
const transactionTypeInput = document.getElementById("transactionType");
const transactionDescriptionInput =
    document.getElementById("transactionDescription");
const transactionCategoryInput =
    document.getElementById("transactionCategory");
const transactionAmountInput =
    document.getElementById("transactionAmount");
const transactionDateInput = document.getElementById("transactionDate");
const formMessage = document.getElementById("formMessage");

const totalIncomeDisplay = document.getElementById("totalIncome");
const totalExpensesDisplay = document.getElementById("totalExpenses");
const balanceDisplay = document.getElementById("balance");
const monthlyBudgetDisplay = document.getElementById("monthlyBudget");

const budgetForm = document.getElementById("budgetForm");
const budgetMonthInput = document.getElementById("budgetMonth");
const budgetAmountInput = document.getElementById("budgetAmount");
const budgetMessage = document.getElementById("budgetMessage");
const budgetProgress = document.getElementById("budgetProgress");
const budgetProgressTrack = document.getElementById("budgetProgressTrack");

const transactionRows = document.getElementById("transactionRows");
const transactionMessage = document.getElementById("transactionMessage");

const searchInput = document.getElementById("searchTransaction");
const filterTypeInput = document.getElementById("filterType");
const filterCategoryInput = document.getElementById("filterCategory");
const filterForm = document.getElementById("filterForm");

const alertsContainer = document.getElementById("alertsContainer");
const categoryChartMessage = document.getElementById("categoryChartMessage");
const spendingChartMessage = document.getElementById("spendingChartMessage");

// 6. API helper
async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data;
}

// Convert database fields into the format used by the dashboard.
function normalizeTransaction(row) {
    let date = row.transaction_date;

    if (date instanceof Date) {
        date = getLocalDateString(date);
    } else {
        date = String(date).slice(0, 10);
    }

    return {
        id: Number(row.id),
        description: row.description,
        category: row.category,
        amount: Number(row.amount),
        type: row.type,
        date
    };
}

// 7. Initial form values
budgetMonthInput.value = selectedBudgetMonth;
budgetAmountInput.value = 25000;
transactionDateInput.value = getLocalDateString();

// 8. Update category options
function updateCategoryOptions() {
    const categories = transactionTypeInput.value === "income"
        ? incomeCategories
        : expenseCategories;

    const previousValue = transactionCategoryInput.value;
    transactionCategoryInput.replaceChildren();

    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.value;
        option.textContent = category.label;
        transactionCategoryInput.appendChild(option);
    });

    if (categories.some((category) => category.value === previousValue)) {
        transactionCategoryInput.value = previousValue;
    }
}

transactionTypeInput.addEventListener("change", updateCategoryOptions);

// 9. Chart colours
const chartColors = [
    "#237a63", "#579c83", "#e7b66a",
    "#e58b70", "#8d83c7", "#75a9ce",
    "#d4a4c7", "#9ca9a0", "#bcc8c1"
];

function getLastSixMonths() {
    const months = [];

    for (let offset = 5; offset >= 0; offset--) {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() - offset);

        months.push({
            key: getMonthString(date),
            label: date.toLocaleDateString("en-IN", {
                month: "short",
                year: "2-digit"
            })
        });
    }

    return months;
}

// 10. Initialize charts
function initializeCharts() {
    const categoryCanvas = document.getElementById("categoryChart");
    const spendingCanvas = document.getElementById("spendingChart");

    if (typeof Chart === "undefined") {
        categoryChartMessage.textContent =
            "Charts could not load. Check your internet connection.";
        spendingChartMessage.textContent =
            "Charts could not load. Check your internet connection.";
        return;
    }

    categoryChart = new Chart(categoryCanvas, {
        type: "doughnut",
        data: {
            labels: expenseCategories.map((category) => category.label),
            datasets: [{
                data: expenseCategories.map(() => 0),
                backgroundColor: chartColors,
                borderColor: "#ffffff",
                borderWidth: 3,
                hoverOffset: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            return `${context.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            }
        }
    });

    spendingChart = new Chart(spendingCanvas, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Monthly Expenses",
                data: [],
                borderColor: "#237a63",
                backgroundColor: "rgba(35, 122, 99, 0.12)",
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label(context) {
                            return `Expenses: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback(value) {
                            return new Intl.NumberFormat("en-IN", {
                                notation: "compact",
                                maximumFractionDigits: 1
                            }).format(value);
                        }
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}
// 11. Get transactions for the selected month
function getMonthlyTransactions(month) {
    return transactions.filter((transaction) =>
        transaction.date.startsWith(month)
    );
}

function calculateTotals(monthTransactions) {
    const income = monthTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);

    const expenses = monthTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);

    return {
        income,
        expenses,
        balance: income - expenses
    };
}

// 12. Update dashboard summary
function updateSummary() {
    const monthTransactions = getMonthlyTransactions(selectedBudgetMonth);
    const totals = calculateTotals(monthTransactions);

    totalIncomeDisplay.textContent = formatCurrency(totals.income);
    totalExpensesDisplay.textContent = formatCurrency(totals.expenses);
    balanceDisplay.textContent = formatCurrency(totals.balance);
    monthlyBudgetDisplay.textContent = formatCurrency(monthlyBudget);

    updateBudget(totals.expenses);
    updateAlerts(totals.expenses);
}

// 13. Budget progress
function updateBudget(expenses) {
    const percentage = monthlyBudget > 0
        ? Math.round((expenses / monthlyBudget) * 100)
        : 0;

    const displayedPercentage = Math.min(percentage, 100);

    budgetProgress.style.width = `${displayedPercentage}%`;

    budgetProgress.classList.toggle(
        "warning",
        percentage >= 80 && percentage < 100
    );

    budgetProgress.classList.toggle("over-budget", percentage >= 100);

    budgetProgressTrack.setAttribute(
        "aria-valuenow",
        String(displayedPercentage)
    );

    if (monthlyBudget <= 0) {
        budgetMessage.textContent = "Set a budget greater than zero.";
    } else if (expenses >= monthlyBudget) {
        budgetMessage.textContent =
            `Budget exceeded by ${formatCurrency(expenses - monthlyBudget)}.`;
    } else {
        budgetMessage.textContent =
            `${percentage}% used. ${formatCurrency(monthlyBudget - expenses)} remaining.`;
    }
}

// 14. Budget alerts
function updateAlerts(expenses) {
    alertsContainer.replaceChildren();

    let message;
    let alertType = "success";

    if (monthlyBudget > 0 && expenses >= monthlyBudget) {
        message = "You have reached or exceeded your monthly budget.";
        alertType = "danger";
    } else if (monthlyBudget > 0 && expenses >= monthlyBudget * 0.8) {
        message = "You have used at least 80% of your monthly budget.";
        alertType = "warning";
    } else {
        message = "Your spending is currently within your budget.";
    }

    const alert = document.createElement("div");
    alert.className = `alert ${alertType}`;
    alert.textContent = message;

    alertsContainer.appendChild(alert);
}

// 15. Update charts from database-backed transactions
function updateCharts() {
    const monthTransactions = getMonthlyTransactions(selectedBudgetMonth);

    const categoryValues = expenseCategories.map((category) =>
        monthTransactions
            .filter((transaction) =>
                transaction.type === "expense" &&
                transaction.category === category.value
            )
            .reduce((total, transaction) => total + transaction.amount, 0)
    );

    categoryChartMessage.textContent = categoryValues.some((amount) => amount > 0)
        ? ""
        : "No expenses recorded for this month yet.";

    if (categoryChart) {
        categoryChart.data.datasets[0].data = categoryValues;
        categoryChart.update();
    }

    const months = getLastSixMonths();

    const monthlyValues = months.map((month) =>
        transactions
            .filter((transaction) =>
                transaction.type === "expense" &&
                transaction.date.startsWith(month.key)
            )
            .reduce((total, transaction) => total + transaction.amount, 0)
    );

    spendingChartMessage.textContent = monthlyValues.some((amount) => amount > 0)
        ? ""
        : "No spending data is available for these months.";

    if (spendingChart) {
        spendingChart.data.labels = months.map((month) => month.label);
        spendingChart.data.datasets[0].data = monthlyValues;
        spendingChart.update();
    }
}

// 16. Category display labels
function getCategoryLabel(value, type) {
    const categories = type === "income"
        ? incomeCategories
        : expenseCategories;

    const category = categories.find((item) => item.value === value);

    return category ? category.label : value;
}

// 17. Render transaction table with search and filters
function renderTransactions() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedType = filterTypeInput.value;
    const selectedCategory = filterCategoryInput.value;

    const filteredTransactions = [...transactions]
        .filter((transaction) => {
            const matchesSearch = transaction.description
                .toLowerCase()
                .includes(searchText);

            const matchesType = !selectedType ||
                transaction.type === selectedType;

            const matchesCategory = !selectedCategory ||
                transaction.category === selectedCategory;

            return matchesSearch && matchesType && matchesCategory;
        })
        .sort((a, b) =>
            b.date.localeCompare(a.date) || b.id - a.id
        );

    transactionRows.replaceChildren();

    filteredTransactions.forEach((transaction) => {
        const row = document.createElement("tr");

        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = transaction.description;

        const categoryCell = document.createElement("td");
        categoryCell.textContent = getCategoryLabel(
            transaction.category,
            transaction.type
        );

        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(transaction.date);

        const typeCell = document.createElement("td");
        typeCell.textContent =
            transaction.type === "income" ? "Income" : "Expense";

        const amountCell = document.createElement("td");
        const sign = transaction.type === "income" ? "+" : "−";

        amountCell.textContent =
            `${sign}${formatCurrency(transaction.amount)}`;

        amountCell.className =
            transaction.type === "income"
                ? "income-amount"
                : "expense-amount";

        const actionsCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "transaction-action";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => {
            editTransaction(transaction.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
            deleteTransaction(transaction.id);
        });

        actions.append(editButton, deleteButton);
        actionsCell.appendChild(actions);

        row.append(
            descriptionCell,
            categoryCell,
            dateCell,
            typeCell,
            amountCell,
            actionsCell
        );

        transactionRows.appendChild(row);
    });

    transactionMessage.textContent = filteredTransactions.length === 0
        ? "No transactions match your search or filters."
        : `${filteredTransactions.length} transaction(s) displayed.`;
}
// 18. Add or update a transaction
transactionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const description = transactionDescriptionInput.value.trim();
    const amount = Number(transactionAmountInput.value);
    const date = transactionDateInput.value;
    const type = transactionTypeInput.value;
    const category = transactionCategoryInput.value;

    if (
        !description ||
        description.length > 100 ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !date ||
        date > getLocalDateString() ||
        !category
    ) {
        formMessage.textContent =
            "Enter valid transaction details. The date cannot be in the future.";
        formMessage.className = "form-message error";
        return;
    }

    const transactionData = {
        description,
        category,
        amount,
        type,
        transaction_date: date
    };

    try {
        if (editingTransactionId !== null) {
            await apiRequest(
                `/api/transactions/${editingTransactionId}`,
                {
                    method: "PUT",
                    body: JSON.stringify(transactionData)
                }
            );

            formMessage.textContent = "Transaction updated successfully.";
        } else {
            await apiRequest("/api/transactions", {
                method: "POST",
                body: JSON.stringify(transactionData)
            });

            formMessage.textContent = "Transaction saved successfully.";
        }

        formMessage.className = "form-message success";
        editingTransactionId = null;

        transactionForm.reset();
        updateCategoryOptions();
        transactionDateInput.value = getLocalDateString();

        await loadTransactions();
    } catch (error) {
        formMessage.textContent = error.message;
        formMessage.className = "form-message error";
    }
});

// 19. Edit an existing transaction
function editTransaction(id) {
    const transaction = transactions.find((item) => item.id === id);

    if (!transaction) {
        return;
    }

    editingTransactionId = transaction.id;

    transactionTypeInput.value = transaction.type;
    updateCategoryOptions();

    transactionDescriptionInput.value = transaction.description;
    transactionCategoryInput.value = transaction.category;
    transactionAmountInput.value = transaction.amount;
    transactionDateInput.value = transaction.date;

    formMessage.textContent =
        "Edit the details, then select Add Transaction to save changes.";
    formMessage.className = "form-message success";

    document.getElementById("add-transaction").scrollIntoView({
        behavior: "smooth"
    });
}

// 20. Cancel edit when the form is reset
transactionForm.addEventListener("reset", () => {
    editingTransactionId = null;
});

// 21. Delete a transaction from the database
async function deleteTransaction(id) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`/api/transactions/${id}`, {
            method: "DELETE"
        });

        formMessage.textContent = "Transaction deleted successfully.";
        formMessage.className = "form-message success";

        if (editingTransactionId === id) {
            editingTransactionId = null;
            transactionForm.reset();
            updateCategoryOptions();
            transactionDateInput.value = getLocalDateString();
        }

        await loadTransactions();
    } catch (error) {
        formMessage.textContent = error.message;
        formMessage.className = "form-message error";
    }
}

// 22. Save the selected month's budget
budgetForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const amount = Number(budgetAmountInput.value);
    const month = budgetMonthInput.value;

    if (!month || !Number.isFinite(amount) || amount <= 0) {
        budgetMessage.textContent =
            "Enter a valid month and a budget greater than zero.";
        return;
    }

    try {
        await apiRequest("/api/budgets", {
            method: "POST",
            body: JSON.stringify({
                budget_month: month,
                amount
            })
        });

        selectedBudgetMonth = month;
        monthlyBudget = amount;

        budgetMessage.textContent = "Monthly budget saved successfully.";
        await loadTransactions();
    } catch (error) {
        budgetMessage.textContent = error.message;
    }
});

// 23. Load a different month's budget
budgetMonthInput.addEventListener("change", async () => {
    if (!budgetMonthInput.value) {
        return;
    }

    selectedBudgetMonth = budgetMonthInput.value;

    try {
        await loadBudget(selectedBudgetMonth);
        refreshDashboard();
    } catch (error) {
        budgetMessage.textContent = error.message;
    }
});

// 24. Load budgets from the database
async function loadBudget(month) {
    const budgets = await apiRequest("/api/budgets");
    const savedBudget = budgets.find(
        (budget) => budget.budget_month === month
    );

    monthlyBudget = savedBudget ? Number(savedBudget.amount) : 0;

    budgetAmountInput.value = savedBudget ? monthlyBudget : "";
    monthlyBudgetDisplay.textContent = formatCurrency(monthlyBudget);
}

// 25. Load transactions from the database
async function loadTransactions() {
    const rows = await apiRequest("/api/transactions");

    transactions = rows.map(normalizeTransaction);

    await loadBudget(selectedBudgetMonth);
    refreshDashboard();
}

// 26. Search and filter listeners
searchInput.addEventListener("input", renderTransactions);
filterTypeInput.addEventListener("change", renderTransactions);
filterCategoryInput.addEventListener("change", renderTransactions);

filterForm.addEventListener("reset", () => {
    window.setTimeout(renderTransactions, 0);
});
// 27. Refresh dashboard
function refreshDashboard() {
    updateSummary();
    updateCharts();
    renderTransactions();
}

// 28. Start SpendWise
async function initializeApp() {
    updateCategoryOptions();
    initializeCharts();

    try {
        await loadTransactions();
        console.log("SpendWise connected to the database successfully.");
    } catch (error) {
        console.error("Failed to load SpendWise data:", error);

        transactionMessage.textContent =
            "Could not load saved transactions. Check the server connection and refresh.";

        formMessage.textContent =
            "Database connection failed: " + error.message;

        formMessage.className = "form-message error";
    }
}

initializeApp();