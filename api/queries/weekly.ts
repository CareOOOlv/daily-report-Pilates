import { getDb } from "./connection";
import {
  weeklyReports,
  weeklyRevenueItems,
  weeklyClassItems,
  weeklyLowClassMembers,
} from "@db/schema";
import { eq, and } from "drizzle-orm";
import type {
  InsertWeeklyReport,
  InsertWeeklyRevenueItem,
  InsertWeeklyClassItem,
  InsertWeeklyLowClassMember,
} from "@db/schema";

/**
 * 根据周区间获取周报
 */
export async function getWeeklyReportByRange(
  weekStart: string,
  weekEnd: string
) {
  return getDb().query.weeklyReports.findFirst({
    where: and(
      eq(weeklyReports.weekStart, weekStart),
      eq(weeklyReports.weekEnd, weekEnd)
    ),
    with: {
      revenueItems: true,
      classItems: true,
      lowClassMembers: true,
    },
  });
}

/**
 * 获取所有周报列表
 */
export async function getWeeklyReports() {
  return getDb().query.weeklyReports.findMany({
    orderBy: (reports, { desc }) => [desc(reports.weekStart)],
  });
}

/**
 * 创建或更新周报主表
 */
export async function upsertWeeklyReport(data: {
  weekStart: string;
  weekEnd: string;
  totalRevenue?: number;
  privateClassTotal?: number;
  groupClassTotal?: number;
  totalClasses?: number;
  reviewTotal?: number;
  reviewMeituanTotal?: number;
  reviewDianpingTotal?: number;
  newConsultTotal?: number;
  newExperienceTotal?: number;
  newDealCount?: number;
  oldDealCount?: number;
  lowClassMemberCount?: number;
  generatedText?: string | null;
}) {
  const existing = await getWeeklyReportByRange(data.weekStart, data.weekEnd);

  if (existing) {
    await getDb()
      .update(weeklyReports)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(weeklyReports.id, existing.id));
    return { ...existing, ...data };
  } else {
    const result = await getDb()
      .insert(weeklyReports)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as InsertWeeklyReport)
      .$returningId();
    const newReport = await getDb().query.weeklyReports.findFirst({
      where: eq(weeklyReports.id, result[0].id),
    });
    return newReport;
  }
}

/**
 * 添加业绩条目
 */
export async function addRevenueItem(data: {
  weeklyReportId: number;
  customerName: string;
  amount: number;
}) {
  const result = await getDb()
    .insert(weeklyRevenueItems)
    .values(data as InsertWeeklyRevenueItem)
    .$returningId();
  return getDb().query.weeklyRevenueItems.findFirst({
    where: eq(weeklyRevenueItems.id, result[0].id),
  });
}

/**
 * 删除周报下的所有业绩条目
 */
export async function clearRevenueItems(weeklyReportId: number) {
  await getDb()
    .delete(weeklyRevenueItems)
    .where(eq(weeklyRevenueItems.weeklyReportId, weeklyReportId));
}

/**
 * 添加课量条目
 */
export async function addClassItem(data: {
  weeklyReportId: number;
  teacherName: string;
  privateCount: number;
  groupCount: number;
}) {
  const result = await getDb()
    .insert(weeklyClassItems)
    .values(data as InsertWeeklyClassItem)
    .$returningId();
  return getDb().query.weeklyClassItems.findFirst({
    where: eq(weeklyClassItems.id, result[0].id),
  });
}

/**
 * 删除周报下的所有课量条目
 */
export async function clearClassItems(weeklyReportId: number) {
  await getDb()
    .delete(weeklyClassItems)
    .where(eq(weeklyClassItems.weeklyReportId, weeklyReportId));
}

/**
 * 添加低课量会员
 */
export async function addLowClassMember(data: {
  weeklyReportId: number;
  memberName: string;
  remainingClasses: number;
}) {
  const result = await getDb()
    .insert(weeklyLowClassMembers)
    .values(data as InsertWeeklyLowClassMember)
    .$returningId();
  return getDb().query.weeklyLowClassMembers.findFirst({
    where: eq(weeklyLowClassMembers.id, result[0].id),
  });
}

/**
 * 删除周报下的所有低课量会员
 */
export async function clearLowClassMembers(weeklyReportId: number) {
  await getDb()
    .delete(weeklyLowClassMembers)
    .where(eq(weeklyLowClassMembers.weeklyReportId, weeklyReportId));
}

/**
 * 获取周报完整数据（包含所有关联明细）
 */
export async function getWeeklyReportWithDetails(id: number) {
  return getDb().query.weeklyReports.findFirst({
    where: eq(weeklyReports.id, id),
    with: {
      revenueItems: true,
      classItems: true,
      lowClassMembers: true,
    },
  });
}

/**
 * 删除周报及其所有关联数据
 */
export async function deleteWeeklyReport(id: number) {
  await clearRevenueItems(id);
  await clearClassItems(id);
  await clearLowClassMembers(id);
  await getDb().delete(weeklyReports).where(eq(weeklyReports.id, id));
}
