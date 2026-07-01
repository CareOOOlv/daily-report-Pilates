/**
 * 纯前端版本 - localStorage 数据层
 * 替代后端的 tRPC + MySQL
 */

export interface DailyReportData {
  id: number;
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
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReportData {
  id: number;
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
  revenueItems?: { customerName: string; amount: number }[];
  classItems?: { teacherName: string; privateCount: number; groupCount: number }[];
  lowClassMembers?: { memberName: string; remainingClasses: number }[];
  generatedText?: string | null;
  createdAt: string;
  updatedAt: string;
}

const DAILY_KEY = "yd_daily_reports";
const WEEKLY_KEY = "yd_weekly_reports";
const ID_COUNTER_KEY = "yd_id_counter";

let idCounter = parseInt(localStorage.getItem(ID_COUNTER_KEY) || "0", 10);

function nextId(): number {
  idCounter++;
  localStorage.setItem(ID_COUNTER_KEY, String(idCounter));
  return idCounter;
}

// ===== 日报操作 =====

export function getDailyReportByDate(date: string): DailyReportData | null {
  const all = getAllDailyReports();
  return all.find((r) => r.reportDate === date) || null;
}

export function getDailyReportsInRange(
  startDate: string,
  endDate: string
): DailyReportData[] {
  const all = getAllDailyReports();
  return all.filter((r) => r.reportDate >= startDate && r.reportDate <= endDate);
}

export function getMonthReportsUpTo(
  monthPrefix: string,
  upToDate: string
): DailyReportData[] {
  const all = getAllDailyReports();
  const startOfMonth = `${monthPrefix}-01`;
  return all.filter(
    (r) => r.reportDate >= startOfMonth && r.reportDate <= upToDate
  );
}

export function getMonthTotals(monthPrefix: string, upToDate: string) {
  const reports = getMonthReportsUpTo(monthPrefix, upToDate);
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
}

export function upsertDailyReport(
  data: Omit<DailyReportData, "id" | "createdAt" | "updatedAt">
): DailyReportData {
  const all = getAllDailyReports();
  const existingIndex = all.findIndex((r) => r.reportDate === data.reportDate);

  if (existingIndex >= 0) {
    // 更新
    const updated: DailyReportData = {
      ...all[existingIndex],
      ...data,
      id: all[existingIndex].id,
      updatedAt: new Date().toISOString(),
    };
    all[existingIndex] = updated;
    saveDailyReports(all);
    return updated;
  } else {
    // 创建
    const now = new Date().toISOString();
    const newReport: DailyReportData = {
      ...data,
      id: nextId(),
      createdAt: now,
      updatedAt: now,
    };
    all.push(newReport);
    saveDailyReports(all);
    return newReport;
  }
}

function getAllDailyReports(): DailyReportData[] {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDailyReports(reports: DailyReportData[]) {
  localStorage.setItem(DAILY_KEY, JSON.stringify(reports));
}

// ===== 周报操作 =====

export function getWeeklyReportByRange(
  weekStart: string,
  weekEnd: string
): WeeklyReportData | null {
  const all = getAllWeeklyReports();
  return (
    all.find((r) => r.weekStart === weekStart && r.weekEnd === weekEnd) || null
  );
}

export function getWeeklyReports(): WeeklyReportData[] {
  const all = getAllWeeklyReports();
  return all.sort(
    (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  );
}

export function upsertWeeklyReport(
  data: Omit<WeeklyReportData, "id" | "createdAt" | "updatedAt">
): WeeklyReportData {
  const all = getAllWeeklyReports();
  const existingIndex = all.findIndex(
    (r) => r.weekStart === data.weekStart && r.weekEnd === data.weekEnd
  );

  if (existingIndex >= 0) {
    const updated: WeeklyReportData = {
      ...all[existingIndex],
      ...data,
      id: all[existingIndex].id,
      updatedAt: new Date().toISOString(),
    };
    all[existingIndex] = updated;
    saveWeeklyReports(all);
    return updated;
  } else {
    const now = new Date().toISOString();
    const newReport: WeeklyReportData = {
      ...data,
      id: nextId(),
      createdAt: now,
      updatedAt: now,
    };
    all.push(newReport);
    saveWeeklyReports(all);
    return newReport;
  }
}

function getAllWeeklyReports(): WeeklyReportData[] {
  try {
    const raw = localStorage.getItem(WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWeeklyReports(reports: WeeklyReportData[]) {
  localStorage.setItem(WEEKLY_KEY, JSON.stringify(reports));
}

// ===== 数据导出/备份 =====

export function exportAllData(): string {
  return JSON.stringify({
    daily: getAllDailyReports(),
    weekly: getAllWeeklyReports(),
    exportedAt: new Date().toISOString(),
  });
}

export function importAllData(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.daily) saveDailyReports(data.daily);
    if (data.weekly) saveWeeklyReports(data.weekly);
    return true;
  } catch {
    return false;
  }
}

// ===== 初始化种子数据 =====

export function initSeedData() {
  const existing = getAllDailyReports();
  if (existing.length > 0) return; // 已有数据，不重复导入

  console.log("导入初始数据...");

  // 6月22日日报
  upsertDailyReport({
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
      { name: "郑女士", platform: "meituan" },
      { name: "张女士", platform: "meituan" },
      { name: "黄女士", platform: "dianping" },
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
    generatedText: null,
  });

  // 6月15-21日周报
  upsertWeeklyReport({
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
    lowClassMemberCount: 26,
    revenueItems: [
      { customerName: "王娟", amount: 3080 },
      { customerName: "欢凯", amount: 7500 },
    ],
    classItems: [
      { teacherName: "蕾蕾", privateCount: 20, groupCount: 3 },
      { teacherName: "莉莉", privateCount: 12, groupCount: 6 },
      { teacherName: "君君", privateCount: 13, groupCount: 3 },
    ],
    lowClassMembers: [
      { memberName: "聂闪闪", remainingClasses: 3 },
      { memberName: "胡译丰", remainingClasses: 1 },
      { memberName: "何晨曦", remainingClasses: 3 },
      { memberName: "楠楠", remainingClasses: 2 },
      { memberName: "七七", remainingClasses: 3 },
      { memberName: "金娜", remainingClasses: 4 },
      { memberName: "婷婷", remainingClasses: 1 },
      { memberName: "徐敏捷", remainingClasses: 2 },
      { memberName: "宣扬", remainingClasses: 4 },
      { memberName: "yanice", remainingClasses: 1 },
      { memberName: "刘倩楠", remainingClasses: 1 },
      { memberName: "潘婧", remainingClasses: 2 },
      { memberName: "姚凯琳", remainingClasses: 1 },
      { memberName: "张张", remainingClasses: 1 },
      { memberName: "马凯利", remainingClasses: 2 },
      { memberName: "铭悦", remainingClasses: 2 },
      { memberName: "梧桐", remainingClasses: 4 },
      { memberName: "高肖潇", remainingClasses: 0 },
      { memberName: "赵爽", remainingClasses: 0 },
      { memberName: "alicia", remainingClasses: 3 },
      { memberName: "白云儿", remainingClasses: 1 },
      { memberName: "刘女士", remainingClasses: 1 },
      { memberName: "柠檬星", remainingClasses: 4 },
      { memberName: "碧淇", remainingClasses: 4 },
      { memberName: "金丽丽", remainingClasses: 4 },
      { memberName: "陈宇", remainingClasses: 5 },
    ],
    generatedText: null,
  });

  console.log("初始数据导入完成！");
}
