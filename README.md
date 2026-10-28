# Athenaeum — Library Management System

An enterprise-grade, relational-database-driven **Library Management System (LMS)** designed to digitize, streamline, and centralize academic library operations. Backed by a rigorously normalized PostgreSQL database (1NF &rarr; 2NF &rarr; 3NF &rarr; BCNF), a Java Servlets & JDBC backend deployed on Apache Tomcat, a standalone Java console application, and a responsive web dashboard with role-based workflows for Students, Librarians, and Administrators.

---

## Project Team

### Group D14 — Athenaeum Library Management System
* **AM.SC.U4CSE25349** — Siddharth S
* **AM.SC.U4CSE25324** — Jeevan A Jacob
* **AM.SC.U4CSE25342** — Prithew J Raj
* **AM.SC.U4CSE25363** — Kalidas R Unnithan
* **AM.SC.U4CSE25367** — Tanishq KT

---

## System Overview

Manual library management and spreadsheet-based workflows suffer from misplaced books, inventory discrepancies, manual calculation errors for overdue penalties, and concurrent update conflicts. **Athenaeum** resolves these challenges by providing:

1. **Centralized Relational Storage:** All library data is modeled across 11 normalized tables ensuring complete data consistency and zero insertion/update/deletion anomalies.
2. **Transactional Circulation:** Book checkouts and returns use atomic database transactions with automatic stock updates and penalty fee generation.
3. **Role-Based Workflows:** Dedicated operational dashboards for Administrators, Librarians, and Students.
4. **Offline-Ready Web Client:** Self-hosted vendor assets guarantee complete functionality without external CDN reliance, featuring both backend-connected and offline mock/demo modes.
5. **Dual Interface Options:** Web dashboard for full institutional access, plus a lightweight standalone Java console CLI application.

---

## Repository Architecture

```
├── backend/                  # Java Servlets & JDBC Web API (Apache Tomcat)
│   ├── src/                  # Servlet controllers, CORS filter, DBConnection utility
│   ├── WEB-INF/              # Deployment descriptor (web.xml), bundled JAR dependencies
│   └── README.md             # Backend setup & deployment guide
│
├── database/                 # PostgreSQL Relational Database
│   ├── schema.sql            # Complete DDL with primary/foreign keys and CHECK constraints
│   ├── seed.sql              # Realistic seed data for catalog, patrons, and transactions
│   └── README.md             # Database architecture & normalization explanation
│
├── frontend/                 # Athenaeum Responsive Web Client
│   ├── assets/               # Self-hosted Inter font, Bootstrap 5, Bootstrap Icons, Chart.js, Favicon
│   ├── css/                  # Custom design tokens, dark mode palette, dashboard layout styles
│   ├── js/                   # Client-side controllers and API service layer
│   ├── admin-dashboard.html  # Dedicated Administrator control panel & stats
│   ├── student-dashboard.html# Dedicated Student catalogue, loans & reservation portal
│   ├── dashboard.html        # Librarian circulation & analytics dashboard
│   ├── login.html            # Authentication view with interactive demo role switchers
│   ├── *.html                # Additional views (Books, Members, Issue, Return, Fines, Reports, etc.)
│   └── README.md             # Frontend overview & design tokens
│
├── cli-app/                  # Standalone Java Console / CLI Application
│   ├── src/                  # Pure OOP models (Book, Student, Library, BorrowRecord, FileHandler)
│   ├── output/               # Terminal execution demo screenshots
│   └── README.md             # CLI compilation & usage instructions
│
├── .gitignore                # Git exclusions (build artifacts, IDE files, OS caches)
└── README.md                 # Project documentation & team information
```

---

## Relational Schema & Normalization

The database architecture is normalized up to **Boyce-Codd Normal Form (BCNF)** to eliminate redundancy and prevent anomalies.

```
PUBLISHER (1) ──< BOOK (N) >── BOOK_AUTHOR (M:N) ──< AUTHOR (M)
                     │
CATEGORY (1) ────────┘
                     │
                 BORROW (N) ──[1:0..1]── FINE
                  │      │
MEMBER (1) ───────┘      └── LIBRARIAN (1)
```

### Database Relations (11 Tables):
* **`PUBLISHER`**: Publishing house metadata and contact channels.
* **`CATEGORY`**: Academic classification taxonomy.
* **`AUTHOR`**: Author biographical records.
* **`BOOK`**: Catalog volume metadata (`isbn UNIQUE`), tracking `total_copies` and `available_copies`.
* **`BOOK_AUTHOR`**: Associative bridge entity with composite primary key `(book_id, author_id)`.
* **`MEMBER`**: Patron directory (`email UNIQUE`, `member_type IN ('student', 'faculty')`).
* **`LIBRARIAN`**: Staff registry with role discriminator (`role IN ('librarian', 'admin')`).
* **`BORROW`**: Circulation ledger tracking issues, due dates, and return timestamps.
* **`RESERVATION`**: Queue management for unavailable titles (`available_copies = 0`).
* **`FINE`**: Overdue penalty assessment linked 1:1 with transactions (`borrow_id UNIQUE`).
* **`FEEDBACK`**: Member reviews and 1–5 star ratings for books or library facilities.

---

## Setup & Run Instructions

### 1. Database Initialization (PostgreSQL)

Ensure PostgreSQL is running locally on port `5432`:

```bash
# Connect to PostgreSQL shell
psql -U postgres

# Create and populate database
CREATE DATABASE library_db;
\c library_db
\i 'database/schema.sql'
\i 'database/seed.sql'
```

*Note: Verify the PostgreSQL credentials in `backend/src/com/library/util/DBConnection.java` match your local PostgreSQL configuration.*

---

### 2. Deploy Backend (Apache Tomcat & Java Servlets)

1. Compile the Servlet classes:
   ```bash
   cd backend
   javac -cp "WEB-INF/lib/*" -d WEB-INF/classes src/com/library/**/*.java
   ```
2. Deploy the `backend/` directory to your Apache Tomcat `webapps/` folder.
3. Start Tomcat:
   * **Windows:** `bin/startup.bat`
   * **Linux / macOS:** `bin/startup.sh`

---

### 3. Launching the Web Client

The web client can be executed in two distinct modes depending on your environment:

#### Mode A: Full Backend-Connected Mode
When Apache Tomcat and PostgreSQL are running:
1. Navigate to:
   ```
   http://localhost:8081/backend/login.html
   ```
   *(Adjust port `8081` to match your Tomcat connector configuration if different)*
2. Sign in with institutional credentials verified against the database.
3. Live transactional endpoints (`/api/books`, `/api/borrow`, `/api/members`, etc.) provide real-time database operations.

#### Mode B: Demo / Mock Mode (Standalone Offline Preview)
If Tomcat or PostgreSQL is not running, the web application automatically falls back to an offline interactive demonstration mode:
1. Open `frontend/login.html` directly in any web browser (or serve via Live Server / local static file server).
2. Use the **Demo Profiles** selector box on the login screen to instantly preview any role:
   * **Student**: `alice@example.com` / `student123` &rarr; Opens `student-dashboard.html` to search books, view active loans, due dates, reservations, and fine balances.
   * **Librarian**: `staff@library.com` / `staff123` &rarr; Opens `dashboard.html` with circulation stats, charts, and quick transaction links.
   * **Administrator**: `admin@library.com` / `admin123` &rarr; Opens `admin-dashboard.html` with system statistics, catalog and staff directory controls.
3. **Distinction Note:** In Demo Mode, operations simulate navigation and session state via browser `localStorage`/`sessionStorage`. To perform persistent database updates, run Mode A with PostgreSQL and Tomcat.

---

### 4. Standalone Console CLI Application

In addition to the web dashboard, a standalone terminal application is provided under `cli-app/`:

```bash
cd cli-app/src
javac *.java
java Main
```

This console application manages library patrons, book inventory, and borrowing records using local CSV persistence (`books.csv`, `borrow_records.csv`).
