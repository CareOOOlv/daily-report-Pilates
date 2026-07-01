import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ReportSheet } from "@/components/ReportSheet";
import { generateWeeklyText } from "@/utils/reportText";
import {
  getWeeklyReportByRange,
  upsertWeeklyReport,
  getDailyReportsInRange,
} from "@/utils/storage";
import { useAutoSave } from "@/hooks/useAutoSave";
import { ChevronLeft, ChevronRight, FileText, Plus, Trash2, Save } from "lucide-react";
import {
  getMondayOfWeek,
  getSundayOfWeek,
  toISODate,
} from "@/utils/reportText";
import { addWeeks, subWeeks } from "date-fns";

const TEACHERS = ["蕾蕾", "莉莉", "君君"];

export default function WeeklyReport() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const weekStart = toISODate(getMondayOfWeek(currentWeek));
  const weekEnd = toISODate(getSundayOfWeek(currentWeek));

  // Form states
  const [revenueItems, setRevenueItems] = useState<
    { customerName: string; amount: string }[]
  >([]);
  const [classData, setClassData] = useState<
    Record<string, { privateCount: string; groupCount: string }>
  >({
    蕾蕾: { privateCount: "", groupCount: "" },
    莉莉: { privateCount: "", groupCount: "" },
    君君: { privateCount: "", groupCount: "" },
  });
  const [newDealCount, setNewDealCount] = useState("");
  const [oldDealCount, setOldDealCount] = useState("");
  const [lowClassMembers, setLowClassMembers] = useState<
    { memberName: string; remainingClasses: string }[]
  >([]);

  // Auto-computed values from daily reports
  const weekDailyReports = getDailyReportsInRange(weekStart, weekEnd);

  const autoSummary = {
    reviewTotal:
      weekDailyReports?.reduce((s, r) => s + (r.reviewCount || 0), 0) || 0,
    reviewMeituanTotal:
      weekDailyReports?.reduce(
        (s, r) =>
          s +
          (r.reviewDetails?.filter((d) => d.platform === "meituan").length ||
            0),
        0
      ) || 0,
    reviewDianpingTotal:
      weekDailyReports?.reduce(
        (s, r) =>
          s +
          (r.reviewDetails?.filter((d) => d.platform === "dianping").length ||
            0),
        0
      ) || 0,
    newConsultTotal:
      weekDailyReports?.reduce((s, r) => s + (r.newConsultCount || 0), 0) || 0,
    newExperienceTotal:
      weekDailyReports?.reduce(
        (s, r) => s + (r.newExperienceCount || 0),
        0
      ) || 0,
    privateClassTotal:
      weekDailyReports?.reduce(
        (s, r) => s + (r.privateClassCount || 0),
        0
      ) || 0,
    groupClassTotal:
      weekDailyReports?.reduce(
        (s, r) => s + (r.groupClassCount || 0),
        0
      ) || 0,
  };

  // Load existing data when week changes
  useEffect(() => {
    const existingReport = getWeeklyReportByRange(weekStart, weekEnd);
    if (existingReport) {
      setRevenueItems(
        existingReport.revenueItems?.map((r) => ({
          customerName: r.customerName,
          amount: String(r.amount),
        })) || []
      );
      const classMap: Record<
        string,
        { privateCount: string; groupCount: string }
      > = {};
      existingReport.classItems?.forEach((c) => {
        classMap[c.teacherName] = {
          privateCount: String(c.privateCount || 0),
          groupCount: String(c.groupCount || 0),
        };
      });
      setClassData((prev) => ({ ...prev, ...classMap }));
      setNewDealCount(String(existingReport.newDealCount || ""));
      setOldDealCount(String(existingReport.oldDealCount || ""));
      setLowClassMembers(
        existingReport.lowClassMembers?.map((m) => ({
          memberName: m.memberName,
          remainingClasses: String(m.remainingClasses),
        })) || []
      );
    } else {
      resetForm();
    }
  }, [weekStart, weekEnd]);

  const resetForm = () => {
    setRevenueItems([]);
    setClassData({
      蕾蕾: { privateCount: "", groupCount: "" },
      莉莉: { privateCount: "", groupCount: "" },
      君君: { privateCount: "", groupCount: "" },
    });
    setNewDealCount("");
    setOldDealCount("");
    setLowClassMembers([]);
  };

  // Revenue handlers
  const addRevenueItem = () => {
    setRevenueItems([...revenueItems, { customerName: "", amount: "" }]);
  };

  const updateRevenueItem = (
    index: number,
    field: "customerName" | "amount",
    value: string
  ) => {
    const updated = [...revenueItems];
    updated[index] = { ...updated[index], [field]: value };
    setRevenueItems(updated);
  };

  const removeRevenueItem = (index: number) => {
    setRevenueItems(revenueItems.filter((_, i) => i !== index));
  };

  const totalRevenue = revenueItems.reduce(
    (sum, item) => sum + (parseInt(item.amount) || 0),
    0
  );

  // Class handlers
  const updateClassData = (
    teacher: string,
    field: "privateCount" | "groupCount",
    value: string
  ) => {
    setClassData((prev) => ({
      ...prev,
      [teacher]: { ...prev[teacher], [field]: value },
    }));
  };

  const privateClassTotal = TEACHERS.reduce(
    (sum, t) => sum + (parseInt(classData[t]?.privateCount) || 0),
    0
  );
  const groupClassTotal = TEACHERS.reduce(
    (sum, t) => sum + (parseInt(classData[t]?.groupCount) || 0),
    0
  );
  const totalClasses = privateClassTotal + groupClassTotal;

  // Low class member handlers
  const addLowClassMember = () => {
    setLowClassMembers([
      ...lowClassMembers,
      { memberName: "", remainingClasses: "" },
    ]);
  };

  const updateLowClassMember = (
    index: number,
    field: "memberName" | "remainingClasses",
    value: string
  ) => {
    const updated = [...lowClassMembers];
    updated[index] = { ...updated[index], [field]: value };
    setLowClassMembers(updated);
  };

  const removeLowClassMember = (index: number) => {
    setLowClassMembers(lowClassMembers.filter((_, i) => i !== index));
  };

  const lowClassCount = lowClassMembers.filter(
    (m) => parseInt(m.remainingClasses) > 0
  ).length;

  // Deal rate
  const newDealRate =
    autoSummary.newExperienceTotal > 0
      ? Math.round(
          ((parseInt(newDealCount) || 0) / autoSummary.newExperienceTotal) * 100
        )
      : 0;

  // ===== 自动保存逻辑 =====
  const doSave = useCallback(() => {
    upsertWeeklyReport({
      weekStart,
      weekEnd,
      totalRevenue,
      privateClassTotal,
      groupClassTotal,
      totalClasses,
      reviewTotal: autoSummary.reviewTotal,
      reviewMeituanTotal: autoSummary.reviewMeituanTotal,
      reviewDianpingTotal: autoSummary.reviewDianpingTotal,
      newConsultTotal: autoSummary.newConsultTotal,
      newExperienceTotal: autoSummary.newExperienceTotal,
      newDealCount: parseInt(newDealCount) || 0,
      oldDealCount: parseInt(oldDealCount) || 0,
      lowClassMemberCount: lowClassCount,
      revenueItems: revenueItems
        .filter((r) => r.customerName.trim())
        .map((r) => ({
          customerName: r.customerName,
          amount: parseInt(r.amount) || 0,
        })),
      classItems: TEACHERS.map((t) => ({
        teacherName: t,
        privateCount: parseInt(classData[t]?.privateCount) || 0,
        groupCount: parseInt(classData[t]?.groupCount) || 0,
      })),
      lowClassMembers: lowClassMembers
        .filter((m) => m.memberName.trim())
        .map((m) => ({
          memberName: m.memberName,
          remainingClasses: parseInt(m.remainingClasses) || 0,
        })),
    });

    const now = new Date();
    setLastSavedAt(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`);
  }, [
    weekStart, weekEnd, totalRevenue, privateClassTotal, groupClassTotal,
    totalClasses, autoSummary, newDealCount, oldDealCount, lowClassCount,
    revenueItems, classData, lowClassMembers,
  ]);

  // 监听所有表单数据变化，自动保存
  useAutoSave(
    doSave,
    [
      weekStart,
      revenueItems,
      classData,
      newDealCount,
      oldDealCount,
      lowClassMembers,
    ],
    1500
  );

  const handleGenerate = useCallback(() => {
    doSave();

    const text = generateWeeklyText({
      weekStart,
      weekEnd,
      totalRevenue,
      revenueItems: revenueItems
        .filter((r) => r.customerName.trim())
        .map((r) => ({
          customerName: r.customerName,
          amount: parseInt(r.amount) || 0,
        })),
      classItems: TEACHERS.map((t) => ({
        teacherName: t,
        privateCount: parseInt(classData[t]?.privateCount) || 0,
        groupCount: parseInt(classData[t]?.groupCount) || 0,
      })),
      reviewTotal: autoSummary.reviewTotal,
      reviewMeituanTotal: autoSummary.reviewMeituanTotal,
      reviewDianpingTotal: autoSummary.reviewDianpingTotal,
      newConsultTotal: autoSummary.newConsultTotal,
      newExperienceTotal: autoSummary.newExperienceTotal,
      newDealCount: parseInt(newDealCount) || 0,
      newDealRate,
      oldDealCount: parseInt(oldDealCount) || 0,
      lowClassMembers: lowClassMembers
        .filter((m) => m.memberName.trim())
        .map((m) => ({
          memberName: m.memberName,
          remainingClasses: parseInt(m.remainingClasses) || 0,
        })),
    });

    setGeneratedText(text);
    setSheetOpen(true);
  }, [
    weekStart, weekEnd, totalRevenue, revenueItems, classData,
    autoSummary, newDealCount, newDealRate, oldDealCount,
    lowClassMembers, doSave,
  ]);

  const goPrevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  const shortStart = weekStart.slice(2).replace(/-/g, ".");
  const shortEnd = weekEnd.slice(2).replace(/-/g, ".");

  return (
    <div className="space-y-6">
      {/* 周区间选择 */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-[#D9D5CD]">
        <button
          onClick={goPrevWeek}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#F4F2ED] transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#6B6861]" />
        </button>
        <div className="text-center">
          <div className="text-lg font-semibold text-[#2B2926]">
            {shortStart}-{shortEnd.slice(3)}
          </div>
          <div className="text-xs text-[#6B6861]">周会数据复盘</div>
        </div>
        <button
          onClick={goNextWeek}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#F4F2ED] transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-[#6B6861]" />
        </button>
      </div>

      {/* 自动汇总数据展示 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-[#D9D5CD]">
          <div className="text-xs text-[#6B6861] mb-1">本周好评</div>
          <div className="text-2xl font-bold text-[#066B60]">
            {autoSummary.reviewTotal}
          </div>
          <div className="text-xs text-[#6B6861] mt-1">
            美团{autoSummary.reviewMeituanTotal} 点评{autoSummary.reviewDianpingTotal}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#D9D5CD]">
          <div className="text-xs text-[#6B6861] mb-1">新客咨询/体验</div>
          <div className="text-2xl font-bold text-[#066B60]">
            {autoSummary.newConsultTotal}/{autoSummary.newExperienceTotal}
          </div>
        </div>
      </div>

      {/* 自动保存状态提示 */}
      {lastSavedAt && (
        <div className="flex items-center justify-center gap-1 text-xs text-[#6B6861]">
          <Save className="w-3 h-3" />
          <span>自动保存于 {lastSavedAt}</span>
        </div>
      )}

      {/* 业绩录入 */}
      <div className="bg-white rounded-2xl p-4 border border-[#D9D5CD]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#2B2926]">业绩录入</h3>
          <span className="text-lg font-bold text-[#066B60]">
            总数：{totalRevenue}
          </span>
        </div>
        <div className="space-y-2">
          {revenueItems.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                value={item.customerName}
                onChange={(e) =>
                  updateRevenueItem(i, "customerName", e.target.value)
                }
                placeholder="客户名称"
                className="flex-1 bg-[#F4F2ED] border-[#D9D5CD] rounded-xl h-10 text-sm"
              />
              <Input
                type="number"
                value={item.amount}
                onChange={(e) =>
                  updateRevenueItem(i, "amount", e.target.value)
                }
                placeholder="金额"
                className="w-24 bg-[#F4F2ED] border-[#D9D5CD] rounded-xl h-10 text-sm text-right"
              />
              <button
                onClick={() => removeRevenueItem(i)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#6B6861] hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          onClick={addRevenueItem}
          variant="outline"
          className="mt-2 w-full h-10 rounded-xl border-dashed border-[#D9D5CD] text-[#6B6861] hover:bg-[#F4F2ED]"
        >
          <Plus className="w-4 h-4 mr-1" />
          添加业绩
        </Button>
      </div>

      {/* 课量录入表 */}
      <div className="bg-white rounded-2xl p-4 border border-[#D9D5CD]">
        <h3 className="text-sm font-semibold text-[#2B2926] mb-3">
          课量统计
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#D9D5CD]">
                <th className="text-left py-2 text-[#6B6861] font-normal">
                  教师
                </th>
                {TEACHERS.map((t) => (
                  <th
                    key={t}
                    className="text-center py-2 text-[#2B2926] font-medium"
                  >
                    {t}
                  </th>
                ))}
                <th className="text-center py-2 text-[#066B60] font-semibold">
                  共
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#E9E5DD]">
                <td className="py-3 text-[#6B6861]">私教</td>
                {TEACHERS.map((t) => (
                  <td key={t} className="py-2 px-1">
                    <Input
                      type="number"
                      value={classData[t]?.privateCount || ""}
                      onChange={(e) =>
                        updateClassData(t, "privateCount", e.target.value)
                      }
                      className="w-full bg-[#F4F2ED] border-[#D9D5CD] rounded-lg h-9 text-center text-sm"
                    />
                  </td>
                ))}
                <td className="text-center py-3 font-bold text-[#066B60]">
                  {privateClassTotal}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-[#6B6861]">小班</td>
                {TEACHERS.map((t) => (
                  <td key={t} className="py-2 px-1">
                    <Input
                      type="number"
                      value={classData[t]?.groupCount || ""}
                      onChange={(e) =>
                        updateClassData(t, "groupCount", e.target.value)
                      }
                      className="w-full bg-[#F4F2ED] border-[#D9D5CD] rounded-lg h-9 text-center text-sm"
                    />
                  </td>
                ))}
                <td className="text-center py-3 font-bold text-[#066B60]">
                  {groupClassTotal}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 pt-3 border-t border-[#E9E5DD] text-center">
          <span className="text-sm text-[#6B6861]">合计</span>
          <span className="text-xl font-bold text-[#066B60] ml-2">
            {totalClasses}
          </span>
        </div>
      </div>

      {/* 成交数据 */}
      <div className="bg-white rounded-2xl p-4 border border-[#D9D5CD]">
        <h3 className="text-sm font-semibold text-[#2B2926] mb-3">
          成交数据
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-[#6B6861] mb-1">新客成交</div>
            <Input
              type="number"
              value={newDealCount}
              onChange={(e) => setNewDealCount(e.target.value)}
              placeholder="0"
              className="bg-[#F4F2ED] border-[#D9D5CD] rounded-xl h-12 text-base text-center"
            />
          </div>
          <div>
            <div className="text-xs text-[#6B6861] mb-1">老客成交</div>
            <Input
              type="number"
              value={oldDealCount}
              onChange={(e) => setOldDealCount(e.target.value)}
              placeholder="0"
              className="bg-[#F4F2ED] border-[#D9D5CD] rounded-xl h-12 text-base text-center"
            />
          </div>
        </div>
        {autoSummary.newExperienceTotal > 0 && (
          <div className="mt-3 text-center">
            <span className="text-sm text-[#6B6861]">新客成交率：</span>
            <span className="text-lg font-bold text-[#066B60]">
              {newDealRate}%
            </span>
          </div>
        )}
      </div>

      {/* 低课量会员 */}
      <div className="bg-white rounded-2xl p-4 border border-[#D9D5CD]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#2B2926]">
            低于5节课会员
          </h3>
          <Badge className="bg-[#D96C4A] text-white hover:bg-[#C55A3A]">
            {lowClassCount}人
          </Badge>
        </div>
        <div className="space-y-2">
          {lowClassMembers.map((member, i) => (
            <div
              key={i}
              className={`flex gap-2 items-center p-2 rounded-xl ${
                parseInt(member.remainingClasses) <= 5 &&
                member.remainingClasses !== ""
                  ? "bg-orange-50"
                  : ""
              }`}
            >
              <Input
                value={member.memberName}
                onChange={(e) =>
                  updateLowClassMember(i, "memberName", e.target.value)
                }
                placeholder="会员名称"
                className="flex-1 bg-[#F4F2ED] border-[#D9D5CD] rounded-xl h-10 text-sm"
              />
              <Input
                type="number"
                value={member.remainingClasses}
                onChange={(e) =>
                  updateLowClassMember(i, "remainingClasses", e.target.value)
                }
                placeholder="剩余课数"
                className={`w-24 rounded-xl h-10 text-sm text-center ${
                  parseInt(member.remainingClasses) <= 5 &&
                  member.remainingClasses !== ""
                    ? "border-[#D96C4A] bg-orange-50"
                    : "bg-[#F4F2ED] border-[#D9D5CD]"
                }`}
              />
              <button
                onClick={() => removeLowClassMember(i)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#6B6861] hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          onClick={addLowClassMember}
          variant="outline"
          className="mt-2 w-full h-10 rounded-xl border-dashed border-[#D9D5CD] text-[#6B6861] hover:bg-[#F4F2ED]"
        >
          <Plus className="w-4 h-4 mr-1" />
          添加会员
        </Button>
      </div>

      {/* 生成文案按钮 */}
      <div className="pt-4 pb-8">
        <Button
          onClick={handleGenerate}
          className="w-full h-14 rounded-2xl bg-[#066B60] hover:bg-[#05564D] text-base font-semibold shadow-lg"
        >
          <FileText className="w-5 h-5 mr-2" />
          生成周报文案
        </Button>
      </div>

      {/* 文案弹窗 */}
      <ReportSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={`${shortStart}-${shortEnd.slice(3)}周报`}
        content={generatedText}
      />
    </div>
  );
}
