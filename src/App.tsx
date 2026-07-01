import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyReport from "@/pages/DailyReport";
import WeeklyReport from "@/pages/WeeklyReport";
import { initSeedData } from "@/utils/storage";
import { ClipboardList, BarChart3 } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");

  // 首次加载时初始化种子数据
  useEffect(() => {
    initSeedData();
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-[#FDFCF9]/95 backdrop-blur-sm border-b border-[#E9E5DD]">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-[#2B2926]">
              {new Date().getMonth() + 1}月运营数据
            </h1>
          </div>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "daily" | "weekly")}
            className="mt-3"
          >
            <TabsList className="w-full grid grid-cols-2 bg-[#E9E5DD] rounded-xl p-1 h-11">
              <TabsTrigger
                value="daily"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-[#066B60] data-[state=active]:shadow-sm text-[#6B6861] transition-all"
              >
                <ClipboardList className="w-4 h-4 mr-1.5" />
                日报
              </TabsTrigger>
              <TabsTrigger
                value="weekly"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-[#066B60] data-[state=active]:shadow-sm text-[#6B6861] transition-all"
              >
                <BarChart3 className="w-4 h-4 mr-1.5" />
                周报
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {activeTab === "daily" ? <DailyReport /> : <WeeklyReport />}
      </main>
    </div>
  );
}
