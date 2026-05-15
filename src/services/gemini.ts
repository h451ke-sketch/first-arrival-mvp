// src/services/gemini.ts

import axios from 'axios';
import { NPC } from '../types/npc';
import { Message, LanguageFeedback } from '../types/conversation';
import { NPCs } from '../data/npcs';
import { Task } from '../types/task';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Rate limiting: track last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 12000; // 12 seconds between requests (5 RPM = 12s interval)

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

  // Rate limiting: check if we need to wait
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${Math.round(waitTime / 1000)}s before next Gemini request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();

  const prompt = buildPrompt(npc, request);

  try {
    const response = await axios.post(
      GEMINI_URL,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096, // Allow longer NPC responses
          responseMimeType: 'application/json', // Request JSON output
        }
      },
      {
        timeout: 20000 // Increased timeout
      }
    );

    // Check if response is valid
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.warn('Invalid Gemini response structure');
      return getFallbackResponse(npc, request);
    }

    const text = response.data.candidates[0].content.parts[0].text;
    console.log('=== Gemini NPC Response (Full JSON) ===');
    console.log(text);
    console.log('=== End of Gemini Response ===');

    // Parse JSON response
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleanText = cleanText.trim();

    // Validate it looks like complete JSON
    if (!cleanText.startsWith('{') || !cleanText.endsWith('}')) {
      console.warn('Incomplete JSON response:', cleanText);
      return getFallbackResponse(npc, request);
    }

    const parsed = JSON.parse(cleanText);

    // Validate required fields
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
    console.error('Gemini API error:', error.message || error);

    // Don't log full error objects to reduce noise
    if (error.response?.status) {
      console.error('HTTP Status:', error.response.status);
    }

    // Fallback response
    return getFallbackResponse(npc, request);
  }
};

const buildPrompt = (
  npc: NPC,
  request: NPCResponseRequest
): string => {
  const { userInput, context, conversationHistory, location } = request;
  
  let prompt = `You are ${npc.name}, a ${npc.role} at ${location}.

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

`;

  // Conversation history
  if (conversationHistory.length > 0) {
    prompt += `\nCONVERSATION HISTORY:\n`;
    conversationHistory.slice(-5).forEach(msg => {
      prompt += `${msg.role === 'user' ? 'Student' : npc.name}: ${msg.content}\n`;
    });
    prompt += '\n';
  }
  
  // Current context
  if (context === 'greeting') {
    prompt += `The student just entered ${location}. Greet them warmly.\n\n`;
  } else if (userInput) {
    prompt += `STUDENT JUST SAID: "${userInput}"\n\n`;
  }
  
  // Output format
  prompt += `Respond with a JSON object:
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
- Examples:
  * "I want buy coffee" → "应该说 'I want to buy coffee'（需要加 to）"
  * "Give me coffee" → "可以说 'Can I have a coffee, please?' 更礼貌"

DO NOT give feedback if the English is correct even if simple.`;

  return prompt;
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

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return {
    message: randomMessage,
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

  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${Math.round(waitTime / 1000)}s before summary request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();

  const prompt = buildSummaryPrompt(npc, conversationHistory, activeTasks);

  try {
    const response = await axios.post(
      GEMINI_URL,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        }
      },
      {
        timeout: 30000
      }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.warn('Invalid Gemini summary response structure');
      return getFallbackSummary();
    }

    const text = response.data.candidates[0].content.parts[0].text;
    console.log('=== Gemini Summary Response (Full JSON) ===');
    console.log(text);
    console.log('=== End of Summary Response ===');

    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleanText = cleanText.trim();

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
    console.error('Gemini summary API error:', error.message || error);
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
): string => {
  // 格式化对话历史
  const conversationText = conversationHistory
    .map(msg => `${msg.role === 'user' ? 'Student' : npc.name}: ${msg.content}`)
    .join('\n');

  // 格式化任务列表
  const tasksText = activeTasks.length > 0
    ? activeTasks.map(task =>
        `\n  Task ID: "${task.id}"\n  Title: "${task.title}"\n  Completion Criteria: ${task.completionCriteria}`
      ).join('\n')
    : 'None';

  return `You are an English learning assistant evaluating a conversation between a Chinese international student and ${npc.name} (${npc.role}).

CONVERSATION HISTORY:
${conversationText}

ACTIVE TASKS:
${tasksText}

Please analyze this conversation and provide:
1. Overall feedback on the student's English performance
2. 2-3 specific language learning tips (in Chinese)
3. 2-3 cultural tips about Australian communication (in Chinese)
4. 2-3 strengths the student demonstrated
5. 2-3 areas for improvement
6. Affinity change score (-10 to +15):
   - +10 to +15: Excellent interaction, very polite and natural
   - +5 to +9: Good conversation, friendly and appropriate
   - 0 to +4: Basic communication, some awkwardness
   - -5 to -1: Poor communication or inappropriate behavior
   - -10 to -6: Very rude or confusing interaction
7. Completed tasks: Based on the completion criteria, which tasks (if any) did the student successfully complete in this conversation?

TASK COMPLETION GUIDELINES:
- Only mark a task as completed if the student clearly fulfilled ALL the requirements in the completion criteria
- Be strict but fair in your judgment
- If the student only partially completed a task, do NOT include it in completedTaskIds

Return ONLY a JSON object in this exact format:
{
  "overallFeedback": "Brief overall assessment in Chinese",
  "languageTips": ["Tip 1 in Chinese", "Tip 2 in Chinese"],
  "culturalTips": ["Cultural tip 1 in Chinese", "Cultural tip 2 in Chinese"],
  "strengths": ["Strength 1", "Strength 2"],
  "areasToImprove": ["Area 1", "Area 2"],
  "affinityChange": <number between -10 and +15>,
  "completedTaskIds": ["task-id-1", "task-id-2"]
}`;
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
