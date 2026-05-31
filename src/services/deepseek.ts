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

interface SFLAffinityEvaluation {
  affinityChange: number;
  reasoning: string;
}

const clampAffinity = (value: any): number => {
  return Math.max(-2, Math.min(2, Math.round(Number(value) || 0)));
};

const cleanJsonText = (text: string): string => {
  return text
    .trim()
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
};

const extractJsonObject = (text: string): string | null => {
  const cleaned = cleanJsonText(text);

  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    return cleaned;
  }

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start >= 0 && end > start) {
    return cleaned.slice(start, end + 1);
  }

  return null;
};

const evaluateSFLAffinity = async (
  npc: NPC,
  request: NPCResponseRequest
): Promise<SFLAffinityEvaluation> => {
  if (!request.userInput || request.context === 'greeting') {
    return {
      affinityChange: 0,
      reasoning: 'Greeting or no student utterance; no affinity change.'
    };
  }

  const conversationText = request.conversationHistory
    .slice(-6)
    .map(msg => `${msg.role === 'user' ? 'Student' : npc.name}: ${msg.content}`)
    .join('\n');

  const systemPrompt = `You are a strict SFL and Appraisal Theory evaluator for an English learning simulation.

Your only job is to evaluate the student's latest utterance for relationship/affinity scoring.

You MUST NOT judge isolated keywords. Judge the whole utterance in its discourse context.

Use Systemic Functional Linguistics:
- Interpersonal meaning
- Speech function and mood
- Modality and mitigation
- Appropriateness to role and setting

Use Appraisal Theory:
- Affect: feelings, worry, stress, gratitude
- Judgement: evaluation of people or behaviour
- Appreciation: evaluation of things, systems, tasks, or situations
- Engagement: openness, cooperation, dialogic space
- Graduation: intensity, force, exaggeration

Return ONLY valid JSON:
{
  "affinityChange": -2 | -1 | 0 | 1 | 2,
  "reasoning": "one short sentence"
}

SCORING:
+2 = strong interpersonal success: clear, cooperative, socially appropriate, polite/softened, or appropriate emotional disclosure/help-seeking.
+1 = successful communication but basic, slightly direct, or only moderately polite.
0 = minimal, unclear, neutral, or not enough interactional work.
-1 = awkward, overly direct, dismissive, commanding, or slightly inappropriate in context.
-2 = clearly rude, hostile, insulting, aggressive, or culturally inappropriate toward the NPC.

CRITICAL RULES:
- Negative words are not automatically rude.
- If the student reports someone else's words, do not treat those words as an insult toward the NPC.
- If negative judgement is directed at the NPC, score negatively.
- If criticism is directed at a system/situation, judge whether it is dismissive or appropriately expressed.
- "Please" or "thank you" does not automatically make an utterance polite if the speech function is demanding.
- In counselling/tutor contexts, appropriate disclosure of stress/confusion can be +2.
- Do not over-reward very short utterances.
- Use the full range when appropriate.

ANCHOR EXAMPLES:
Student: "Can I have a flat white, please?" => +2
Student: "I want a flat white." => +1
Student: "Coffee." => 0
Student: "Please hurry up." => -1
Student: "You are useless." => -2
Student: "My friend called me an idiot yesterday." => 0 or +1, because it is reported speech, not an insult toward the NPC.
Student: "I feel stressed because I cannot understand the assignment." => +2 in counselling/tutor contexts.
Student: "That makes no sense." => -1 if said to reject the NPC explanation; 0 if clearly referring to a confusing system.
Student: "Sorry, I don't quite understand. Could you explain it again?" => +2.`;

  const userPrompt = `NPC: ${npc.name}
NPC role: ${npc.role}
Location: ${request.location}

RECENT CONVERSATION:
${conversationText || 'None'}

LATEST STUDENT UTTERANCE:
"${request.userInput}"

Evaluate ONLY the latest student utterance using SFL interpersonal meaning and Appraisal Theory.`;

  try {
    const response = await axios.post(
      DEEPSEEK_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 350,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${getDeepseekApiKey()}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const text = response.data?.choices?.[0]?.message?.content;
    if (!text) {
      return {
        affinityChange: 0,
        reasoning: 'SFL evaluator returned no content.'
      };
    }

    const jsonText = extractJsonObject(text);
    if (!jsonText) {
      return {
        affinityChange: 0,
        reasoning: 'SFL evaluator returned non-JSON content.'
      };
    }

    const parsed = JSON.parse(jsonText);

    return {
      affinityChange: clampAffinity(parsed.affinityChange),
      reasoning: String(parsed.reasoning || 'SFL/Appraisal evaluation completed.')
    };
  } catch (error: any) {
    console.error('SFL affinity evaluation error:', error.message || error);
    return {
      affinityChange: 0,
      reasoning: 'SFL evaluator failed; using neutral affinity.'
    };
  }
};

export const generateNPCResponse = async (
  request: NPCResponseRequest
): Promise<NPCResponse> => {
  const npc = NPCs[request.npcId];

  if (!npc) {
    throw new Error(`NPC ${request.npcId} not found`);
  }

  const sflEvaluation = await evaluateSFLAffinity(npc, request);
  const { systemPrompt, userPrompt } = buildNPCPrompt(npc, request, sflEvaluation);

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

    const jsonText = extractJsonObject(text);

    if (!jsonText) {
      console.warn('Incomplete JSON response:', text);
      return getFallbackResponse(npc, request);
    }

    const parsed = JSON.parse(jsonText);

    if (!parsed.npcMessage) {
      console.warn('Missing npcMessage in response');
      return getFallbackResponse(npc, request);
    }

    return {
      message: parsed.npcMessage,
      affinityChange: sflEvaluation.affinityChange,
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
  request: NPCResponseRequest,
  sflEvaluation?: SFLAffinityEvaluation
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

SFL/APPRAISAL AFFINITY RESULT:
The student's latest utterance has already been evaluated by a separate SFL/Appraisal evaluator.
- Affinity score to use: ${sflEvaluation?.affinityChange ?? 0}
- Evaluation reason: ${sflEvaluation?.reasoning ?? 'No student utterance yet.'}

You should make your NPC response socially consistent with this evaluation.
For example, if the evaluation is negative because the student sounded demanding, respond professionally and gently redirect them.
If the evaluation is positive, respond warmly and encouragingly.

Respond ONLY with a JSON object in this exact format:
{
  "npcMessage": "Your response as ${npc.name}",
  "affinityChange": ${sflEvaluation?.affinityChange ?? 0},
  "languageFeedback": {
    "hasError": <boolean>,
    "errorType": "grammar|vocabulary|pronunciation|politeness" or null,
    "suggestion": "Brief tip in Chinese" or null,
    "correctedVersion": "Correct way to say it" or null,
    "explanation": "Why this is better (in Chinese)" or null
  }
}

AFFINITY SCORING:
Do NOT independently rescore affinity in this response step.
Use the provided SFL/APPRAISAL AFFINITY RESULT exactly as the affinityChange value.

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
          "No worries, I’m happy to help. What would you like to do next?",
          "You’re doing well. What else can I help with?",
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
            "You’re doing well. What else would you like to ask?"
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

    const jsonText = extractJsonObject(text);

    if (!jsonText) {
      console.warn('Incomplete JSON in summary response');
      return getFallbackSummary();
    }

    const parsed = JSON.parse(jsonText);

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
      affinityChange: clampAffinity(parsed.affinityChange),
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
  "affinityChange": <integer only: -2, -1, 0, 1, or 2>,
  "completedTaskIds": ["task-id-1"]
}

AFFINITY SCORING:
Use the same SFL and Appraisal logic as above.
+2: Excellent overall interpersonal success
+1: Good overall communication
0: Neutral/basic communication
-1: Awkward or slightly inappropriate
-2: Rude, hostile, or confusing

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
    affinityChange: 0,
    completedTaskIds: []
  };
};
