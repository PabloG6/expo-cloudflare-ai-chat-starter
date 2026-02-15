import { pgTable, text, timestamp, varchar, index } from "drizzle-orm/pg-core";

export * from "./auth.schema";

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("todo"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("tasks_user_idx").on(table.userId)],
);
