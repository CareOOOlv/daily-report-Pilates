import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  int,
  boolean,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

/**
 * 日报主表
 * 每日运营数据记录
 */
export const dailyReports = mysqlTable("daily_reports", {
  id: serial("id").primaryKey(),
  reportDate: varchar("report_date", { length: 10 }).notNull().unique(),
  // 新客体验
  newExperienceNames: text("new_experience_names"),
  newExperienceCount: int("new_experience_count").default(0),
  monthExperienceTotal: int("month_experience_total").default(0),
  // 新客咨询
  newConsultNames: text("new_consult_names"),
  newConsultCount: int("new_consult_count").default(0),
  monthConsultTotal: int("month_consult_total").default(0),
  // 课程邀约
  invitationNames: text("invitation_names"),
  invitationCount: int("invitation_count").default(0),
  // 好评
  reviewDetails: json("review_details").$type<
    { name: string; platform: "meituan" | "dianping" }[]
  >(),
  reviewCount: int("review_count").default(0),
  monthReviewTotal: int("month_review_total").default(0),
  // 美照/视频
  photoNames: text("photo_names"),
  photoCount: int("photo_count").default(0),
  // 课量
  privateClassCount: int("private_class_count").default(0),
  groupClassCount: int("group_class_count").default(0),
  totalClassCount: int("total_class_count").default(0),
  monthTotalClasses: int("month_total_classes").default(0),
  // 社交媒体
  xiaohongshu: boolean("xiaohongshu").default(false),
  shipinhao: boolean("shipinhao").default(false),
  douyin: boolean("douyin").default(false),
  // 生成的文案
  generatedText: text("generated_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = typeof dailyReports.$inferInsert;

/**
 * 周报主表
 * 每周运营数据汇总
 */
export const weeklyReports = mysqlTable("weekly_reports", {
  id: serial("id").primaryKey(),
  weekStart: varchar("week_start", { length: 10 }).notNull(),
  weekEnd: varchar("week_end", { length: 10 }).notNull(),
  // 汇总数据
  totalRevenue: int("total_revenue").default(0),
  privateClassTotal: int("private_class_total").default(0),
  groupClassTotal: int("group_class_total").default(0),
  totalClasses: int("total_classes").default(0),
  reviewTotal: int("review_total").default(0),
  reviewMeituanTotal: int("review_meituan_total").default(0),
  reviewDianpingTotal: int("review_dianping_total").default(0),
  newConsultTotal: int("new_consult_total").default(0),
  newExperienceTotal: int("new_experience_total").default(0),
  newDealCount: int("new_deal_count").default(0),
  oldDealCount: int("old_deal_count").default(0),
  lowClassMemberCount: int("low_class_member_count").default(0),
  // 生成的文案
  generatedText: text("generated_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type WeeklyReport = typeof weeklyReports.$inferSelect;
export type InsertWeeklyReport = typeof weeklyReports.$inferInsert;

/**
 * 周报业绩明细
 */
export const weeklyRevenueItems = mysqlTable("weekly_revenue_items", {
  id: serial("id").primaryKey(),
  weeklyReportId: bigint("weekly_report_id", {
    mode: "number",
    unsigned: true,
  }).notNull(),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  amount: int("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WeeklyRevenueItem = typeof weeklyRevenueItems.$inferSelect;
export type InsertWeeklyRevenueItem = typeof weeklyRevenueItems.$inferInsert;

/**
 * 周报课量明细（每位老师）
 */
export const weeklyClassItems = mysqlTable("weekly_class_items", {
  id: serial("id").primaryKey(),
  weeklyReportId: bigint("weekly_report_id", {
    mode: "number",
    unsigned: true,
  }).notNull(),
  teacherName: varchar("teacher_name", { length: 50 }).notNull(),
  privateCount: int("private_count").default(0),
  groupCount: int("group_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WeeklyClassItem = typeof weeklyClassItems.$inferSelect;
export type InsertWeeklyClassItem = typeof weeklyClassItems.$inferInsert;

/**
 * 周报低课量会员明细
 */
export const weeklyLowClassMembers = mysqlTable("weekly_low_class_members", {
  id: serial("id").primaryKey(),
  weeklyReportId: bigint("weekly_report_id", {
    mode: "number",
    unsigned: true,
  }).notNull(),
  memberName: varchar("member_name", { length: 100 }).notNull(),
  remainingClasses: int("remaining_classes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WeeklyLowClassMember = typeof weeklyLowClassMembers.$inferSelect;
export type InsertWeeklyLowClassMember = typeof weeklyLowClassMembers.$inferInsert;
