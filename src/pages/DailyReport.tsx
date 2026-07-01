import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Label } from "@/components/ui/label";
import { ReportSheet } from "@/components/ReportSheet";
import { generateDailyText } from "@/utils/reportText";
import {
  getDailyReportByDate,
  upsertDailyReport,
  getMonthTotals,
  initSeedData,
} from "@/utils/storage";
import { useAutoSave } from "@/hooks/useAutoSave";
import { ChevronLeft, ChevronRight, FileText, Save } from "lucide-react";
import { format, addDays, subDays } from "date-fns";

export default function DailyReport() {
  useEffect(() => {
    initSeedData();
  }, []);

  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Form states
  const [newExperienceInput, setNewExperienceInput] = useState("");
  const [newConsultInput, setNewConsultInput] = useState("");
  const [invitationInput, setInvitationInput] = useState("");
  const [reviewInput, setReviewInput] = useState("");
  const [reviewPlatform, setReviewPlatform] = useState<
    "meituan" | "dianping" | null
  >(null);
  const [reviewList, setReviewList] = useState<
    { name: string; platform: "meituan" | "dianping" }[]
  >([]);
  const [photoInput, setPhotoInput] = useState("");
  const [privateClass, setPrivateClass] = useState("");
  const [groupClass, setGroupClass] = useState("");
  const [xiaohongshu, setXiaohongshu] = useState(false);
  const [shipinhao, setShipinhao] = useState(false);
  const [douyin, setDouyin] = useState(false);

  // Load existing data when date changes
  useEffect(() => {
    const report = getDailyReportByDate(selectedDate);
    if (report) {
      setNewExperienceInput(report.newExperienceNames || "");
      setNewConsultInput(report.newConsultNames || "");
      setInvitationInput(report.invitationNames || "");
      setReviewList(report.reviewDetails || []);
      setPhotoInput(report.photoNames || "");
      setPrivateClass(String(report.privateClassCount || ""));
      setGroupClass(String(report.groupClassCount || ""));
      setXiaohongshu(report.xiaohongshu || false);
      setShipinhao(report.shipinhao || false);
      setDouyin(report.douyin || false);
    } else {
      resetForm();
    }
  }, [selectedDate]);

  const resetForm = () => {
    setNewExperienceInput("");
    setNewConsultInput("");
    setInvitationInput("");
    setReviewInput("");
    setReviewPlatform(null);
    setReviewList([]);
    setPhotoInput("");
    setPrivateClass("");
    setGroupClass("");
    setXiaohongshu(false);
    setShipinhao(false);
    setDouyin(false);
  };

  const monthTotals = getMonthTotals(
    selectedDate.slice(0, 7),
    selectedDate
  );

  const parseNames = (input: string): string => {
    return input
      .split(/[,，]/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0)
      .join("，");
  };

  const countNames = (input: string): number => {
    return input
      .split(/[,，]/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0).length;
  };

  // ===== 自动保存逻辑 =====
  const doSave = useCallback(() => {
    const privCount = parseInt(privateClass) || 0;
    const grpCount = parseInt(groupClass) || 0;
    const cleanNames = parseNames(newExperienceInput);
    const cleanConsult = parseNames(newConsultInput);
    const cleanInvite = parseNames(invitationInput);
    const cleanPhoto = parseNames(photoInput);

    upsertDailyReport({
      reportDate: selectedDate,
      newExperienceNames: cleanNames || null,
      newExperienceCount: countNames(newExperienceInput),
      monthExperienceTotal: monthTotals?.totalExperience || 0,
      newConsultNames: cleanConsult || null,
      newConsultCount: countNames(newConsultInput),
      monthConsultTotal: monthTotals?.totalConsult || 0,
      invitationNames: cleanInvite || null,
      invitationCount: countNames(invitationInput),
      reviewDetails: reviewList.length > 0 ? reviewList : null,
      reviewCount: reviewList.length,
      monthReviewTotal: monthTotals?.totalReview || 0,
      photoNames: cleanPhoto || null,
      photoCount: countNames(photoInput),
      privateClassCount: privCount,
      groupClassCount: grpCount,
      totalClassCount: privCount + grpCount,
      monthTotalClasses: monthTotals?.totalClasses || 0,
      xiaohongshu,
      shipinhao,
      douyin,
    });

    const now = new Date();
    setLastSavedAt(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`);
  }, [
    selectedDate, newExperienceInput, newConsultInput, invitationInput,
    reviewList, photoInput, privateClass, groupClass,
    xiaohongshu, shipinhao, douyin, monthTotals,
  ]);

  // 监听所有表单数据变化，自动保存
  useAutoSave(
    doSave,
    [
      selectedDate,
      newExperienceInput,
      newConsultInput,
      invitationInput,
      reviewList,
      photoInput,
      privateClass,
      groupClass,
      xiaohongshu,
      shipinhao,
      douyin,
    ],
    1200
  );

  const handleAddReview = () => {
    if (!reviewInput.trim() || !reviewPlatform) return;
    const names = reviewInput
      .split(/[,，]/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    const newReviews = names.map((name) => ({
      name,
      platform: reviewPlatform,
    }));
    setReviewList([...reviewList, ...newReviews]);
    setReviewInput("");
    setReviewPlatform(null);
  };

  const handleRemoveReview = (index: number) => {
    setReviewList(reviewList.filter((_, i) => i !== index));
  };

  const handleGenerate = useCallback(() => {
    doSave();

    const privCount = parseInt(privateClass) || 0;
    const grpCount = parseInt(groupClass) || 0;

    const text = generateDailyText({
      reportDate: selectedDate,
      newExperienceNames: parseNames(newExperienceInput),
      newExperienceCount: countNames(newExperienceInput),
      monthExperienceTotal: monthTotals?.totalExperience || 0,
      newConsultNames: parseNames(newConsultInput),
      newConsultCount: countNames(newConsultInput),
      monthConsultTotal: monthTotals?.totalConsult || 0,
      invitationNames: parseNames(invitationInput),
      invitationCount: countNames(invitationInput),
      reviewDetails: reviewList.length > 0 ? reviewList : null,
      reviewCount: reviewList.length,
      monthReviewTotal: monthTotals?.totalReview || 0,
      photoNames: parseNames(photoInput),
      photoCount: countNames(photoInput),
      privateClassCount: privCount,
      groupClassCount: grpCount,
      totalClassCount: privCount + grpCount,
      monthTotalClasses: monthTotals?.totalClasses || 0,
      xiaohongshu,
      shipinhao,
      douyin,
    });

    setGeneratedText(text);
    setSheetOpen(true);
  }, [
    selectedDate, newExperienceInput, newConsultInput, invitationInput,
    reviewList, photoInput, privateClass, groupClass,
    xiaohongshu, shipinhao, douyin, monthTotals, doSave,
  ]);

  const goPrevDay = () =>
    setSelectedDate(format(subDays(new Date(selectedDate), 1), "yyyy-MM-dd"));
  const goNextDay = () =>
    setSelectedDate(format(addDays(new Date(selectedDate), 1), "yyyy-MM-dd"));

  return (
    <div className="space-y-6">
      {/* 日期选择器 */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-[#D9D5CD]">
        <button
          onClick={goPrevDay}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#F4F2ED] transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#6B6861]" />
        </button>
        <div className="text-center">
          <div className="text-lg font-semibold text-[#2B2926]">
            {selectedDate.slice(5).replace("-", ".")}运营数据
          </div>
          <div className="text-xs text-[#6B6861]">{selectedDate}</div>
        </div>
        <button
          onClick={goNextDay}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#F4F2ED] transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-[#6B6861]" />
        </button>
      </div>

      {/* 本月快捷数据 + 保存状态 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-[#D9D5CD]">
          <div className="text-xs text-[#6B6861] mb-1">本月总课量</div>
          <div className="text-3xl font-bold text-[#066B60] tracking-tight">
            {monthTotals?.totalClasses ?? 0}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#D9D5CD]">
          <div className="text-xs text-[#6B6861] mb-1">新客体验(月)</div>
          <div className="text-3xl font-bold text-[#066B60] tracking-tight">
            {monthTotals?.totalExperience ?? 0}
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

      {/* 速记卡表单 */}
      <div className="space-y-4">
        {/* 新客体验 */}
        <div className="bg-white rounded-2xl p-4 border border-[#D9D5CD]">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold text-[#2B2926]">
              新客体验
              <span className="text-xs text-[#6B6861] font-normal ml-1">
                (每周标准至少3个)
              </span>
            </Label>
            <span className="text-lg font-bold text-[#066B60]">
              {countNames(newExperienceInput)}人
            </span>
          </div>
          <Input
            value={newExperienceInput}
            onChange={(e) => setNewExperienceInput(e.target.value)}
            placeholder="输入客户称呼，逗号分隔（如：郑女士，黄女士）"
            className="bg-[#F4F2ED] border-[#D9D5CD] rounded-xl h-12 text-base placeholder:text-[#9B9891]"
          />
          {monthTotals && (
            <div className="mt-2 text-xs text-[#6B6861]">
              月累计：{monthTotals.totalExperience}
            </div>
          )}
        </div>

        {/* 新客咨询 */}
        <div className="bg-white rounded-2xl p-4 border border-[#D9D5CD]">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold text-[#2B2926]">
              新客咨询
              <span className="text-xs text-[#6B6861] font-normal ml-1">
                (每周标准至少5个)
              </span>
            </Label>
            <span className="text-lg font-bold text-[#066B60]">
              {countNames(newConsultInput)}人
            </span>
          </div>
          <Input
            value={newConsultInput}
            onChange={(e) => setNewConsultInput(e.target.value)}
            placeholder="输入客户称呼，逗号分隔"
            className="bg-[#F4F2ED] border-[#D9D5CD] rounded-xl h-12 text-base placeholder:text-[#9B9891]"
          />
          {monthTotals && (
            <div className="mt-2 text-xs text-[#6B6861]">
              月累计：{monthTotals.totalConsult}
            </div>
          )}
        </div>

        {/* 课程邀约 */}
        <div className="bg-white rounded-2xl p-4 border border-[#D9D5CD]">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold text-[#2B2926]">
              课程邀约
              <span className="text-xs text-[#6B6861] font-normal ml-1">
                (每天标准至少5个)
              </span>
            </Label>
            <span className="text-lg font-bold text-[#066B60]">
              {countNames(invitationInput)}人
            </span>
          </div>
          <Input
            value={invitationInput}
            onChange={(e) => setInvitationInput(e.target.value)}
            placeholder="输入会员名称，逗号分隔"
            className="bg-[#F4F2ED] border-[#D9D5CD] rounded-xl h-12 text-base placeholder:text-[#9B9891]"
          />
        </div>

        {/* 好评 */}
        <div className="bg-white rounded-2xl p-4 border border-[#D9D5CD]">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold text-[#2B2926]">
              好评
              <span className="text-xs text-[#6B6861] font-normal ml-1">
                (每日标准至少2个)
              </span>
            </Label>
            <span className="text-lg font-bold text-[#066B60]">
              {reviewList.length}个
            </span>
          </div>
          <div className="flex gap-2 mb-2">
            <Input
              value={reviewInput}
              onChange={(e) => setReviewInput(e.target.value)}
              placeholder="输入客户名称"
              className="flex-1 bg-[#F4F2ED] border-[#D9D5CD] rounded-xl h-12 text-base placeholder:text-[#9B9891]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && reviewInput.trim()) {
                  handleAddReview();
                }
              }}
            />
          </div>
          <div className="flex gap-2 mb-2">
            <Toggle
              pressed={reviewPlatform === "meituan"}
              onPressedChange={(pressed) =>
                setReviewPlatform(pressed ? "meituan" : null)
              }
              className="rounded-lg px-4 h-9 data-[state=on]:bg-[#066B60] data-[state=on]:text-white"
            >
              美团
            </Toggle>
            <Toggle
              pressed={reviewPlatform === "dianping"}
              onPressedChange={(pressed) =>
                setReviewPlatform(pressed ? "dianping" : null)
              }
              className="rounded-lg px-4 h-9 data-[state=on]:bg-[#066B60] data-[state=on]:text-white"
            >
              点评
            </Toggle>
            <Button
              onClick={handleAddReview}
              variant="outline"
              size="sm"
              className="rounded-lg h-9 ml-auto border-[#066B60] text-[#066B60]"
            >
              添加
            </Button>
          </div>
          {reviewList.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {reviewList.map((review, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className={`cursor-pointer rounded-lg px-2 py-1 ${
                    review.platform === "meituan"
                      ? "bg-orange-50 text-orange-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                  onClick={() => handleRemoveReview(i)}
                >
                  {review.name}(
                  {review.platform === "meituan" ? "美团" : "点评"})
                  <span className="ml-1 text-xs opacity-60">×</span>
                </Badge>
              ))}
            </div>
          )}
          {monthTotals && (
            <div className="mt-2 text-xs text-[#6B6861]">
              月累计：{monthTotals.totalReview}
            </div>
          )}
        </div>

        {/* 美照/视频 */}
        <div className="bg-white rounded-2xl p-4 border border-[#D9D5CD]">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold text-[#2B2926]">
              美照/视频发送
              <span className="text-xs text-[#6B6861] font-normal ml-1">
                (每天至少3个会员)
              </span>
            </Label>
            <span className="text-lg font-bold text-[#066B60]">
              {countNames(photoInput)}人
            </span>
          </div>
          <Input
            value={photoInput}
            onChange={(e) => setPhotoInput(e.target.value)}
            placeholder="输入会员名称，逗号分隔"
            className="bg-[#F4F2ED] border-[#D9D5CD] rounded-xl h-12 text-base placeholder:text-[#9B9891]"
          />
        </div>

        {/* 课量 */}
        <div className="bg-white rounded-2xl p-4 border border-[#D9D5CD]">
          <Label className="text-sm font-semibold text-[#2B2926] mb-3 block">
            课量统计
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-[#6B6861] mb-1">私教课量</div>
              <Input
                type="number"
                value={privateClass}
                onChange={(e) => setPrivateClass(e.target.value)}
                placeholder="0"
                className="bg-[#F4F2ED] border-[#D9D5CD] rounded-xl h-12 text-base text-center"
              />
            </div>
            <div>
              <div className="text-xs text-[#6B6861] mb-1">小班课量</div>
              <Input
                type="number"
                value={groupClass}
                onChange={(e) => setGroupClass(e.target.value)}
                placeholder="0"
                className="bg-[#F4F2ED] border-[#D9D5CD] rounded-xl h-12 text-base text-center"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-[#6B6861]">
              当日总课量：
              <span className="text-lg font-bold text-[#066B60]">
                {(parseInt(privateClass) || 0) + (parseInt(groupClass) || 0)}
              </span>
            </div>
            <div className="text-sm text-[#6B6861]">
              本月总课量：
              <span className="text-lg font-bold text-[#066B60]">
                {monthTotals?.totalClasses ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* 社交媒体 */}
        <div className="bg-white rounded-2xl p-4 border border-[#D9D5CD]">
          <Label className="text-sm font-semibold text-[#2B2926] mb-3 block">
            社交媒体发布
          </Label>
          <div className="grid grid-cols-3 gap-3">
            <Toggle
              pressed={xiaohongshu}
              onPressedChange={setXiaohongshu}
              className="h-14 rounded-xl data-[state=on]:bg-[#066B60] data-[state=on]:text-white border border-[#D9D5CD]"
            >
              小红书
            </Toggle>
            <Toggle
              pressed={shipinhao}
              onPressedChange={setShipinhao}
              className="h-14 rounded-xl data-[state=on]:bg-[#066B60] data-[state=on]:text-white border border-[#D9D5CD]"
            >
              视频号
            </Toggle>
            <Toggle
              pressed={douyin}
              onPressedChange={setDouyin}
              className="h-14 rounded-xl data-[state=on]:bg-[#066B60] data-[state=on]:text-white border border-[#D9D5CD]"
            >
              抖音
            </Toggle>
          </div>
        </div>
      </div>

      {/* 生成文案按钮 */}
      <div className="pt-4 pb-8">
        <Button
          onClick={handleGenerate}
          className="w-full h-14 rounded-2xl bg-[#066B60] hover:bg-[#05564D] text-base font-semibold shadow-lg"
        >
          <FileText className="w-5 h-5 mr-2" />
          生成日报文案
        </Button>
      </div>

      {/* 文案弹窗 */}
      <ReportSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={`${selectedDate.slice(5).replace("-", ".")}运营日报`}
        content={generatedText}
      />
    </div>
  );
}
