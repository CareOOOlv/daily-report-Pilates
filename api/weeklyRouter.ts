import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  getWeeklyReportByRange,
  getWeeklyReports,
  upsertWeeklyReport,
  addRevenueItem,
  addClassItem,
  addLowClassMember,
  clearRevenueItems,
  clearClassItems,
  clearLowClassMembers,
  getWeeklyReportWithDetails,
  deleteWeeklyReport,
} from "./queries/weekly";

export const weeklyRouter = createRouter({
  /**
   * 获取指定周区间的周报
   */
  getByRange: publicQuery
    .input(
      z.object({
        weekStart: z.string(),
        weekEnd: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getWeeklyReportByRange(input.weekStart, input.weekEnd);
    }),

  /**
   * 获取周报列表
   */
  list: publicQuery.query(async () => {
    return getWeeklyReports();
  }),

  /**
   * 获取周报详情
   */
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getWeeklyReportWithDetails(input.id);
    }),

  /**
   * 创建或更新周报（含所有关联数据）
   */
  upsert: publicQuery
    .input(
      z.object({
        weekStart: z.string(),
        weekEnd: z.string(),
        totalRevenue: z.number().optional(),
        privateClassTotal: z.number().optional(),
        groupClassTotal: z.number().optional(),
        totalClasses: z.number().optional(),
        reviewTotal: z.number().optional(),
        reviewMeituanTotal: z.number().optional(),
        reviewDianpingTotal: z.number().optional(),
        newConsultTotal: z.number().optional(),
        newExperienceTotal: z.number().optional(),
        newDealCount: z.number().optional(),
        oldDealCount: z.number().optional(),
        lowClassMemberCount: z.number().optional(),
        generatedText: z.string().nullable().optional(),
        revenueItems: z
          .array(
            z.object({
              customerName: z.string(),
              amount: z.number(),
            })
          )
          .optional(),
        classItems: z
          .array(
            z.object({
              teacherName: z.string(),
              privateCount: z.number(),
              groupCount: z.number(),
            })
          )
          .optional(),
        lowClassMembers: z
          .array(
            z.object({
              memberName: z.string(),
              remainingClasses: z.number(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const {
        revenueItems,
        classItems,
        lowClassMembers,
        ...reportData
      } = input;

      // 1. 先保存主表
      let report = await upsertWeeklyReport(reportData);
      if (!report) throw new Error("Failed to create/update weekly report");

      // 2. 清除旧关联数据
      await clearRevenueItems(report.id);
      await clearClassItems(report.id);
      await clearLowClassMembers(report.id);

      // 3. 插入新的关联数据
      if (revenueItems && revenueItems.length > 0) {
        for (const item of revenueItems) {
          await addRevenueItem({
            weeklyReportId: report.id,
            ...item,
          });
        }
      }

      if (classItems && classItems.length > 0) {
        for (const item of classItems) {
          await addClassItem({
            weeklyReportId: report.id,
            ...item,
          });
        }
      }

      if (lowClassMembers && lowClassMembers.length > 0) {
        for (const item of lowClassMembers) {
          await addLowClassMember({
            weeklyReportId: report.id,
            ...item,
          });
        }
      }

      // 4. 返回完整数据
      return getWeeklyReportWithDetails(report.id);
    }),

  /**
   * 删除周报
   */
  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteWeeklyReport(input.id);
      return { success: true };
    }),
});
