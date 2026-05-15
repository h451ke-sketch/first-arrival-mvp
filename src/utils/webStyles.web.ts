// src/utils/webStyles.web.ts
// Web 端注入全局 CSS：
//   1. 黑色 letterbox 背景 + #root 横屏画布居中
//   2. tailwindcss CLI 生成的 utility CSS（nativewind v2 自身不为 web 生成）
import { TAILWIND_WEB_CSS } from './tailwindWebCss';

const STAGE_STYLE_ID = '__first_arrival_web_stage_css__';
const TAILWIND_STYLE_ID = '__first_arrival_web_tailwind_css__';

function inject(id: string, css: string) {
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
}

export function injectGlobalWebStyles(): void {
  if (typeof document === 'undefined') return;

  // 先注入 tailwind utilities，再注入 stage 样式：stage 样式优先级更高
  inject(TAILWIND_STYLE_ID, TAILWIND_WEB_CSS);

  const stageCss = `
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #000;
      overflow: hidden;
      overscroll-behavior: none;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    /* Expo Web 的根 div：横屏 16:9 letterbox，居中 */
    #root {
      position: relative !important;
      width: min(100vw, calc(100vh * 16 / 9)) !important;
      height: min(100vh, calc(100vw * 9 / 16)) !important;
      overflow: hidden;
      background: #FFE3E8;
      box-shadow: 0 0 24px rgba(0, 0, 0, 0.4);
    }
    /* expo-av <Video> 在 web 端会渲染原生 <video>，但 RN style 只作用在外层 View，
       导致 <video> 用原生分辨率渲染撑破容器。这里强制其填满父级并保持 cover 裁剪。 */
    video {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover;
      display: block;
    }
  `;
  inject(STAGE_STYLE_ID, stageCss);
}
