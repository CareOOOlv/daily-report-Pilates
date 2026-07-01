import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  getDailyReportByDate,
  getDailyReportsInRange,
  upsertDailyReport,
  getMonthReportsUpTo,
} from "./queries/daily";

export const dailyRouter = createRouter({
  /**
   * 获取指定日期的日报
   */
  getByDate: publicQuery
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      return getDailyReportByDate(input.date);
    }),

  /**
   * 获取日期范围内的日报（用于周报汇总）
   */
  getInRange: publicQuery
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getDailyReportsInRange(input.startDate, input.endDate);
    }),

  /**
   * 获取月度累计数据（截至某日）
   */
  getMonthTotals: publicQuery
    .input(
      z.object({
        monthPrefix: z.string(), // e.g. "2026-06"
        upToDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const reports = await getMonthReportsUpTo(
        input.monthPrefix,
        input.upToDate
      );
      return {
        totalExperience: reports.reduce(
          (sum, r) => sum + (r.newExperienceCount || 0),
          0
        ),
        totalConsult: reports.reduce(
          (sum, r) => sum + (r.newConsultCount || 0),
          0
        ),
        totalReview: reports.reduce(
          (sum, r) => sum + (r.reviewCount || 0),
          0
        ),
        totalClasses: reports.reduce(
          (sum, r) => sum + (r.totalClassCount || 0),
          0
        ),
      };
    }),

  /**
   * 创建或更新日报
   */
  upsert: publicQuery
    .input(
      z.object({
        reportDate: z.string(),
        newExperienceNames: z.string().nullable().optional(),
        newExperienceCount: z.number().optional(),
        monthExperienceTotal: z.number().optional(),
        newConsultNames: z.string().nullable().optional(),
        newConsultCount: z.number().optional(),
        monthConsultTotal: z.number().optional(),
        invitationNames: z.string().nullable().optional(),
        invitationCount: z.number().optional(),
        reviewDetails: z
          .array(
            z.object({
              name: z.string(),
              platform: z.enum(["meituan", "dianping"]),
            })
          )
          .nullable()
          .optional(),
        reviewCount: z.number().optional(),
        monthReviewTotal: z.number().optional(),
        photoNames: z.string().nullable().optional(),
        photoCount: z.number().optional(),
        privateClassCount: z.number().optional(),
        groupClassCount: z.number().optional(),
        totalClassCount: z.number().optional(),
        monthTotalClasses: z.number().optional(),
        xiaohongshu: z.boolean().optional(),
        shipinhao: z.boolean().optional(),
        douyin: z.boolean().optional(),
        generatedText: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return upsertDailyReport(input);
    }),
});
