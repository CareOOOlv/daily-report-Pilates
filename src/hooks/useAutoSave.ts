import { useEffect, useRef } from "react";

/**
 * 自动保存 Hook
 * 当依赖变化时，延迟指定时间后执行保存操作
 */
export function useAutoSave(
  saveFn: () => void,
  deps: React.DependencyList,
  delay = 1500
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // 跳过首次渲染（避免加载已有数据时触发保存）
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // 清除之前的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 设置新的延迟保存
    timerRef.current = setTimeout(() => {
      saveFn();
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
