// src/utils/stage.tsx
// 提供「画布尺寸」抽象：
//   - Native 端：等同 useWindowDimensions（整个屏幕）
//   - Web 端：StageProvider 用 onLayout 测量 #root 实际尺寸，子组件通过 hook 读取
// 这样所有屏幕代码无需关心当前是 web 还是 native

import React, { createContext, useContext, useMemo, useState } from 'react';
import { Platform, View, useWindowDimensions, LayoutChangeEvent } from 'react-native';

interface StageSize {
  width: number;
  height: number;
}

const StageContext = createContext<StageSize | null>(null);

/**
 * Web 端使用：包裹整个 App，自身铺满 #root（CSS 已限制为 16:9 letterbox），
 * onLayout 实时上报真实像素尺寸到 Context。
 * Native 端：直接渲染子节点，不引入 Context。
 */
export function StageProvider({ children }: { children: React.ReactNode }) {
  const [size, setSize] = useState<StageSize | null>(null);

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setSize((prev) =>
        prev && prev.width === width && prev.height === height ? prev : { width, height }
      );
    }
  };

  return (
    <View style={{ flex: 1, width: '100%', height: '100%' }} onLayout={onLayout}>
      <StageContext.Provider value={size}>{children}</StageContext.Provider>
    </View>
  );
}

/**
 * 屏幕组件应该用本 hook 代替 useWindowDimensions
 *  - Native: 返回真实窗口尺寸
 *  - Web: 返回 StageProvider 实测尺寸；尚未测量到时回退 windowDimensions（避免 NaN）
 */
export function useStageDimensions(): StageSize {
  const win = useWindowDimensions();
  const stage = useContext(StageContext);

  return useMemo(() => {
    if (Platform.OS !== 'web') {
      return { width: win.width, height: win.height };
    }
    if (stage && stage.width > 0 && stage.height > 0) {
      return stage;
    }
    return { width: win.width, height: win.height };
  }, [win.width, win.height, stage]);
}
