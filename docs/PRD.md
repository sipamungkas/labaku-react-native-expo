📄 Product Requirements Document (PRD) - Laba! (Labaku)
Product Name: Laba! (or Labaku)
Version: 1.0 (Full Release)
Owner: Ragil Pamungkas
Platform: Expo (React Native)
Package Manager: Bun

🔖 Overview
Laba! (or Labaku) is a mobile application designed to empower small business owners in tracking their daily product stock movements, monitoring sales (omzet), and calculating profit. This full release version integrates robust user authentication via Supabase, flexible subscription management through RevenueCat (supporting free and premium tiers), and efficient local data persistence using SQLite. The goal is to provide a clean, easy-to-use, and modern minimalist UI that is ready for deployment to the Google Play Store and Apple App Store.

🎯 Goals
User Management: Enable secure user registration, login, and profile management using Supabase Authentication.

Subscription Tiers: Implement distinct free and premium user tiers, with features gated based on subscription status managed by RevenueCat.

Local Data Persistence: Store all product and transaction data locally on the device using SQLite for offline capability and fast access, managed via Drizzle ORM.

Financial Tracking: Allow users to manage products, record daily "Quantity In" and "Quantity Out", and automatically calculate daily, weekly, and monthly omzet and profit.

Vendor Management: Allow users to define and associate products with specific vendors.

Price History Tracking: Accurately record and utilize historical purchase and selling prices for precise profit calculation over time.

User Experience: Present a clean, easy-to-use UI with a modern minimalist design.

Platform Readiness: Ensure the application is stable, secure, and optimized for release on the Google Play Store and Apple App Store.

🧱 Key Features

1. User Authentication & Profile (Supabase)
   Register Screen: Allows new users to create an account with email and password, utilizing supabase.auth.signUp().

Login Screen: Authenticates existing users with email and password, using supabase.auth.signInWithPassword().

Logout Functionality: Securely logs the user out from both Supabase and RevenueCat.

Profile Screen: Displays user's email (from Supabase) and their current subscription tier (from RevenueCat). Allows for future profile updates (e.g., name).

Secure Session Management: Supabase handles JWTs and session persistence, with expo-secure-store for enhanced security.

2. Subscription Management (RevenueCat)
   Paywall/Upgrade Screen:

Fetches and displays available subscription offerings and packages from RevenueCat (Purchases.getOfferings()).

Presents clear options for free vs. premium tiers (e.g., "Monthly Premium", "Annual Premium").

Initiates in-app purchases using Purchases.purchasePackage().

Includes "Restore Purchases" functionality (Purchases.restorePurchases()).

Entitlement-Based Feature Gating:

The app will check the user's active entitlements from RevenueCat (customerInfo.entitlements.active.pro) to determine premium access.

Features will be conditionally enabled/disabled or prompts to upgrade will be displayed based on the user's subscription status.

User Identification: The Supabase user.id will be used as the appUserID in RevenueCat (Purchases.logIn(supabaseUserId)) to link subscription data to the authenticated user.

3. Dashboard (Home)
   Summary Cards: Displays key financial summaries:

Today’s Omzet

Today’s Profit

Weekly Omzet

Monthly Omzet

Data Source: All metrics are calculated from real product and transaction data stored in the local SQLite database.

Tier-Specific Metrics (Premium): Premium users may unlock access to more detailed or historical insights directly on the dashboard (e.g., comparison charts, customizable date ranges).

4. Vendor Management
   Vendor List View: Displays a list of vendors defined by the user.

CRUD Operations:

Add Vendor: Modal form to add new vendor names, persisted to local SQLite via Drizzle ORM.

Edit Vendor: Modal form to modify existing vendor names, updated in local SQLite via Drizzle ORM.

Delete Vendor: Removes a vendor from local SQLite (with a warning if products are linked).

User Scope: Vendors are associated with the logged-in user (userId from Supabase).

5. Product Management
   Product List View: Displays a list of all products with:

Product Name

Associated Vendor

Current Purchase Price (Harga Modal) - derived from latest price history

Current Selling Price (Harga Jual) - derived from latest price history

CRUD Operations:

Add Product: Modal form to add new products. Requires selecting an existing Vendor. Persisted to local SQLite via Drizzle ORM. Initial purchase and selling prices are recorded in the product_price_history table.

Edit Product: Modal form to modify product details (e.g., name, associated vendor).

Price Update: When prices change, a new entry is added to the product_price_history table with the new prices and an effectiveDate (defaulting to today). Existing price history is preserved.

Delete Product: Removes a product and its associated price history and transactions from local SQLite.

User Scope: Products are associated with the logged-in user (userId from Supabase).

Free Tier Limits (Optional): Consider limiting the number of products a free user can manage (e.g., max 10 products) to encourage premium upgrades.

6. Daily Transactions
   Record Transaction: Form to record daily stock movements:

Select Product (from user's product list)

Date (default: today, with option to select past dates)

Quantity In (stock added)

Quantity Out (items sold)

Profit Calculation: Automatically calculates and displays "Profit per entry". This calculation will dynamically retrieve the correct purchasePrice and sellingPrice from the product_price_history table based on the transaction.date.

Data Persistence: All transaction records are saved to the local SQLite database via Drizzle ORM, linked to the userId and productId.

7. Report View
   Filter Options: Allows users to filter omzet and profit reports by:

Daily

Weekly

Monthly

(Premium Feature) Custom Date Range / All Time

Summary Section: Provides total sales and profit for the selected period.

UI: Uses segmented controls or dropdowns for easy filter switching.

Data Source: All reports are generated from transaction data stored in the local SQLite database, utilizing the product_price_history for accurate profit calculation.

Premium Reporting: Premium users gain access to advanced reporting features such as:

Export reports (CSV/PDF - future consideration, may require cloud functions).

Graphical representation of trends.

Detailed breakdown by product, vendor, or category.

🖌 Design & UI
Theme: Light mode, minimalist design.

Layout: Flat cards for data display, clean forms for input.

Navigation: Intuitive bottom tab navigation for core sections.

Components:

Modal forms for adding/editing data.

Cards for summarizing information.

Tabs or segmented controls for filtering reports.

Icon-based tab bar for easy recognition.

Clear typography and sufficient spacing for readability on mobile devices.

🗂 Navigation
Expo Router: The application will leverage expo-router for declarative and efficient navigation, enabling file-system based routing.

TabScreen:

🏠 Home: Dashboard (summary cards)

📦 Products: Product list & form (Add/Edit/Delete products)

📝 Transactions: Add/view daily records

📊 Reports: Omzet & profit by filter

👤 Profile/Settings: User profile, subscription status, logout

Auth Flow:

Login Screen

Register Screen

📊 Data Structure
Supabase (PostgreSQL - Backend)
auth.users table: Managed directly by Supabase for core user authentication.

public.profiles table: (Optional, for additional user metadata beyond what Supabase Auth provides directly)

CREATE TABLE profiles (
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to Supabase Auth user ID
email TEXT UNIQUE NOT NULL,
-- The 'tier' column here is primarily derived from RevenueCat entitlements.
-- You might keep it for quick local caching or if you have non-subscription tiers managed elsewhere.
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

RevenueCat (Backend - Subscription Management)
Customers: Identified by appUserID (which will be the Supabase user.id).

Entitlements: Defines access levels (e.g., pro entitlement for premium features).

Products: Configured to link App Store/Google Play products to RevenueCat entitlements.

Offerings: Groups of products presented to users for purchase.

Local SQLite Database (On-Device, managed by Drizzle ORM)
local_users table: Caches essential user information from Supabase and RevenueCat for offline access and quick state checks.

CREATE TABLE local_users (
id TEXT PRIMARY KEY NOT NULL, -- Corresponds to the user ID (UUID) from Supabase Auth
email TEXT UNIQUE NOT NULL,
tier TEXT NOT NULL DEFAULT 'free' -- 'free' or 'premium', updated from RevenueCat
);

vendors table: Stores information about product vendors.

CREATE TABLE vendors (
id INTEGER PRIMARY KEY AUTOINCREMENT,
userId TEXT NOT NULL, -- Links vendor to a specific user (Supabase UUID)
name TEXT NOT NULL UNIQUE, -- Vendor name must be unique per user
FOREIGN KEY (userId) REFERENCES local_users(id) ON DELETE CASCADE
);

products table: Stores details of each product.

CREATE TABLE products (
id INTEGER PRIMARY KEY AUTOINCREMENT,
userId TEXT NOT NULL, -- Links product to a specific user (Supabase UUID)
vendorId INTEGER NOT NULL, -- NEW: Links product to a specific vendor
name TEXT NOT NULL,
-- purchasePrice and sellingPrice are REMOVED from here, moved to product_price_history
FOREIGN KEY (userId) REFERENCES local_users(id) ON DELETE CASCADE,
FOREIGN KEY (vendorId) REFERENCES vendors(id) ON DELETE CASCADE
);

product_price_history table: Stores historical purchase and selling prices for each product.

CREATE TABLE product_price_history (
id INTEGER PRIMARY KEY AUTOINCREMENT,
productId INTEGER NOT NULL, -- Links to the products table
effectiveDate TEXT NOT NULL, -- YYYY-MM-DD, the date from which this price is effective
purchasePrice REAL NOT NULL,
sellingPrice REAL NOT NULL,
UNIQUE(productId, effectiveDate), -- Ensures only one price entry per product per day
FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

transactions table: Records daily stock movements and sales.

CREATE TABLE transactions (
id INTEGER PRIMARY KEY AUTOINCREMENT,
userId TEXT NOT NULL, -- Links transaction to a specific user (Supabase UUID)
productId INTEGER NOT NULL,
date TEXT NOT NULL, -- YYYY-MM-DD
quantityIn INTEGER NOT NULL,
quantityOut INTEGER NOT NULL,
-- Profit is calculated dynamically using product_price_history, not stored here
FOREIGN KEY (userId) REFERENCES local_users(id) ON DELETE CASCADE,
FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

🚫 Out of Scope (for this version, but potential future enhancements)
Cloud backup/sync of SQLite data (e.g., to Supabase PostgreSQL).

Advanced analytics dashboards beyond basic summaries.

Exporting reports to CSV/PDF (may require cloud functions).

Push notifications.

Multi-device sync for local SQLite data.

Social logins (though Supabase supports them, not prioritized for V1).

📅 Timeline Suggestion
Week 1-2: Core Architecture, Supabase & RevenueCat Setup

Project setup, dependency installation (expo-sqlite, @supabase/supabase-js, react-native-purchases, expo-secure-store, drizzle-orm, drizzle-kit) using Bun.

Supabase project initialization, Auth configuration, and public.profiles table setup.

RevenueCat project setup, product/entitlement/offering configuration.

SQLite database initialization and Drizzle schema definition (local_users, vendors, products, product_price_history, transactions).

Drizzle migrations setup and initial migration application.

Basic Authentication UI (Register, Login).

Integration of Supabase Auth and Purchases.logIn().

Global state management for user and subscription status.

Week 3-4: Vendor & Product Management, Subscription Flow & Local Data Persistence

Development of Vendor Management (CRUD) screens, interacting with SQLite via Drizzle ORM.

Development of Product Management (CRUD) screens, including linking to vendors and handling price history, interacting with SQLite via Drizzle ORM.

Development of Paywall/Upgrade screen with RevenueCat offerings.

Implementation of purchase and restore functionalities.

Refactor Daily Transactions module to use SQLite for data persistence, ensuring accurate price lookup from history, interacting with SQLite via Drizzle ORM.

Update Dashboard and Report View to display real data from SQLite, querying via Drizzle ORM.

Refine UI/UX based on real data flows.

Week 5: Tier Management, Profile & Refinements

Implementation of feature gating based on RevenueCat entitlements.

Development of UI elements to indicate tier status.

Completion of Profile screen (displaying user info and subscription status).

Comprehensive input validation and error handling.

Week 6: Testing, Optimization & Deployment Preparation

Thorough testing (functional, performance, security, in-app purchases in sandbox).

Bug fixing and performance optimization.

Preparation of all assets for Google Play Store and Apple App Store submission.

Finalization of Privacy Policy and Terms of Service documents.

💻 Technology Stack
Frontend Framework: Expo (React Native)

Package Manager: Bun

Navigation: Expo Router

Local Database: expo-sqlite

Database ORM & Migrations: Drizzle ORM (drizzle-orm, drizzle-kit)

Authentication: Supabase (@supabase/supabase-js)

Subscription Management: RevenueCat (react-native-purchases)

Secure Storage: expo-secure-store (for Supabase session and potentially RevenueCat user ID)

State Management: React Context API, Zustand, or Redux.
