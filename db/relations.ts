import { relations } from "drizzle-orm";
import {
  weeklyReports,
  weeklyRevenueItems,
  weeklyClassItems,
  weeklyLowClassMembers,
} from "./schema";

export const weeklyReportsRelations = relations(weeklyReports, ({ many }) => ({
  revenueItems: many(weeklyRevenueItems),
  classItems: many(weeklyClassItems),
  lowClassMembers: many(weeklyLowClassMembers),
}));

export const weeklyRevenueItemsRelations = relations(
  weeklyRevenueItems,
  ({ one }) => ({
    weeklyReport: one(weeklyReports, {
      fields: [weeklyRevenueItems.weeklyReportId],
      references: [weeklyReports.id],
    }),
  })
);

export const weeklyClassItemsRelations = relations(
  weeklyClassItems,
  ({ one }) => ({
    weeklyReport: one(weeklyReports, {
      fields: [weeklyClassItems.weeklyReportId],
      references: [weeklyReports.id],
    }),
  })
);

export const weeklyLowClassMembersRelations = relations(
  weeklyLowClassMembers,
  ({ one }) => ({
    weeklyReport: one(weeklyReports, {
      fields: [weeklyLowClassMembers.weeklyReportId],
      references: [weeklyReports.id],
    }),
  })
);
