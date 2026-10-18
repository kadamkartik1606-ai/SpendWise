# SpendWise — Personal Finance Tracker

SpendWise is a web application for tracking personal finances, managing income and expenses, and setting monthly budgets. It includes an interactive dashboard with financial summaries and charts.

## Features

- Add, edit, and delete transactions
- Categorize income and expenses
- Set and manage monthly budgets
- View financial summaries and charts
- Store transaction and budget data in MySQL
- Use a responsive web interface

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Charts:** Chart.js
- **Development tools:** Visual Studio Code, XAMPP

## Getting Started

### Prerequisites

Install Node.js and XAMPP with MySQL.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/kadamkartik1606-ai/SpendWise.git
   ```

2. Navigate into the project:

   ```bash
   cd SpendWise
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a MySQL database named `spendwise_db` and create the required tables.

5. Create a `.env` file in the project root with your local database settings:

   ```env
   PORT=3000
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=spendwise_db
   ```

   Update the values if your MySQL configuration differs. Never commit your `.env` file or real credentials.

6. Start the application:

   ```bash
   npm run dev
   ```

7. Open `http://localhost:3000` in your browser.

## Project Status

Core transaction and budget features have been implemented and tested locally. Online deployment is planned.

## Author

Kartik Kadam

## License

No license has been added yet.