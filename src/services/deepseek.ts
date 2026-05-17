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
  currentAffinity?: number;
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

const getRuleBasedAffinityScore = (userInput?: string): number | null => {
  if (!userInput) return null;

  const input = userInput.toLowerCase().trim();

  // Highest priority: rude / insulting / aggressive language
  const rudePatterns = [
    'shut up',
    'stupid',
    'idiot',
    'dumb',
    'hate you',
    'fuck',
    'fucking',
    'shit',
    'bitch',
    'useless',
    'go away',
    'leave me alone',
    'give me now',
    'hurry up',
    'i want it now',
    'you are annoying'
  ];

  if (rudePatterns.some(pattern => input.includes(pattern))) {
    return -2;
  }

  // Strong polite communication
  const strongPolitePatterns = [
    'please',
    'thank you',
    'thanks',
    'could i',
    'can i',
    'may i',
    'would you mind',
    'i would like',
    "i'd like",
    'could you',
    'excuse me',
    'sorry'
  ];

  const hasPoliteLanguage = strongPolitePatterns.some(pattern =>
    input.includes(pattern)
  );

  // Strong positive: polite + meaningful request/response
  if (hasPoliteLanguage && input.length >= 12) {
    return 2;
  }

  // Basic successful communication
  if (input.length >= 8) {
    return 1;
  }

  return 0;
};


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

    const aiAffinity = Math.max(
      -2,
      Math.min(2, Math.round(Number(parsed.affinityChange) || 0))
    );

    const ruleBasedAffinity = getRuleBasedAffinityScore(request.userInput);

    return {
      message: parsed.npcMessage,
      affinityChange:
        ruleBasedAffinity === null
          ? aiAffinity
          : ruleBasedAffinity,
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
  const { userInput, context, conversationHistory, location, currentAffinity = 0 } = request;

  const systemPrompt = `You are ${npc.name}, a ${npc.role} at ${location}.

YOUR PERSONALITY:
- Traits: ${npc.personality.traits.join(', ')}
- Speech style: ${npc.personality.speechStyle}
- Cultural background: ${npc.personality.culturalBackground}

RELATIONSHIP LEVEL:
Current affinity with the student: ${currentAffinity}

Use the current affinity to adjust warmth while keeping ${npc.name}'s original role and personality.

0-29 STRANGER:
- Be polite, helpful, and professional
- Keep some social distance
- Do not act overly familiar
- Use simple service-style or support-style language

30-59 FAMILIAR:
- Be warmer and more relaxed
- Recognise the student as someone you have met before
- Use friendly greetings such as "Good to see you again" when natural
- Give more encouragement and supportive comments
- Still stay appropriate to your role

60-99 FRIEND:
- Sound like a trusted campus contact or friendly local supporter
- Add natural small talk and gentle humour when appropriate
- Show more personal concern, such as asking how they have been
- Offer reassurance and practical help more proactively
- Keep the tone supportive, not romantic

100 CLOSE FRIEND:
- Be especially warm, caring, and emotionally supportive
- Sound like a safe person, mentor, or trusted friend
- You may use very familiar but appropriate phrasing such as "There you are", "I was wondering how you were going", or "Don't stress, I'm here to help"
- Never become romantic, flirtatious, possessive, or inappropriate
- Keep professional boundaries for roles like doctor, counsellor, tutor, bank teller, and receptionist

IMPORTANT RELATIONSHIP BOUNDARY:
- Increased affinity means warmer trust and support, NOT romance
- Do not use intimate pet names, flirting, or overly dramatic emotional language
- Keep all support realistic for an Australian university/student-life context

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
  "affinityChange": <integer: -2, -1, 0, 1, or 2>,
  "languageFeedback": {
    "hasError": <boolean>,
    "errorType": "grammar|vocabulary|pronunciation|politeness" or null,
    "suggestion": "Brief tip in Chinese" or null,
    "correctedVersion": "Correct way to say it" or null,
    "explanation": "Why this is better (in Chinese)" or null
  }
}

AFFINITY SCORING:
You MUST use the full -2 to +2 range.

+2: The student is clearly polite, cooperative, and communicatively successful. Give +2 when they use polite expressions such as "please", "thank you", "could I", "may I", "would you mind", explain their need clearly, respond appropriately to your question, or complete the scenario in a culturally natural way.
+1: The student communicates successfully but the wording is basic, short, or only partly polite.
0: The student gives a very minimal or neutral reply that does not move the conversation much.
-1: The student is awkward, unclear, slightly inappropriate, or ignores the social context.
-2: The student is rude, demanding, confusing, or culturally inappropriate.

IMPORTANT:
- Do NOT be overly strict.
- If the student's message is polite and understandable, give at least +1.
- If the student's message is polite, clear, and scenario-appropriate, give +2.
- Short but polite requests can still receive +2, for example: "Can I have a flat white, please?" 

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
  const affinity = request.currentAffinity ?? 0;

  const fallbacks = affinity >= 60
    ? {
        greeting: [
          "Hey, good to see you again! How have you been?",
          "There you are! What can I help you with today?",
          "Hey! Nice to see you. How are you going?"
        ],
        default: [
          "No worries, I'm happy to help. What would you like to do next?",
          "You're doing well. What else can I help with?",
          "All good, tell me a bit more."
        ]
      }
    : affinity >= 30
      ? {
          greeting: [
            "Hey, good to see you again! How can I help?",
            "Hi again! What can I do for you today?",
            "Nice to see you again. What brings you in?"
          ],
          default: [
            "No worries, what would you like to do next?",
            "That sounds good. Anything else I can help with?",
            "You're doing well. What else would you like to ask?"
          ]
        }
      : {
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
    ? activeTasks.map(task => {
        const safeCriteria = String(task.completionCriteria || '')
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/'/g, '')
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ');

        return `Task ID: "${task.id}" | Title: "${task.title}" | Criteria: ${safeCriteria}`;
      }).join('\n')
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
