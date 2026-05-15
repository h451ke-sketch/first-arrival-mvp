// src/utils/audioFileIO.web.ts
// Web 端的音频文件 IO 实现
// Metro 会根据 platform=web 自动用本文件覆盖 audioFileIO.ts
// 因此 Web 端 bundle 不会引入 expo-file-system

/**
 * 把 blob: / http: 等 URI 直接 fetch 出来，转成 ArrayBuffer
 */
export async function audioUriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`Failed to fetch audio URI (${res.status})`);
  }
  return await res.arrayBuffer();
}

/**
 * 把 TTS 二进制包成 Blob，返回 blob: URL，供 <audio>/expo-av 播放
 */
export async function saveAudioBufferToTempUri(
  buffer: ArrayBuffer,
  ext: string = 'mp3'
): Promise<string> {
  const mime = ext === 'mp3' ? 'audio/mpeg' : `audio/${ext}`;
  const blob = new Blob([buffer], { type: mime });
  return URL.createObjectURL(blob);
}

/**
 * 释放 blob URL；浏览器只回收手动 revoke 过的 URL
 */
export async function releaseAudioTempUri(uri: string): Promise<void> {
  if (uri.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(uri);
    } catch {
      // ignore
    }
  }
}
