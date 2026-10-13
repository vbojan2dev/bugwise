/*
 * FoodDash practice database for the SQL playground (SQLite via sql.js).
 *
 * The seed data deliberately contains bugs for learners to find:
 *  1. Order 1007: stored total (33.50) doesn't match its items (30.00): a removed miso soup was still charged.
 *  2. Users 1 and 7: the same email with different capitalization (sign-up compared emails case-sensitively).
 *  3. Order 1010: an order with no items at all.
 *  4. Order items row 26 points to order 1016, which doesn't exist (an orphan row).
 *  5. WELCOME10 is a once-per-user coupon, but user 1 used it on orders 1001 and 1004.
 *  6. Bonus (not an exercise): order 1014 used SUMMER15 after its valid_until date.
 *
 * Foreign keys are declared but SQLite doesn't enforce them unless PRAGMA foreign_keys = ON,
 * which is exactly how orphan rows sneak into real databases.
 */

export const SCHEMA_SQL = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT,
  signed_up TEXT NOT NULL
);
CREATE TABLE restaurants (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  city TEXT NOT NULL,
  rating REAL
);
CREATE TABLE coupons (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL,
  percent INTEGER NOT NULL,
  once_per_user INTEGER NOT NULL,
  valid_until TEXT NOT NULL
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  status TEXT NOT NULL,
  total REAL NOT NULL,
  coupon_id INTEGER REFERENCES coupons(id),
  created_at TEXT NOT NULL
);
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  dish TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL
);
`;

export const SEED_SQL = `
INSERT INTO users (id, name, email, city, signed_up) VALUES
  (1, 'Mia Novak', 'mia.novak@mail.test', 'Belgrade', '2025-03-02'),
  (2, 'Luka Petrović', 'luka.petrovic@mail.test', 'Novi Sad', '2025-03-15'),
  (3, 'Ana Kovač', 'ana.kovac@mail.test', 'Belgrade', '2025-04-01'),
  (4, 'Jonas Weber', 'jonas.weber@mail.test', 'Berlin', '2025-04-20'),
  (5, 'Sara Ilić', 'sara.ilic@mail.test', 'Belgrade', '2025-05-08'),
  (6, 'Marko Jovanović', 'marko.j@mail.test', NULL, '2025-06-11'),
  (7, 'Mia Novak', 'Mia.Novak@mail.test', 'Belgrade', '2025-08-30'),
  (8, 'Emma Schulz', 'emma.schulz@mail.test', 'Berlin', '2025-09-03'),
  (9, 'Petar Đorđević', 'petar.djordjevic@mail.test', NULL, '2025-09-05'),
  (10, 'Lena Fischer', 'lena.fischer@mail.test', 'Berlin', '2025-09-10');

INSERT INTO restaurants (id, name, cuisine, city, rating) VALUES
  (1, 'Pizzeria Napoli', 'pizza', 'Belgrade', 4.7),
  (2, 'Balkan Grill Kod Žike', 'balkan', 'Belgrade', 4.8),
  (3, 'Sushi Zen Garden', 'asian', 'Novi Sad', 4.6),
  (4, 'Green Bowl', 'healthy', 'Berlin', 4.4),
  (5, 'Burger Brothers', 'american', 'Belgrade', 4.5),
  (6, 'Le Petit Café', 'desserts', 'Berlin', 4.5);

INSERT INTO coupons (id, code, percent, once_per_user, valid_until) VALUES
  (1, 'WELCOME10', 10, 1, '2025-12-31'),
  (2, 'PIZZA20', 20, 0, '2025-12-31'),
  (3, 'SUMMER15', 15, 1, '2025-08-31');

INSERT INTO orders (id, user_id, restaurant_id, status, total, coupon_id, created_at) VALUES
  (1001, 1, 1, 'delivered', 21.40, 1, '2025-09-01 12:10'),
  (1002, 2, 2, 'delivered', 25.60, 1, '2025-09-01 19:45'),
  (1003, 3, 3, 'delivered', 19.60, NULL, '2025-09-02 13:05'),
  (1004, 1, 5, 'delivered', 26.80, 1, '2025-09-04 20:30'),
  (1005, 4, 4, 'delivered', 18.70, NULL, '2025-09-05 12:40'),
  (1006, 5, 1, 'canceled', 12.40, 2, '2025-09-06 18:15'),
  (1007, 2, 3, 'delivered', 33.50, NULL, '2025-09-07 19:20'),
  (1008, 6, 2, 'delivered', 14.10, NULL, '2025-09-08 21:00'),
  (1009, 7, 1, 'delivered', 9.50, 2, '2025-09-09 12:30'),
  (1010, 5, 5, 'preparing', 13.40, 2, '2025-09-10 18:50'),
  (1011, 9, 4, 'delivered', 7.90, NULL, '2025-09-11 08:55'),
  (1012, 1, 2, 'on_the_way', 16.90, NULL, '2025-09-12 19:10'),
  (1013, 4, 3, 'preparing', 13.70, NULL, '2025-09-12 19:25'),
  (1014, 5, 1, 'delivered', 24.30, 3, '2025-09-13 20:05'),
  (1015, 10, 4, 'canceled', 10.50, NULL, '2025-09-14 13:30');

INSERT INTO order_items (id, order_id, dish, quantity, unit_price) VALUES
  (1, 1001, 'Margherita', 1, 9.50),
  (2, 1001, 'Diavola', 1, 11.90),
  (3, 1002, 'Ćevapi (10 pcs)', 1, 10.90),
  (4, 1002, 'Pljeskavica', 1, 11.50),
  (5, 1002, 'Pomfrit', 1, 3.20),
  (6, 1003, 'California roll', 1, 9.40),
  (7, 1003, 'Spicy tuna roll', 1, 10.20),
  (8, 1004, 'Classic burger', 2, 9.90),
  (9, 1004, 'Fries', 2, 3.50),
  (10, 1005, 'Buddha bowl', 1, 10.50),
  (11, 1005, 'Falafel wrap', 1, 8.20),
  (12, 1006, 'Quattro formaggi', 1, 12.40),
  (13, 1007, 'Spicy tuna roll', 2, 10.20),
  (14, 1007, 'Salmon nigiri (2 pcs)', 2, 4.80),
  (15, 1008, 'Ćevapi (10 pcs)', 1, 10.90),
  (16, 1008, 'Pomfrit', 1, 3.20),
  (17, 1009, 'Margherita', 1, 9.50),
  (18, 1011, 'Açaí bowl', 1, 7.90),
  (19, 1012, 'Pljeskavica', 1, 11.50),
  (20, 1012, 'Šopska salata', 1, 5.40),
  (21, 1013, 'Miso soup', 1, 3.50),
  (22, 1013, 'Spicy tuna roll', 1, 10.20),
  (23, 1014, 'Diavola', 1, 11.90),
  (24, 1014, 'Quattro formaggi', 1, 12.40),
  (25, 1015, 'Buddha bowl', 1, 10.50),
  (26, 1016, 'Tiramisù', 2, 5.90);
`;

export interface ColumnInfo {
  name: string;
  type: string;
  pk?: boolean;
  fk?: string;
  nullable?: boolean;
  note?: string;
}

export interface TableInfo {
  name: string;
  about: string;
  columns: ColumnInfo[];
}

export const TABLES: TableInfo[] = [
  {
    name: 'users',
    about: 'People with a FoodDash account',
    columns: [
      { name: 'id', type: 'INTEGER', pk: true },
      { name: 'name', type: 'TEXT' },
      { name: 'email', type: 'TEXT' },
      { name: 'city', type: 'TEXT', nullable: true },
      { name: 'signed_up', type: 'TEXT', note: 'YYYY-MM-DD' },
    ],
  },
  {
    name: 'restaurants',
    about: 'Partner restaurants',
    columns: [
      { name: 'id', type: 'INTEGER', pk: true },
      { name: 'name', type: 'TEXT' },
      { name: 'cuisine', type: 'TEXT' },
      { name: 'city', type: 'TEXT' },
      { name: 'rating', type: 'REAL' },
    ],
  },
  {
    name: 'coupons',
    about: 'Discount codes',
    columns: [
      { name: 'id', type: 'INTEGER', pk: true },
      { name: 'code', type: 'TEXT' },
      { name: 'percent', type: 'INTEGER' },
      { name: 'once_per_user', type: 'INTEGER', note: '1 = yes, 0 = no' },
      { name: 'valid_until', type: 'TEXT', note: 'YYYY-MM-DD' },
    ],
  },
  {
    name: 'orders',
    about: 'One row per order; total = sum of its items (EUR, before coupons)',
    columns: [
      { name: 'id', type: 'INTEGER', pk: true },
      { name: 'user_id', type: 'INTEGER', fk: 'users.id' },
      { name: 'restaurant_id', type: 'INTEGER', fk: 'restaurants.id' },
      { name: 'status', type: 'TEXT', note: 'preparing, on_the_way, delivered, canceled' },
      { name: 'total', type: 'REAL' },
      { name: 'coupon_id', type: 'INTEGER', fk: 'coupons.id', nullable: true },
      { name: 'created_at', type: 'TEXT', note: 'YYYY-MM-DD HH:MM' },
    ],
  },
  {
    name: 'order_items',
    about: 'The dishes in each order',
    columns: [
      { name: 'id', type: 'INTEGER', pk: true },
      { name: 'order_id', type: 'INTEGER', fk: 'orders.id' },
      { name: 'dish', type: 'TEXT' },
      { name: 'quantity', type: 'INTEGER' },
      { name: 'unit_price', type: 'REAL' },
    ],
  },
];

export interface Exercise {
  title: string;
  level: 'Easy' | 'Medium' | 'Hard';
  /** True when the exercise is about finding a bug in the data. */
  bug?: boolean;
  task: string;
  /** The columns the learner should return, shown under the task. */
  columns: string[];
  hint: string;
  solution: string;
  /** Row order matters only when the task asks for ORDER BY. */
  ordered?: boolean;
  /** Shown once the exercise is solved. */
  explain: string;
  /** Extra nudges shown with a wrong answer when the query matches a typical mistake. */
  nudges?: { test: (sql: string) => boolean; message: string }[];
}

const has = (re: RegExp) => (sql: string) => re.test(sql.replace(/--[^\n]*/g, ''));
const lacks = (re: RegExp) => (sql: string) => !re.test(sql.replace(/--[^\n]*/g, ''));

export const EXERCISES: Exercise[] = [
  {
    title: 'Restaurants in Belgrade',
    level: 'Easy',
    task: 'Show the name and rating of every restaurant in Belgrade.',
    columns: ['name', 'rating'],
    hint: "Filter with WHERE. Text values go in single quotes: city = 'Belgrade'.",
    solution: "SELECT name, rating\nFROM restaurants\nWHERE city = 'Belgrade';",
    explain: 'Three restaurants. Picking only the columns you need keeps results readable, which matters once tables have 40 columns.',
  },
  {
    title: 'Big delivered orders',
    level: 'Easy',
    task: 'List the delivered orders with a total over 20, highest total first.',
    columns: ['id', 'total'],
    hint: "Combine two conditions with AND (status = 'delivered' AND total > 20), then ORDER BY total DESC.",
    solution: "SELECT id, total\nFROM orders\nWHERE status = 'delivered' AND total > 20\nORDER BY total DESC;",
    ordered: true,
    explain: 'Without DESC you would get the smallest first. When a task says "highest first", the order of the rows is part of the answer.',
    nudges: [{ test: lacks(/\bdesc\b/i), message: 'Highest first means descending order: ORDER BY total DESC.' }],
  },
  {
    title: 'Users without a city',
    level: 'Easy',
    task: 'Find the users who have no city saved.',
    columns: ['name', 'email'],
    hint: 'A missing value is NULL, and nothing is ever "= NULL". Use IS NULL.',
    solution: 'SELECT name, email\nFROM users\nWHERE city IS NULL;',
    explain: 'WHERE city = NULL returns zero rows without any error, which is why NULL bugs are so sneaky.',
    nudges: [{ test: has(/(=|<>|!=)\s*null\b/i), message: 'Nothing is equal to NULL, not even NULL, so = NULL matches no rows. Use IS NULL.' }],
  },
  {
    title: 'Orders per status',
    level: 'Medium',
    task: 'Count how many orders there are in each status.',
    columns: ['status', 'number of orders'],
    hint: 'SELECT status, COUNT(*) ... GROUP BY status. Every non-aggregated column in SELECT belongs in GROUP BY.',
    solution: 'SELECT status, COUNT(*) AS orders\nFROM orders\nGROUP BY status;',
    explain: 'GROUP BY folds many rows into one row per status. Handy for checking a dashboard: its numbers should match yours.',
    nudges: [{ test: lacks(/group\s+by/i), message: 'COUNT(*) alone counts all rows. Add GROUP BY status to get one count per status.' }],
  },
  {
    title: 'Orders in progress, with names',
    level: 'Medium',
    task: "Show the orders that are still 'preparing' or 'on_the_way', with the customer's name and the restaurant's name.",
    columns: ['order id', 'customer name', 'restaurant name'],
    hint: 'Join orders to users (ON u.id = o.user_id) and to restaurants (ON r.id = o.restaurant_id). Use IN for the two statuses.',
    solution:
      "SELECT o.id, u.name AS customer, r.name AS restaurant\nFROM orders o\nJOIN users u ON u.id = o.user_id\nJOIN restaurants r ON r.id = o.restaurant_id\nWHERE o.status IN ('preparing', 'on_the_way');",
    explain: 'Both tables have a "name" column, so you need table aliases (u.name, r.name). Short aliases make joins much easier to read.',
  },
  {
    title: 'Orders without items',
    level: 'Medium',
    bug: true,
    task: 'Find the bug: list every order that has no rows in order_items.',
    columns: ['id', 'status'],
    hint: 'LEFT JOIN order_items to orders. Orders with no match get NULL in every order_items column, so filter WHERE oi.id IS NULL.',
    solution:
      'SELECT o.id, o.status\nFROM orders o\nLEFT JOIN order_items oi ON oi.order_id = o.id\nWHERE oi.id IS NULL;',
    explain:
      'Bug found: order 1010 has a total of 13.40 but no dishes. The kitchen has nothing to cook. An INNER JOIN would have hidden this order completely.',
    nudges: [{ test: lacks(/left\s+(outer\s+)?join|not\s+exists|not\s+in/i), message: 'An INNER JOIN only keeps orders that have items, so the broken order disappears. Use a LEFT JOIN.' }],
  },
  {
    title: 'Orphan order items',
    level: 'Medium',
    bug: true,
    task: 'Find the bug: list the order items that point to an order that does not exist.',
    columns: ['item id', 'order_id'],
    hint: 'Turn it around: start FROM order_items, LEFT JOIN orders, and keep the rows where the order side is NULL.',
    solution:
      'SELECT oi.id, oi.order_id\nFROM order_items oi\nLEFT JOIN orders o ON o.id = oi.order_id\nWHERE o.id IS NULL;',
    explain:
      'Bug found: item 26 belongs to order 1016, which is gone. Typical cause: deleting an order without deleting its items, and a foreign key that the database doesn’t enforce.',
    nudges: [{ test: lacks(/left\s+(outer\s+)?join|not\s+exists|not\s+in/i), message: 'An INNER JOIN drops the orphan row. Start FROM order_items and LEFT JOIN orders.' }],
  },
  {
    title: 'Same email, different capitals',
    level: 'Hard',
    bug: true,
    task: 'Find the bug: which email addresses are used by more than one account when you ignore capitalization? Return the lowercased email and the number of accounts.',
    columns: ['email (lowercase)', 'number of accounts'],
    hint: 'Group by LOWER(email), then keep groups with HAVING COUNT(*) > 1.',
    solution:
      'SELECT LOWER(email) AS email, COUNT(*) AS accounts\nFROM users\nGROUP BY LOWER(email)\nHAVING COUNT(*) > 1;',
    explain:
      'Bug found: mia.novak@mail.test and Mia.Novak@mail.test are two accounts. Sign-up compared emails case-sensitively, so one person can get two welcome coupons.',
    nudges: [{ test: lacks(/lower|upper|collate\s+nocase/i), message: 'Mia.Novak and mia.novak are different strings to the database. Group by LOWER(email).' }],
  },
  {
    title: "Totals that don't add up",
    level: 'Hard',
    bug: true,
    task: 'Find the bug: which orders have a stored total that is different from the sum of quantity × unit_price of their items?',
    columns: ['order id', 'stored total', 'items total'],
    hint: 'JOIN orders to order_items, GROUP BY o.id, o.total, and compare in HAVING. Wrap the sum in ROUND(..., 2): decimals like 10.2 are not stored exactly.',
    solution:
      'SELECT o.id, o.total, ROUND(SUM(oi.quantity * oi.unit_price), 2) AS items_total\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.id\nGROUP BY o.id, o.total\nHAVING ROUND(SUM(oi.quantity * oi.unit_price), 2) <> o.total;',
    explain:
      'Bug found: order 1007 was charged 33.50, but its items add up to 30.00. A miso soup (3.50) removed from the cart was still in the total. That is a money bug: report it as high severity.',
    nudges: [{ test: lacks(/round/i), message: 'Look closely at your result: 14.1 can come out as 14.100000000000001. Round the sum with ROUND(..., 2) before comparing.' }],
  },
  {
    title: 'A one-time coupon used twice',
    level: 'Hard',
    bug: true,
    task: 'Find the bug: coupons with once_per_user = 1 may be used only once per user. Which user used such a coupon more than once? Return the user id, the coupon code and how many times it was used.',
    columns: ['user_id', 'code', 'times used'],
    hint: 'JOIN orders to coupons ON c.id = o.coupon_id, keep WHERE c.once_per_user = 1, GROUP BY o.user_id, c.code, and HAVING COUNT(*) > 1.',
    solution:
      'SELECT o.user_id, c.code, COUNT(*) AS times_used\nFROM orders o\nJOIN coupons c ON c.id = o.coupon_id\nWHERE c.once_per_user = 1\nGROUP BY o.user_id, c.code\nHAVING COUNT(*) > 1;',
    explain:
      'Bug found: user 1 used WELCOME10 on orders 1001 and 1004. The checkout validated the coupon but never checked earlier orders. Bonus: can you spot a coupon used after its valid_until date?',
    nudges: [{ test: lacks(/once_per_user/i), message: 'PIZZA20 may be used many times. Keep only coupons WHERE c.once_per_user = 1.' }],
  },
];
