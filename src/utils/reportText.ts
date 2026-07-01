/**
 * 生成日报文案
 */
export function generateDailyText(data: {
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
}): string {
  const dateParts = data.reportDate.split("-");
  const shortDate = `${dateParts[0].slice(2)}.${dateParts[1]}.${dateParts[2]}`;

  const namesList = (names?: string | null) => {
    if (!names || names.trim() === "") return "无";
    return names;
  };

  const reviewNames = (details?: { name: string; platform: "meituan" | "dianping" }[] | null) => {
    if (!details || details.length === 0) return "无";
    return details.map((d) => d.name).join("，");
  };

  const photoList = (names?: string | null) => {
    if (!names || names.trim() === "") return "无";
    return names;
  };

  const socialText = () => {
    const items: string[] = [];
    if (data.xiaohongshu) items.push("小红书已发");
    if (data.shipinhao) items.push("视频号已发");
    if (data.douyin) items.push("抖音已发");
    if (items.length === 0) return "未拍摄，没有视频素材。未发";
    return items.join("，");
  };

  return `${shortDate}运营数据日报总结：
1、新客体验（每周标准至少3个）：${data.newExperienceCount || 0}（${namesList(data.newExperienceNames)}）
（6月总数：${data.monthExperienceTotal || 0}）
2、新客咨询（每周标准至少5个）：${data.newConsultCount || 0}（${namesList(data.newConsultNames)}）
（6月总数：${data.monthConsultTotal || 0}）
3、每日课程邀约会员数（每天标准至少5个）：${data.invitationCount || 0}（${namesList(data.invitationNames)}）
4、好评数（每日标准至少2个）：${data.reviewCount || 0}（${reviewNames(data.reviewDetails)}）
（6月总数：${data.monthReviewTotal || 0}）
5、优质会员课美照/视频数（每天至少给3个会员发送）：${data.photoCount || 0}（${photoList(data.photoNames)}）
6、小班课量：${data.groupClassCount || 0}
7、私教课量：${data.privateClassCount || 0}
8、每日总课量：${data.totalClassCount || 0}
9、本月总课量：${data.monthTotalClasses || 0}
10、小红书、视频号、抖音每天各至少一个优质视频：${socialText()}`;
}

/**
 * 生成周报文案
 */
export function generateWeeklyText(data: {
  weekStart: string;
  weekEnd: string;
  totalRevenue?: number;
  revenueItems?: { customerName: string; amount: number }[];
  classItems?: { teacherName: string; privateCount: number; groupCount: number }[];
  reviewTotal?: number;
  reviewMeituanTotal?: number;
  reviewDianpingTotal?: number;
  newConsultTotal?: number;
  newExperienceTotal?: number;
  newDealCount?: number;
  newDealRate?: number;
  oldDealCount?: number;
  lowClassMembers?: { memberName: string; remainingClasses: number }[];
}): string {
  const startParts = data.weekStart.split("-");
  const endParts = data.weekEnd.split("-");
  const shortStart = `${startParts[0].slice(2)}.${startParts[1]}.${startParts[2]}`;
  const shortEnd = `${endParts[0].slice(2)}.${endParts[1]}.${endParts[2]}`;

  const revenueLines =
    data.revenueItems && data.revenueItems.length > 0
      ? data.revenueItems
          .map((item, i) => `${i + 1}、${item.customerName}：${item.amount}`)
          .join("\n")
      : "无";

  const totalRevenue = data.totalRevenue || 0;

  // 课量统计
  const privateTotal =
    data.classItems?.reduce((sum, t) => sum + (t.privateCount || 0), 0) || 0;
  const groupTotal =
    data.classItems?.reduce((sum, t) => sum + (t.groupCount || 0), 0) || 0;

  const classLines = data.classItems
    ?.map(
      (t) =>
        `${t.teacherName}私教${t.privateCount || 0}小班${t.groupCount || 0}`
    )
    .join(" ");

  const lowClassLines =
    data.lowClassMembers && data.lowClassMembers.length > 0
      ? data.lowClassMembers
          .map((m) => `${m.memberName}${m.remainingClasses}`)
          .join(" ")
      : "无";

  const dealRate = data.newDealRate ?? 0;

  return `${shortStart}-${shortEnd.slice(3)}周会数据复盘
一、业绩：
${revenueLines}
总数：${totalRevenue}

二、课量：
私教 ${classLines}共${privateTotal}
小班 ${classLines}共${groupTotal}
合计${privateTotal + groupTotal}

三、好评：${data.reviewTotal || 0}
美团${data.reviewMeituanTotal || 0}点评${data.reviewDianpingTotal || 0}

四、新客咨询：${data.newConsultTotal || 0}

五、新客体验：${data.newExperienceTotal || 0}

六、新客成交：${data.newDealCount || 0}

七、新客成交率：${dealRate}%

八、老客成交：${data.oldDealCount || 0}

九、低于5节课会员名单：${data.lowClassMembers?.length || 0}
${lowClassLines}`;
}

/**
 * 格式化日期为短格式
 */
export function formatShortDate(dateStr: string): string {
  const parts = dateStr.split("-");
  return `${parts[0].slice(2)}.${parts[1]}.${parts[2]}`;
}

/**
 * 获取本周一的日期
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 获取本周日的日期
 */
export function getSundayOfWeek(date: Date): Date {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

/**
 * 日期转 YYYY-MM-DD
 */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
