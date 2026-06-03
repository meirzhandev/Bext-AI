export interface Model {
  id: string;
  provider: 'openrouter' | 'buildnvidia';
  name: string;
  description: string;
  supportsVision: boolean;
  isFree: boolean;
}

export interface Provider {
  id: 'openrouter' | 'buildnvidia';
  name: string;
  description: string;
}

export const AVAILABLE_PROVIDERS: Provider[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'OpenRouter API кілті және модельдері',
  },
  {
    id: 'buildnvidia',
    name: 'Build NVIDIA',
    description: 'Build NVIDIA API кілті және модельдері',
  },
];

export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'openrouter/free',
    provider: 'openrouter',
    name: 'Авто-маршрутизатор (Free Router)',
    description: 'Автоматты түрде жұмыс істейтін ең жақсы тегін модельді таңдайды (100% кепілдік)',
    supportsVision: true,
    isFree: true,
  },
  {
    id: 'openai/gpt-4o-mini',
    provider: 'openrouter',
    name: 'GPT-4o Mini (ChatGPT)',
    description: 'OpenAI жылдам әрі ақылды моделі',
    supportsVision: true,
    isFree: true,
  },
  {
    id: 'anthropic/claude-3-haiku',
    provider: 'openrouter',
    name: 'Claude 3 Haiku (Claude)',
    description: 'Anthropic өте жылдам әрі сапалы моделі',
    supportsVision: false,
    isFree: true,
  },
  {
    id: 'deepseek/deepseek-v4-flash:free',
    provider: 'openrouter',
    name: 'DeepSeek V4 Flash (Тегін)',
    description: 'Тегін, өте жылдам және математика мен логикаға тамаша модель',
    supportsVision: false,
    isFree: true,
  },
  {
    id: 'google/gemma-4-31b-it:free',
    provider: 'openrouter',
    name: 'Google Gemma 4 31B (Тегін)',
    description: 'Тегін, Google company-ның ең соңғы озық Gemma моделі',
    supportsVision: false,
    isFree: true,
  },
  {
    id: 'qwen/qwen3-coder:free',
    provider: 'openrouter',
    name: 'Qwen3 Coder (Тегін)',
    description: 'Тегін, бағдарламалау, код жазу және техникалық есептер үшін өте мықты',
    supportsVision: false,
    isFree: true,
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    provider: 'openrouter',
    name: 'Llama 3.2 3B (Тегін)',
    description: 'Тегін, жеңіл және өте жылдам Meta моделі',
    supportsVision: false,
    isFree: true,
  },
  {
    id: 'moonshotai/kimi-k2.6:free',
    provider: 'openrouter',
    name: 'Kimi K2.6 (Тегін)',
    description: 'Тегін, мәтінді оқу, талдау және ЕНТ материалдары үшін тамаша',
    supportsVision: false,
    isFree: true,
  },
];

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentPart[];
}

export interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

export interface FlashcardData {
  front: string;
  back: string;
  subject: string;
}

export interface TestQuestionData {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

function extractJsonArrayFromModelOutput(raw: string): any[] {
  const cleaned = raw
    .replace(/```json/gi, '```')
    .replace(/```/g, '')
    .trim();

  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('ИИ жауабынан JSON табылмады. Тағы бір рет көріңіз.');
  }

  const jsonSlice = cleaned.slice(start, end + 1).trim();

  try {
    const parsed = JSON.parse(jsonSlice);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('ИИ жауабы дұрыс форматта емес.');
    }
    return parsed;
  } catch {
    // Try one safe recovery pass for common model mistakes.
    const repaired = jsonSlice
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");
    const parsed = JSON.parse(repaired);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('ИИ жауабы дұрыс форматта емес.');
    }
    return parsed;
  }
}

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const BUILD_NVIDIA_BASE_URL = 'https://api.build.nvidia.com/v1';

const BASE_URLS: Record<string, string> = {
  openrouter: OPENROUTER_BASE_URL,
  buildnvidia: BUILD_NVIDIA_BASE_URL,
};

const FALLBACK_MODELS_BY_PROVIDER: Record<string, string[]> = {
  openrouter: [
    'openrouter/free',
    'deepseek/deepseek-v4-flash:free',
    'google/gemma-4-31b-it:free',
    'qwen/qwen3-coder:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'moonshotai/kimi-k2.6:free',
  ],
  buildnvidia: [],
};

export function getModelsForProvider(provider: 'openrouter' | 'buildnvidia') {
  return AVAILABLE_MODELS.filter((model) => model.provider === provider);
}

export function getDefaultModelForProvider(provider: 'openrouter' | 'buildnvidia') {
  const providerModels = getModelsForProvider(provider);
  return providerModels.length > 0 ? providerModels[0].id : '';
}

export async function chatCompletion(
  messages: ChatMessage[],
  apiKey: string,
  model: string = 'openrouter/free',
  provider: 'openrouter' | 'buildnvidia' = 'openrouter'
): Promise<string> {
  if (!apiKey) {
    throw new Error(`API кілті орнатылмаған. Баптауларға өтіп, ${provider === 'buildnvidia' ? 'Build NVIDIA' : 'OpenRouter'} API кілтін қосыңыз.`);
  }

  const providerFallbackModels = FALLBACK_MODELS_BY_PROVIDER[provider] || FALLBACK_MODELS_BY_PROVIDER.openrouter;
  const filteredFallbackModels = providerFallbackModels.filter(Boolean);

  if (model === 'auto-fallback') {
    if (filteredFallbackModels.length === 0) {
      throw new Error('Бұл провайдерге резервтік модель орнатылмаған. Баптаулардан модель ID енгізіңіз.');
    }
    let lastError: Error | null = null;
    for (const fallbackModel of filteredFallbackModels) {
      try {
        return await attemptCompletion(messages, apiKey, fallbackModel, provider);
      } catch (error: any) {
        lastError = error;
      }
    }
    throw new Error(`Барлық модельдер сәтсіз аяқталды: ${lastError?.message}`);
  }

  try {
    return await attemptCompletion(messages, apiKey, model, provider);
  } catch (error: any) {
    const fallback = filteredFallbackModels.find((m) => m !== model);
    if (fallback) {
      try {
        return await attemptCompletion(messages, apiKey, fallback, provider);
      } catch (fallbackError: any) {
        throw new Error(`Модель қателігі: ${error.message}. Резервтік модель де сәтсіз: ${fallbackError.message}`);
      }
    }
    throw error;
  }
}

async function attemptCompletion(
  messages: ChatMessage[],
  apiKey: string,
  model: string,
  provider: 'openrouter' | 'buildnvidia' = 'openrouter'
): Promise<string> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  // Казахский системный промпт - добавляем ТОЛЬКО если системного сообщения еще нет
  const hasSystemMessage = messages.some(msg => msg.role === 'system');
  const systemPrompt: ChatMessage = {
    role: 'system',
    content: `Сен көмекші AI ассистентісің. МАҢЫЗДЫ: Барлық сұрақтарға ТІКТЕП ҚАЗАҚ ТІЛІНЕ жауап бер. Еш түрлі өзге тілде жауап бермеме. Қазақ тілінде дәлел, мысал, түсіндірме және нұсқау бер. Пайдаланушының сұрағы өзге тілде болса да, оны қазақшаға аударып жауап бер.`,
  };

  // Системный промпт добавляем в начало массива сообщений ТОЛЬКО если его еще нет
  const messagesWithSystem = hasSystemMessage ? messages : [systemPrompt, ...messages];

  try {
    // Set timeout with proper cleanup
    timeoutId = setTimeout(() => {
      controller.abort();
    }, 60000); // 60 seconds timeout

    const baseUrl = BASE_URLS[provider] || OPENROUTER_BASE_URL;
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Bext AI',
      },
      body: JSON.stringify({
        model,
        messages: messagesWithSystem,
        max_tokens: 4000,
        temperature: 0.4,
      }),
      signal: controller.signal,
    });

    // Clear timeout on success
    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      const msg = errorData?.error?.message || `API қатесі ${response.status}`;
      throw new Error(`[${response.status}] ${msg}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Модельден бос жауап алынды');
    return content;
  } catch (error: any) {
    // Ensure timeout is always cleared
    if (timeoutId) clearTimeout(timeoutId);
    
    // Abort controller to prevent stray requests
    controller.abort();

    if (error.name === 'AbortError') {
      throw new Error('Уақыт шектеуі (timeout) аяқталды. Сервер жауап бермеді.');
    }
    throw error;
  }
}

// ─── ЕНТ Flashcard Generation ─────────────────────────────────────────────

export async function generateFlashcardsFromContent(
  content: string,
  subject: string,
  count: number,
  apiKey: string,
  model: string
): Promise<FlashcardData[]> {
  // Валидация содержимого
  if (!content || content.trim().length < 10) {
    throw new Error('Файл тіліндегі мәтін тым қысқа. Кем дегенде 10 символ қажет.');
  }

  // Ограничение размера контента (макс 15000 символов)
  const truncatedContent = content.length > 15000 ? content.substring(0, 15000) + '...' : content;

  const systemPrompt = `Сен Қазақстанның ЕНТ (Ұлттық бірыңғай тестілеу) емтиханына дайындыққа мамандандырылған AI оқу ассистентісің. Тек қазақ тілінде жауап бересің.

МІНДЕТ: Оқушыларға ЕНТ-да жоғары балл алуға көмектесетін флэш-карточкалар жасау.

ФЛЭШ-КАРТОЧКА ФОРМАТЫ:
— "front": ЕНТ стилінде қысқа, нақты сұрақ. Мысалдар:
  • "Квадрат теңдеу ax²+bx+c=0-ді шешу формуласы?"
  • "sin(π/6) = ?"
  • "Python-да list пен tuple айырмашылығы?"
  • "2 деректегі байт неше бит?"

— "back": Толық, дұрыс жауап:
  • Математикада: формула + мысал есеп + есептеу қадамдары
  • Информатикада: анықтама + код мысалы + ескерту
  • Тарихта: күн, оқиға, маңызы

ҚАТАҢ ЕРЕЖЕ: Тек JSON массивін қайтар. Markdown, \`\`\`json, түсіндірме — БОЛМАСЫН.`;

  const userPrompt = `"${subject}" пәні бойынша мына мазмұннан дәл ${count} флэш-карточка жаса.

МАЗМҰН:
${truncatedContent}

ШАРТТАР:
1. ЕНТ-да шынымен сұралатын тақырыптарды қамты
2. "front" — қысқа, нақты сұрақ (1 сөйлем)
3. "back" — толық жауап: формула + мысал немесе анықтама + код
4. Барлығы қазақша
5. ТІКЕЛЕЙ JSON массивін қайтар:

[
  {"front": "...", "back": "...", "subject": "${subject}"}
]`;

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  const result = await chatCompletion(messages, apiKey, model);
  const parsed = extractJsonArrayFromModelOutput(result);

  return parsed.map((card: any) => ({
    front: String(card.front || ''),
    back: String(card.back || ''),
    subject: String(card.subject || subject),
  }));
}

// ─── ЕНТ Test Question Generation ─────────────────────────────────────────

export async function generateTestFromContent(
  content: string,
  subject: string,
  count: number,
  apiKey: string,
  model: string
): Promise<TestQuestionData[]> {
  // Валидация содержимого
  if (!content || content.trim().length < 10) {
    throw new Error('Файл тіліндегі мәтін тым қысқа. Кем дегенде 10 символ қажет.');
  }

  // Ограничение размера контента (макс 15000 символов)
  const truncatedContent = content.length > 15000 ? content.substring(0, 15000) + '...' : content;

  const systemPrompt = `Сен Қазақстанның ЕНТ (Ұлттық бірыңғай тестілеу) сұрақтарын жасайтын мамандандырылған AI. Тек қазақ тілінде жауап бересің.

ЕНТ ФОРМАТЫНЫҢ ҚАТАҢ ЕРЕЖЕЛЕРІ:
1. Барлық сұрақтар 11-сынып бағдарламасы деңгейінде
2. ӘР СҰРАҚТА дәл 4 жауап нұсқасы: A), B), C), D) — артық та, кем де болмасын
3. ТЕК БІР дұрыс жауап
4. Нұсқалар бір-біріне ұқсас — оқушы ойлануы тиіс
5. Қате нұсқалар (дистракторлар) оқушылардың жиі жіберетін қателіктеріне негізделсін:
   — Математика: таңба қателігі (+/-), ретті шатастыру, формула қателігі
   — Информатика: индексті, биттер санын, операторды шатастыру
6. Сұрақтар нақты есептеуді талап етсін ("Тап", "Есепте", "Анықта")
7. ТІКЕЛЕЙ JSON массивін қайтар — markdown, \`\`\`json, түсіндірме БОЛМАСЫН

МАТЕМАТИКА СҰРАҚ ҮЛГІЛЕРІ (осылай жаз):
• "x² − 5x + 6 = 0 теңдеуінің түбірлерінің қосындысы:"
• "f(x) = 2x³ − 3x функциясының туындысы f′(x) = ?"
• "log₂ 32 санын тап"
• "Тікбұрышты үшбұрышта: катет 3, катет 4, гипотенуза = ?"
• "sin 30° + cos 60° = ?"
• "Арифметикалық прогрессияның n-ші мүшесі формуласы: aₙ = ?"

ИНФОРМАТИКА СҰРАҚ ҮЛГІЛЕРІ (осылай жаз):
• "11001₂ санын ондық жүйеге ауыстыр"
• "for i in range(5): сан неше рет орындалады?"
• "Python-да len([1, 2, 3, 4]) нәтижесі қандай?"
• "1 Кбайт = ? байт"
• "Алгоритмнің жұмыс уақытын O(n) деп белгілеу нені білдіреді?"`;

  const userPrompt = `"${subject}" пәні бойынша мына мазмұннан дәл ${count} ЕНТ форматындағы тест сұрағы жаса.

МАЗМҰН:
${truncatedContent}

ҚАТАҢ ШАРТТАР:
1. Сұрақтар ЕНТ стилінде болсын: "Тап", "Есепте", "Қайсысы дұрыс?", "Анықта"
2. 4 нұсқа (A, B, C, D): 1 дұрыс + 3 ЫҚТИМАЛ ҚАТЕ (оқушы шатасатындай)
3. Дистракторлар жиі кездесетін қателіктерге негізделсін
4. explanation: дұрыс жауаптың қысқа, нақты дәлелі (1-2 сөйлем)
5. correctAnswer: дұрыс нұсқаның индексі (0=A, 1=B, 2=C, 3=D)

ТІКЕЛЕЙ JSON массивін қайтар, бөгде мәтін жоқ:
[
  {
    "question": "Нақты ЕНТ стилінде сұрақ",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctAnswer": 0,
    "explanation": "A дұрыс, себебі..."
  }
]`;

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  const result = await chatCompletion(messages, apiKey, model);
  const parsed = extractJsonArrayFromModelOutput(result);

  return parsed.map((q: any) => ({
    question: String(q.question || ''),
    options: Array.isArray(q.options)
      ? q.options.slice(0, 4).map(String)
      : ['', '', '', ''],
    correctAnswer:
      typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
        ? q.correctAnswer
        : 0,
    explanation: String(q.explanation || ''),
  }));
}