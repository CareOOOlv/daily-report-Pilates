import { getDb } from "../api/queries/connection";
import { dailyReports, weeklyReports, weeklyRevenueItems, weeklyClassItems, weeklyLowClassMembers } from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("开始导入初始数据...");

  // 清理可能存在的旧数据
  const existingDaily = await getDb().query.dailyReports.findMany();
  if (existingDaily.length > 0) {
    console.log(`清理 ${existingDaily.length} 条已有日报记录...`);
    for (const r of existingDaily) {
      await getDb().delete(dailyReports).where(eq(dailyReports.id, r.id));
    }
  }

  const existingWeekly = await getDb().query.weeklyReports.findMany();
  if (existingWeekly.length > 0) {
    console.log(`清理 ${existingWeekly.length} 条已有周报记录...`);
    for (const w of existingWeekly) {
      await getDb().delete(weeklyLowClassMembers).where(eq(weeklyLowClassMembers.weeklyReportId, w.id));
      await getDb().delete(weeklyClassItems).where(eq(weeklyClassItems.weeklyReportId, w.id));
      await getDb().delete(weeklyRevenueItems).where(eq(weeklyRevenueItems.weeklyReportId, w.id));
      await getDb().delete(weeklyReports).where(eq(weeklyReports.id, w.id));
    }
  }

  // ===== 1. 导入6月22日日报 =====
  console.log("导入6月22日日报...");

  const dailyResult = await getDb().insert(dailyReports).values({
    reportDate: "2026-06-22",
    newExperienceNames: "郑女士，黄女士，张女士",
    newExperienceCount: 3,
    monthExperienceTotal: 16,
    newConsultNames: "郑女士",
    newConsultCount: 1,
    monthConsultTotal: 23,
    invitationNames: "王娟，Rita石，孙女士，陈宇，朵拉",
    invitationCount: 5,
    reviewDetails: [
      { name: "郑女士", platform: "meituan" as const },
      { name: "张女士", platform: "meituan" as const },
      { name: "黄女士", platform: "dianping" as const },
    ],
    reviewCount: 3,
    monthReviewTotal: 33,
    photoNames: "菲菲，郑玉婷，梦怡",
    photoCount: 3,
    privateClassCount: 6,
    groupClassCount: 1,
    totalClassCount: 7,
    monthTotalClasses: 171,
    xiaohongshu: false,
    shipinhao: false,
    douyin: false,
    createdAt: new Date("2026-06-22T20:00:00"),
    updatedAt: new Date("2026-06-22T20:00:00"),
  }).$returningId();

  console.log(`✅ 日报导入成功，ID: ${dailyResult[0].id}`);

  // ===== 2. 导入6月15-21日周报 =====
  console.log("导入6月15-21日周报...");

  const weeklyResult = await getDb().insert(weeklyReports).values({
    weekStart: "2026-06-15",
    weekEnd: "2026-06-21",
    totalRevenue: 10580,
    privateClassTotal: 45,
    groupClassTotal: 12,
    totalClasses: 57,
    reviewTotal: 9,
    reviewMeituanTotal: 4,
    reviewDianpingTotal: 5,
    newConsultTotal: 8,
    newExperienceTotal: 7,
    newDealCount: 4,
    oldDealCount: 0,
    lowClassMemberCount: 23,
    createdAt: new Date("2026-06-21T20:00:00"),
    updatedAt: new Date("2026-06-21T20:00:00"),
  }).$returningId();

  const weeklyId = weeklyResult[0].id;
  console.log(`✅ 周报主表导入成功，ID: ${weeklyId}`);

  // 业绩明细
  await getDb().insert(weeklyRevenueItems).values([
    { weeklyReportId: weeklyId, customerName: "王娟", amount: 3080 },
    { weeklyReportId: weeklyId, customerName: "欢凯", amount: 7500 },
  ]);
  console.log("✅ 业绩明细导入成功");

  // 课量明细
  await getDb().insert(weeklyClassItems).values([
    { weeklyReportId: weeklyId, teacherName: "蕾蕾", privateCount: 20, groupCount: 3 },
    { weeklyReportId: weeklyId, teacherName: "莉莉", privateCount: 12, groupCount: 6 },
    { weeklyReportId: weeklyId, teacherName: "君君", privateCount: 13, groupCount: 3 },
  ]);
  console.log("✅ 课量明细导入成功");

  // 低课量会员 - 解析文本
  const lowClassText = "聂闪闪3胡译丰1 何晨曦3 楠楠2（小班0）七七3 金娜4 婷婷1 徐敏捷2 宣扬4 yanice1 刘倩楠1 潘婧2 姚凯琳1 张张1 马凯利2 铭悦2 梧桐4 高肖潇赵爽余额不足 alicia3 白云儿1 刘女士1 柠檬星4 梧桐4 碧淇4 金丽丽4 陈宇5";

  // 解析会员名单
  const members: { name: string; classes: number }[] = [];

  // 处理 "高肖潇赵爽余额不足" 这个特殊情况
  const specialPart = "高肖潇赵爽余额不足";
  const normalPart = lowClassText.replace(specialPart, "");

  // 解析普通部分: 名字 + 数字
  const regex = /([\u4e00-\u9fa5a-zA-Z]+)(\d+)/g;
  let match;
  while ((match = regex.exec(normalPart)) !== null) {
    const name = match[1].trim();
    const num = parseInt(match[2]);
    if (name && !isNaN(num)) {
      members.push({ name, classes: num });
    }
  }

  // 添加特殊解析的成员
  members.push({ name: "高肖潇", classes: 0 });
  members.push({ name: "赵爽", classes: 0 });

  // 去重（梧桐出现了两次）
  const seen = new Set<string>();
  const uniqueMembers = members.filter((m) => {
    if (seen.has(m.name)) return false;
    seen.add(m.name);
    return true;
  });

  // 插入低课量会员
  if (uniqueMembers.length > 0) {
    await getDb().insert(weeklyLowClassMembers).values(
      uniqueMembers.map((m) => ({
        weeklyReportId: weeklyId,
        memberName: m.name,
        remainingClasses: m.classes,
      }))
    );
  }

  console.log(`✅ 低课量会员导入成功，共 ${uniqueMembers.length} 人`);

  // 打印导入的会员列表供核对
  console.log("导入的会员列表:");
  uniqueMembers.forEach((m) => {
    console.log(`  - ${m.name}: ${m.classes}节课`);
  });

  console.log("\n🎉 所有初始数据导入完成！");
  console.log("系统已准备就绪，明天（6月23日）开始正式使用。");
}

seed().catch((err) => {
  console.error("导入失败:", err);
  process.exit(1);
});
