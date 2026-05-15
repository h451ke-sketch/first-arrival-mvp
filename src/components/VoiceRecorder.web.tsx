// src/components/VoiceRecorder.web.tsx
// Web 端实现：基于浏览器 MediaRecorder API
// Metro 会对 platform=web 自动用本文件覆盖 VoiceRecorder.tsx
import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { stopVoice, pauseBGM, resumeBGM } from '../services/audioService';

interface VoiceRecorderProps {
  onRecordingComplete: (audioUri: string) => void;
  disabled?: boolean;
}

// 优先选择 Deepgram 兼容性最好的 mime
function pickMime(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(m)) {
      return m;
    }
  }
  return 'audio/webm';
}

/**
 * 把 getUserMedia 抛出的 DOMException 翻译成更具体的中文/英文混排提示
 * 参考：https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#exceptions
 */
function explainGetUserMediaError(err: unknown): string {
  const name = (err as { name?: string } | null)?.name || 'UnknownError';
  switch (name) {
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return '未检测到麦克风。请确认电脑接上了麦克风，并在系统设置中已启用。';
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return '浏览器麦克风权限被拒绝。请点击地址栏的麦克风图标允许访问。';
    case 'NotReadableError':
    case 'TrackStartError':
      return '麦克风被其他程序占用，请关闭占用程序后再试。';
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return '当前麦克风不支持所需的参数。';
    case 'TypeError':
      return '当前页面非安全上下文（需要 https 或 localhost）。';
    default:
      return `录音启动失败：${name}`;
  }
}

export default function VoiceRecorder({ onRecordingComplete, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  // null = 未检查 / true = 设备可用 / false = 没有麦克风
  const [micAvailable, setMicAvailable] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // 组件挂载时预检查：是否存在 audioinput 设备
  // 注意 enumerateDevices 在权限未授予时不会暴露 label / deviceId，但 kind 始终可见
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) {
          if (mounted) setMicAvailable(false);
          return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMic = devices.some((d) => d.kind === 'audioinput');
        if (mounted) setMicAvailable(hasMic);
        if (!hasMic) {
          console.warn('[VoiceRecorder.web] No audioinput device detected.');
        }
      } catch (e) {
        console.warn('[VoiceRecorder.web] enumerateDevices failed:', e);
        if (mounted) setMicAvailable(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const isLockedOut = micAvailable === false || disabled;

  const startRecording = async () => {
    if (isRecording) return;
    setErrorMsg(null);
    try {
      console.log('[VoiceRecorder.web] Starting recording...');

      await stopVoice();
      await pauseBGM();

      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMsg('当前浏览器不支持录音。');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMime();
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const uri = URL.createObjectURL(blob);
        console.log(`[VoiceRecorder.web] Recording stopped, size=${blob.size}, uri=${uri}`);
        resumeBGM();
        if (blob.size > 0) {
          onRecordingComplete(uri);
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        recorderRef.current = null;
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      console.log('[VoiceRecorder.web] Recording started, mime=', mimeType);
    } catch (error) {
      console.error('[VoiceRecorder.web] Failed to start recording:', error);
      setErrorMsg(explainGetUserMediaError(error));
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      // 录音失败时立刻恢复 BGM
      resumeBGM();
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current) return;
    setIsRecording(false);
    try {
      recorderRef.current.stop();
    } catch (e) {
      console.error('[VoiceRecorder.web] stop() failed', e);
    }
  };

  // 设备不可用时给出更具体的按钮文案
  const hintText = (() => {
    if (errorMsg) return errorMsg;
    if (micAvailable === false) return '未检测到麦克风';
    if (isRecording) return 'Release to send';
    return 'Hold to speak';
  })();

  return (
    <View className="items-center justify-center py-2 px-3 bg-white border-t border-gray-200 flex-row">
      <TouchableOpacity
        onPressIn={startRecording}
        onPressOut={stopRecording}
        disabled={isLockedOut}
        className={`w-14 h-14 rounded-full items-center justify-center ${
          isRecording ? 'bg-red-500' : 'bg-pink-400'
        } ${isLockedOut ? 'opacity-50' : 'opacity-100'}`}
      >
        <Text className="text-white text-2xl">
          {isRecording ? '⬜' : '🎤'}
        </Text>
      </TouchableOpacity>

      <Text
        className={`ml-3 text-xs ${errorMsg || micAvailable === false ? 'text-red-500' : 'text-gray-600'}`}
        numberOfLines={2}
        style={{ flexShrink: 1, maxWidth: 360 }}
      >
        {hintText}
      </Text>

      {isRecording && (
        <View className="ml-2 flex-row space-x-1">
          <View className="w-1 h-2 bg-red-500 animate-pulse" />
          <View className="w-1 h-3 bg-red-500 animate-pulse delay-75" />
          <View className="w-1 h-2 bg-red-500 animate-pulse delay-150" />
        </View>
      )}
    </View>
  );
}
