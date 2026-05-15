// src/services/deepgram.ts

import axios from 'axios';
import { Platform } from 'react-native';
import {
  audioUriToArrayBuffer,
  saveAudioBufferToTempUri,
} from '../utils/audioFileIO';

// Expo 在 build 时把 process.env.EXPO_PUBLIC_* 内联到 bundle 里，无需额外依赖
const DEEPGRAM_API_KEY = process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY || '';
const DEEPGRAM_STT_URL = 'https://api.deepgram.com/v1/listen';
const DEEPGRAM_TTS_URL = 'https://api.deepgram.com/v1/speak';

// Web 上 MediaRecorder 默认输出 webm/opus；Native 上 expo-av HIGH_QUALITY 输出 m4a (mp4 容器)
const RECORDING_MIME = Platform.OS === 'web' ? 'audio/webm' : 'audio/mp4';

export interface TranscriptionResult {
  text: string;
  confidence: number;
}

export const transcribeAudio = async (
  audioUri: string
): Promise<TranscriptionResult> => {
  try {
    console.log('=== Deepgram STT Started ===');
    console.log(`Audio URI: ${audioUri}`);

    // 平台无关的读取：native 走 expo-file-system，web 走 fetch+blob
    const arrayBuffer = await audioUriToArrayBuffer(audioUri);

    console.log(`Audio buffer size: ${arrayBuffer.byteLength} bytes, mime: ${RECORDING_MIME}`);
    console.log('Sending to Deepgram...');

    // Call Deepgram API
    const response = await axios.post(
      DEEPGRAM_STT_URL,
      arrayBuffer,
      {
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': RECORDING_MIME
        },
        params: {
          model: 'nova-2',
          language: 'en-AU',
          punctuate: true,
          smart_format: true
        },
        timeout: 10000
      }
    );

    console.log('Deepgram response received');
    console.log('Full response:', JSON.stringify(response.data, null, 2));

    const transcript = response.data.results.channels[0].alternatives[0];

    console.log(`Transcribed text: "${transcript.transcript}"`);
    console.log(`Confidence: ${transcript.confidence}`);
    console.log('=== Deepgram STT Completed ===');

    return {
      text: transcript.transcript,
      confidence: transcript.confidence
    };

  } catch (error: any) {
    console.error('=== Deepgram STT FAILED ===');
    console.error('Error:', error.message || error);
    console.error('Stack:', error.stack);

    if (error.code === 'ECONNABORTED') {
      throw new Error('Network timeout. Please check your connection.');
    }

    if (error.response?.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    }

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }

    throw new Error('Speech recognition failed. Please try again.');
  }
};

export const checkAudioQuality = (result: TranscriptionResult): {
  isGood: boolean;
  message?: string;
} => {
  if (result.confidence < 0.5) {
    return {
      isGood: false,
      message: 'Audio unclear. Please try again in a quiet place.'
    };
  }
  
  if (result.text.split(' ').length < 3) {
    return {
      isGood: false,
      message: 'Recording too short. Please speak in complete sentences.'
    };
  }
  
  return { isGood: true };
};

// ============ Text-to-Speech (TTS) ============

/**
 * 使用 Deepgram TTS 生成语音并返回本地临时文件 URI
 * @param text 要转换为语音的文本
 * @param voiceId 语音 ID（Deepgram 语音模型）
 * @returns 临时音频文件的 URI
 */
export const generateSpeech = async (
  text: string,
  voiceId: string = 'aura-asteria-en' // Deepgram 默认女声（Australian accent 可用 aura-luna-en）
): Promise<string> => {
  try {
    console.log(`[Deepgram TTS] Generating speech for: "${text.substring(0, 50)}..."`);

    // 调用 Deepgram TTS API
    const response = await axios.post(
      `${DEEPGRAM_TTS_URL}?model=${voiceId}`,
      {
        text: text
      },
      {
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 15000
      }
    );

    // 平台无关地落盘：native 写入缓存目录返回 file URI，web 返回 blob: URL
    const tempUri = await saveAudioBufferToTempUri(response.data as ArrayBuffer, 'mp3');

    console.log(`[Deepgram TTS] Audio ready at: ${tempUri.substring(0, 80)}`);
    return tempUri;

  } catch (error: any) {
    console.error('Deepgram TTS error:', error);

    if (error.code === 'ECONNABORTED') {
      throw new Error('Network timeout. Please check your connection.');
    }

    if (error.response?.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    }

    if (error.response?.status === 401) {
      throw new Error('Invalid API key.');
    }

    throw new Error('Speech generation failed.');
  }
};
