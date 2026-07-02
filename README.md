# 🍳 CookBro - Smart Family Meal Planner

[简体中文](README_zh.md) | English

**CookBro** is a mobile-first, modern, and collaborative web application designed for families and shared households to coordinate daily meal choices, manage a shared recipe library, and automatically organize grocery shopping trips. 

With a warm, cozy culinary aesthetic and responsive minimalist interface, CookBro simplifies the daily question of *"What should we eat today?"*.

---

## ✨ Key Features

### 📅 Collaborative Meal Planning
- Group menus for **Breakfast, Lunch, and Dinner**.
- Live synchronization of meal choices across all family members using SWR data fetching.
- **Cart-based Ordering**: Select recipes into your cart for each meal, review your choices, and confirm the menu for the day.
- **Menu Locking**: Once an order is confirmed, changes are locked to prevent duplicates. Easily clear and reset menus using the "Re-select" workflow.

### 📖 Shared Recipe Library
- Manage (Create, Read, Update, Delete) a collective repository of family recipes.
- Dynamic recipe details including ingredient ratios, step-by-step guides, required cooking utensils, portions, and duration.
- **Seeded Template Menu**: Pre-populated with **20 classic Chinese recipes** (Sichuan, Cantonese, Hunan, Zhejiang, etc.) to get you started immediately.
- Permissions allow both user-created and default templates to be fully edited or deleted.

### 📝 Smart Grocery Shopping Checklist (TodoList)
- Automatically extracts and **aggregates duplicate ingredients** from all selected dishes for the day (e.g. merging two "Pork Belly 500g" entries).
- Displays items in a clean, interactive TodoList format.
- Progress is preserved in `localStorage` so your checklist stays intact while walking through the market, even if you refresh or close the page.

### 👨‍👩‍👧‍👦 Family Group Management
- Create a family or join an existing one using a simple 6-character invitation code.
- Manage group members with real-time profile lists.
- **Creator Privileges**: Family creators can kick members or dissolve the entire family group. Both dangerous operations feature **strict double-confirmation prompts** to prevent accidental actions.

### 🔐 Dual-Mode Authentication System
Flexible authentication modes that can be dynamically toggled via environment variables:
1. **Firebase Authentication (Default)**: Integrated with Google Sign-in SSO and Firebase email authentication. Mapped accounts automatically synchronize into the local SQLite database.
2. **Local Database Authentication**: A fully local, offline registration and login mechanism powered by SQLite database queries and built-in SHA-256 password hashing. Ideal for deployments behind strict firewalls or inside local area networks without Google/Firebase connectivity.

---

## 🛠️ Technology Stack
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
- **Styling**: Pure CSS Modules (Warm Minimalist Theme, custom HSL color tokens, dark mode adaptiveness)
- **Database & ORM**: [Prisma 7](https://www.prisma.io/) & [SQLite](https://sqlite.org/) (utilizing the `better-sqlite3` driver adapter)
- **State & Sync**: [SWR](https://swr.vercel.app/) for reactive caching and polling
- **Build Engine**: [Turbopack](https://nextjs.org/docs/app/api-reference/turbopack)

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/<your-username>/cook-bro.git
cd cook-bro
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the root directory (based on `.env.local.example`):
```ini
# Choose 'local' for offline database auth, or 'firebase' for external auth integration
NEXT_PUBLIC_AUTH_PROVIDER=local

# Firebase Configuration (Required only if NEXT_PUBLIC_AUTH_PROVIDER is 'firebase')
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 3. Initialize & Seed the Database
Ensure the SQLite schema is initialized and populate the 20 classic Chinese recipes:
```bash
# Push the schema changes directly
npx prisma db push --accept-data-loss

# Generate the Prisma client types
npx prisma generate

# Populate the database seed data
node prisma/seed.js
```

### 4. Run the Development Server
Start Next.js locally. To allow other devices (like smartphones) in your Local Area Network (LAN) to access the dev server for testing, listen on all network interfaces:
```bash
npm run dev -- -H 0.0.0.0
```
Open [http://localhost:3000](http://localhost:3000) or `http://<your-lan-ip>:3000` on your smartphone/devices to start debugging!

*(Note: If debugging Firebase Auth on LAN, make sure to add your LAN IP e.g. `192.168.1.100` to the **Authorized Domains** list in your Firebase Authentication Console settings.)*

---

## 🔒 Security & Git Best Practices
All database files (`*.db`, `*.db-journal`, `*.db-wal`, `*.db-shm`) and `.env` local settings are ignored under `.gitignore` to prevent database or credentials leaks.
