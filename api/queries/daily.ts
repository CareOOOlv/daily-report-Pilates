import { getDb } from "./connection";
import { dailyReports } from "@db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import type { InsertDailyReport } from "@db/schema";

/**
 * 根据日期获取日报
 */
export async function getDailyReportByDate(date: string) {
  return getDb().query.dailyReports.findFirst({
    where: eq(dailyReports.reportDate, date),
  });
}

/**
 * 获取指定日期范围内的所有日报
 */
export async function getDailyReportsInRange(startDate: string, endDate: string) {
  return getDb()
    .select()
    .from(dailyReports)
    .where(
      and(
        gte(dailyReports.reportDate, startDate),
        lte(dailyReports.reportDate, endDate)
      )
    );
}

/**
 * 创建或更新日报
 * 如果该日期已有记录则更新，否则创建
 */
export async function upsertDailyReport(data: {
  reportDate: string;
  newExperienceNames?: string | null;
  newExperienceCount?: number;
  monthExperienceTotal?: number;
  newConsultNames?: string | null;
  newConsultCount?: number;
  monthConsultTotal?: number;
  invitationNames?: string | null;
  invitationCount?: number;
  reviewDetails?: { name: string; platform: "meituan" | "dianping" }[] | null;
  reviewCount?: number;
  monthReviewTotal?: number;
  photoNames?: string | null;
  photoCount?: number;
  privateClassCount?: number;
  groupClassCount?: number;
  totalClassCount?: number;
  monthTotalClasses?: number;
  xiaohongshu?: boolean;
  shipinhao?: boolean;
  douyin?: boolean;
  generatedText?: string | null;
}) {
  const existing = await getDailyReportByDate(data.reportDate);

  if (existing) {
    await getDb()
      .update(dailyReports)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(dailyReports.id, existing.id));
    return { ...existing, ...data };
  } else {
    const result = await getDb()
      .insert(dailyReports)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as InsertDailyReport)
      .$returningId();
    const newReport = await getDb().query.dailyReports.findFirst({
      where: eq(dailyReports.id, result[0].id),
    });
    return newReport;
  }
}

/**
 * 获取某月内某日期之前的日报（用于计算月累计）
 */
export async function getMonthReportsUpTo(monthPrefix: string, upToDate: string) {
  const startOfMonth = `${monthPrefix}-01`;
  return getDb()
    .select()
    .from(dailyReports)
    .where(
      and(
        gte(dailyReports.reportDate, startOfMonth),
        lte(dailyReports.reportDate, upToDate)
      )
    );
}

/**
 * 删除日报
 */
export async function deleteDailyReport(id: number) {
  await getDb().delete(dailyReports).where(eq(dailyReports.id, id));
}
