// src/services/deepseek.ts

import axios from 'axios';
import { NPC } from '../types/npc';
import { Message, LanguageFeedback } from '../types/conversation';
import { NPCs } from '../data/npcs';
import { Task } from '../types/task';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

const getDeepseekApiKey = (): string => {
  // Lazy import to avoid circular deps — store is initialized before any service call
  const { useSettingsStore } = require('../store/settingsStore');
  const userKey: string = useSettingsStore.getState().userDeepseekKey;
  // 用户在 Settings 输入的 key 优先；否则回退到 .env 中的默认 key
  return userKey || process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || '';
};

export interface NPCResponseRequest {
  npcId: string;
  userInput?: string;
  context?: 'greeting' | 'conversation';
  conversationHistory: Message[];
  location: string;
}

export interface NPCResponse {
  message: string;
  affinityChange: number;
  feedback?: LanguageFeedback;
}

export interface ConversationSummaryResponse {
  overallFeedback: string;
  languageTips: string[];
  culturalTips: string[];
  strengths: string[];
  areasToImprove: string[];
  affinityChange: number;
  completedTaskIds: string[];
}

export const generateNPCResponse = async (
  request: NPCResponseRequest
): Promise<NPCResponse> => {
  const npc = NPCs[request.npcId];

  if (!npc) {
    throw new Error(`NPC ${request.npcId} not found`);
  }

  const { systemPrompt, userPrompt } = buildNPCPrompt(npc, request);

  try {
    const response = await axios.post(
      DEEPSEEK_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.9,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${getDeepseekApiKey()}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );

    const text = response.data?.choices?.[0]?.message?.content;

    if (!text) {
      console.warn('Invalid DeepSeek response structure');
      return getFallbackResponse(npc, request);
    }

    console.log('=== DeepSeek NPC Response (Full JSON) ===');
    console.log(text);
    console.log('=== End of DeepSeek Response ===');

    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    if (!cleanText.startsWith('{') || !cleanText.endsWith('}')) {
      console.warn('Incomplete JSON response:', cleanText);
      return getFallbackResponse(npc, request);
    }

    const parsed = JSON.parse(cleanText);

    if (!parsed.npcMessage) {
      console.warn('Missing npcMessage in response');
      return getFallbackResponse(npc, request);
    }

    return {
      message: parsed.npcMessage,
      affinityChange: parsed.affinityChange || 0,
      feedback: parsed.languageFeedback?.hasError ? parsed.languageFeedback : undefined
    };

  } catch (error: any) {
    console.error('DeepSeek API error:', error.message || error);
    if (error.response?.status) {
      console.error('HTTP Status:', error.response.status);
    }
    return getFallbackResponse(npc, request);
  }
};

const buildNPCPrompt = (
  npc: NPC,
  request: NPCResponseRequest
): { systemPrompt: string; userPrompt: string } => {
  const { userInput, context, conversationHistory, location } = request;

  const systemPrompt = `You are ${npc.name}, a ${npc.role} at ${location}.

YOUR PERSONALITY:
- Traits: ${npc.personality.traits.join(', ')}
- Speech style: ${npc.personality.speechStyle}
- Cultural background: ${npc.personality.culturalBackground}

IMPORTANT INSTRUCTIONS:
1. Stay in character as ${npc.name}
2. Use natural, conversational Australian English
3. Include appropriate Australian slang occasionally (e.g., "mate", "no worries", "reckon")
4. Be friendly and helpful to international students
5. Keep responses concise (2-3 sentences max)
6. Keep the conversation active unless the student clearly ends it
7. If the student has NOT said a closing phrase (e.g., "bye", "see you", "thank you, that's all", "that is all", "have a nice day"), your response MUST naturally end with ONE short follow-up question
8. Your question should guide the learner toward completing the current scenario task
9. If the student clearly ends the conversation, reply politely and DO NOT ask another question
10. Avoid ending the conversation too early

Respond ONLY with a JSON object in this exact format:
{
  "npcMessage": "Your response as ${npc.name}",
  "affinityChange": <number between -10 and +10>,
  "languageFeedback": {
    "hasError": <boolean>,
    "errorType": "grammar|vocabulary|pronunciation|politeness" or null,
    "suggestion": "Brief tip in Chinese" or null,
    "correctedVersion": "Correct way to say it" or null,
    "explanation": "Why this is better (in Chinese)" or null
  }
}

AFFINITY SCORING:
+5 to +10: Very polite, natural, culturally appropriate
+1 to +4: Good effort, minor issues
0: Neutral, basic communication
-1 to -4: Awkward, somewhat inappropriate
-5 to -10: Rude, very inappropriate, or confusing

LANGUAGE FEEDBACK:
- Only give feedback if there's a clear error
- Keep suggestions brief and encouraging in Chinese
- Focus on practical improvements
- DO NOT give feedback if the English is correct even if simple`;

  let userPrompt = '';

  if (conversationHistory.length > 0) {
    userPrompt += `CONVERSATION HISTORY:\n`;
    conversationHistory.slice(-5).forEach(msg => {
      userPrompt += `${msg.role === 'user' ? 'Student' : npc.name}: ${msg.content}\n`;
    });
    userPrompt += '\n';
  }

  if (context === 'greeting') {
    userPrompt += `The student just entered ${location}. Greet them warmly.`;
  } else if (userInput) {
    userPrompt += `STUDENT JUST SAID: "${userInput}"`;
  }

  return { systemPrompt, userPrompt };
};

const getFallbackResponse = (
  npc: NPC,
  request: NPCResponseRequest
): NPCResponse => {
  const fallbacks = {
    greeting: [
      "G'day! How can I help you today?",
      "Hey there! What can I do for you?",
      "Hi! Welcome, what brings you in?"
    ],
    default: [
      "That's interesting, tell me more!",
      "I see, anything else?",
      "No worries, mate!",
      "Sounds good!"
    ]
  };

  const messages = request.context === 'greeting'
    ? fallbacks.greeting
    : fallbacks.default;

  return {
    message: messages[Math.floor(Math.random() * messages.length)],
    affinityChange: 0
  };
};

// ============ 对话总结和任务判定 ============

export const generateConversationSummary = async (
  npcId: string,
  conversationHistory: Message[],
  activeTasks: Task[]
): Promise<ConversationSummaryResponse> => {
  const npc = NPCs[npcId];

  if (!npc) {
    throw new Error(`NPC ${npcId} not found`);
  }

  const { systemPrompt, userPrompt } = buildSummaryPrompt(npc, conversationHistory, activeTasks);

  try {
    const response = await axios.post(
      DEEPSEEK_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2048,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${getDeepseekApiKey()}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const text = response.data?.choices?.[0]?.message?.content;

    if (!text) {
      console.warn('Invalid DeepSeek summary response structure');
      return getFallbackSummary();
    }

    console.log('=== DeepSeek Summary Response (Full JSON) ===');
    console.log(text);
    console.log('=== End of Summary Response ===');

    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    if (!cleanText.startsWith('{') || !cleanText.endsWith('}')) {
      console.warn('Incomplete JSON in summary response');
      return getFallbackSummary();
    }

    const parsed = JSON.parse(cleanText);

    console.log('=== Parsed Summary Result ===');
    console.log('Completed Task IDs:', parsed.completedTaskIds);
    console.log('Affinity Change:', parsed.affinityChange);
    console.log('=============================');

    return {
      overallFeedback: parsed.overallFeedback || 'Great conversation!',
      languageTips: parsed.languageTips || [],
      culturalTips: parsed.culturalTips || [],
      strengths: parsed.strengths || [],
      areasToImprove: parsed.areasToImprove || [],
      affinityChange: parsed.affinityChange || 5,
      completedTaskIds: parsed.completedTaskIds || []
    };

  } catch (error: any) {
    console.error('DeepSeek summary API error:', error.message || error);
    if (error.response?.status) {
      console.error('HTTP Status:', error.response.status);
    }
    return getFallbackSummary();
  }
};

const buildSummaryPrompt = (
  npc: NPC,
  conversationHistory: Message[],
  activeTasks: Task[]
): { systemPrompt: string; userPrompt: string } => {
  const systemPrompt = `You are an English learning assistant evaluating a conversation between a Chinese international student and ${npc.name} (${npc.role}).

Please analyze the conversation and return ONLY a JSON object in this exact format:
{
  "overallFeedback": "Brief overall assessment in Chinese",
  "languageTips": ["Tip 1 in Chinese", "Tip 2 in Chinese"],
  "culturalTips": ["Cultural tip 1 in Chinese", "Cultural tip 2 in Chinese"],
  "strengths": ["Strength 1", "Strength 2"],
  "areasToImprove": ["Area 1", "Area 2"],
  "affinityChange": <number between -10 and +15>,
  "completedTaskIds": ["task-id-1"]
}

AFFINITY SCORING:
+10 to +15: Excellent interaction, very polite and natural
+5 to +9: Good conversation, friendly and appropriate
0 to +4: Basic communication, some awkwardness
-5 to -1: Poor communication or inappropriate behavior
-10 to -6: Very rude or confusing interaction

TASK COMPLETION: Only mark a task as completed if the student clearly fulfilled ALL the requirements. Be strict but fair.

AUSTRALIAN CULTURAL GUIDELINES:
When giving cultural tips, prioritise accurate and practical Australian local culture for Chinese international students.

Focus on real Australian norms such as:
- Politeness expectations (please, thanks, soft requests, indirect politeness)
- Small talk culture (casual friendliness, "How are you going?", weather, weekend plans)
- Queueing etiquette and personal space
- Café and restaurant ordering culture
- Customer service expectations
- Classroom participation and tutor communication
- Academic discussion culture and asking questions
- GP/medical appointment culture in Australia
- Counselling and mental health support norms
- Renting, apartment reception, and maintenance communication
- Workplace and part-time job communication
- Supermarket and self-checkout culture
- Independence and self-service expectations
- Australian humour, friendliness, and casual communication
- Real Australian slang ONLY when contextually appropriate

IMPORTANT:
- Cultural tips MUST be accurate, realistic, and Australia-specific
- Avoid stereotypes or generic advice
- Avoid repeating the same tip every conversation
- Make tips scenario-specific to what actually happened in the conversation
- Give practical survival advice useful for Chinese international students adapting to Australia
- Prefer concrete examples over vague comments
- Include hidden local expectations when relevant (e.g., politeness, waiting turns, initiating communication, asking for help).`;

  const conversationText = conversationHistory
    .map(msg => `${msg.role === 'user' ? 'Student' : npc.name}: ${msg.content}`)
    .join('\n');

  const tasksText = activeTasks.length > 0
    ? activeTasks.map(task =>
        `Task ID: "${task.id}" | Title: "${task.title}" | Criteria: ${task.completionCriteria}`
      ).join('\n')
    : 'None';

  const userPrompt = `CONVERSATION:\n${conversationText}\n\nACTIVE TASKS:\n${tasksText}`;

  return { systemPrompt, userPrompt };
};

const getFallbackSummary = (): ConversationSummaryResponse => {
  return {
    overallFeedback: '很好的练习！继续保持！',
    languageTips: ['继续练习日常对话', '注意语调和发音'],
    culturalTips: ['澳大利亚人喜欢随意的问候，比如"G\'day"', '保持友好和轻松的态度'],
    strengths: ['沟通清晰', '态度友好'],
    areasToImprove: ['可以使用更多样的词汇', '尝试更自然的表达'],
    affinityChange: 5,
    completedTaskIds: []
  };
};
