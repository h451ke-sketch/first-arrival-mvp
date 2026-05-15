// src/utils/audioFileIO.ts
// Native 端（iOS / Android）的音频文件 IO 实现
// Web 端会自动加载同目录下的 audioFileIO.web.ts 覆盖此文件
import * as FileSystem from 'expo-file-system/legacy';

/**
 * 读取本地音频文件，返回 ArrayBuffer，用于上传到 STT 服务
 */
export async function audioUriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 将 TTS 返回的二进制写入临时文件，返回可被播放器消费的 URI
 */
export async function saveAudioBufferToTempUri(
  buffer: ArrayBuffer,
  ext: string = 'mp3'
): Promise<string> {
  const tempFileName = `tts_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
  const tempUri = `${FileSystem.cacheDirectory}${tempFileName}`;
  const bytes = new Uint8Array(buffer);
  const base64 = btoa(
    bytes.reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: 'base64' });
  return tempUri;
}

/**
 * 释放由 saveAudioBufferToTempUri 创建的资源（native 不需要主动回收）
 */
export async function releaseAudioTempUri(_uri: string): Promise<void> {
  // 移动端缓存目录由系统管理，这里不主动删除以避免播放未完成
}
