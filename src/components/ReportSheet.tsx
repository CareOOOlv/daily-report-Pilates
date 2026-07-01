import { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

interface ReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
}

export function ReportSheet({
  open,
  onOpenChange,
  title,
  content,
}: ReportSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!content) return;

    let success = false;

    // 方法1: 现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(content);
        success = true;
      } catch {
        // 静默失败，继续尝试其他方法
      }
    }

    // 方法2: execCommand fallback
    if (!success) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = content;
        textarea.style.cssText =
          "position:fixed;top:0;left:0;opacity:0;pointer-events:none;z-index:-1;";
        document.body.appendChild(textarea);

        // iOS Safari 兼容
        const range = document.createRange();
        range.selectNodeContents(textarea);

        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }

        textarea.setSelectionRange(0, 999999);
        textarea.focus();

        success = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (selection) selection.removeAllRanges();
      } catch {
        // 静默失败
      }
    }

    // 方法3: 选中文本让用户手动复制
    if (!success) {
      try {
        const preEl = document.querySelector(".report-content-text");
        if (preEl) {
          const range = document.createRange();
          range.selectNodeContents(preEl);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      } catch {
        // 最终兜底
      }
    }

    // 无论哪种方法，都显示成功反馈（用户至少可以手动复制）
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-2xl border-t border-[#D9D5CD] bg-[#FDFCF9]"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="text-base font-semibold text-[#2B2926]">
            {title}
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-[calc(85vh-120px)]">
          <div className="flex-1 overflow-auto">
            <pre
              className="report-content-text whitespace-pre-wrap text-sm leading-relaxed text-[#2B2926] font-mono bg-[#F4F2ED] rounded-xl p-4 select-text"
              style={{ WebkitUserSelect: "text", userSelect: "text" }}
            >
              {content}
            </pre>
          </div>
          <div className="pt-4">
            <Button
              onClick={handleCopy}
              className="w-full h-12 rounded-2xl text-base font-semibold transition-all bg-[#066B60] hover:bg-[#05564D] active:bg-[#044A43]"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  复制文案
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
