// server/geminiService.js
// Handles AI Anonymity & Writing Neutralization, Sentiment Scoring, and Semantic Clustering via Gemini

export function getGeminiApiKey() {
  return (process.env.GEMINI_API_KEY || '').replace(/^["']|["']$/g, '').trim();
}

// Gemini 2.5 disables thinking via thinkingBudget; Gemini 3.x rejects thinkingBudget: 0
// and uses thinkingLevel instead.
const MODEL_CONFIGS = {
  'gemini-2.5-flash': { thinkingConfig: { thinkingBudget: 0 } },
  'gemini-3.1-flash-lite': { thinkingConfig: { thinkingLevel: 'minimal' } },
  'gemini-3-flash-preview': { thinkingConfig: { thinkingLevel: 'minimal' } },
  'gemini-3.5-flash': { thinkingConfig: { thinkingLevel: 'minimal' } },
  'gemini-3.5-flash-lite': { thinkingConfig: { thinkingLevel: 'minimal' } }
};

// Model order per workload. 'fast' is for short, latency-sensitive calls on the
// submission path (neutralize + scoring), where the lite model answers in ~1s.
// 'quality' is for long-form output (HR chat, clustering).
const TIERS = {
  fast: {
    models: ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'],
    attemptTimeoutMs: 5000
  },
  quality: {
    models: ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite'],
    attemptTimeoutMs: 25000
  }
};
// Keep the whole call inside Vercel's 60s function limit (vercel.json maxDuration)
const TOTAL_BUDGET_MS = 50000;
const MIN_ATTEMPT_MS = 3000;
// A model that returned 429 (quota) or 503 (overloaded) is skipped by every request
// on this instance until its cooldown passes, instead of being retried each time.
const QUOTA_COOLDOWN_MS = 60000;
const OVERLOAD_COOLDOWN_MS = 15000;
const modelCooldownUntil = new Map();

function parseRetryDelayMs(errTxt) {
  const match = errTxt.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/);
  return match ? Math.ceil(parseFloat(match[1]) * 1000) : null;
}

async function callGemini(prompt, systemInstruction = '', maxTokens = 1000, { json = false, tier = 'quality' } = {}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set on the server.');
  }

  const { models, attemptTimeoutMs } = TIERS[tier];
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const now = Date.now();
  const available = models.filter(name => (modelCooldownUntil.get(name) || 0) <= now);
  // If every model is cooling down, try them all anyway rather than failing outright
  const candidates = available.length > 0 ? available : models;
  let lastError = null;

  for (const modelName of candidates) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_ATTEMPT_MS) break;

    const body = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        thinkingConfig: MODEL_CONFIGS[modelName].thinkingConfig,
        ...(json && { responseMimeType: 'application/json' })
      }
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Math.min(attemptTimeoutMs, remaining))
      });

      if (!response.ok) {
        const errTxt = await response.text();
        console.warn(`[Gemini API] ${modelName} returned ${response.status}:`, errTxt.slice(0, 150));
        lastError = new Error(`Model ${modelName} returned ${response.status}`);
        if (response.status === 429) {
          const cooldown = Math.min(parseRetryDelayMs(errTxt) || QUOTA_COOLDOWN_MS, 10 * 60000);
          modelCooldownUntil.set(modelName, Date.now() + cooldown);
        } else if (response.status === 503) {
          modelCooldownUntil.set(modelName, Date.now() + OVERLOAD_COOLDOWN_MS);
        }
        continue;
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const text = (candidate?.content?.parts || [])
        .filter(p => p.text && !p.thought)
        .map(p => p.text)
        .join('');

      if (!text) {
        lastError = new Error(`Model ${modelName} returned no text (finishReason: ${candidate?.finishReason || 'unknown'})`);
        console.warn(`[Gemini API] ${lastError.message}`);
        continue;
      }
      if (candidate.finishReason === 'MAX_TOKENS') {
        console.warn(`[Gemini API] ${modelName} hit maxOutputTokens (${maxTokens}); output may be truncated`);
      }
      return text;
    } catch (err) {
      console.warn(`[Gemini API] ${modelName} request failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed.');
}

function parseJsonResponse(rawResult) {
  const cleaned = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Tolerate stray prose around the JSON object
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error('Gemini returned invalid JSON');
  }
}

/**
 * Strips PII and stylometrically neutralizes raw employee input.
 * Grounded in Amy Edmondson's Psychological Safety: ensures no employee can be
 * identified by their unique writing style, colloquialisms, syntax quirks, or names.
 * Also scores the affective metrics in the same call, so a submission needs only
 * one Gemini round trip. `metrics` is omitted when the heuristic fallback is used.
 */
export async function neutralizeFeedback(rawText, context = 'daily_summary', energyLevel = 3) {
  if (!rawText || rawText.trim().length === 0) {
    return {
      neutralizedText: '',
      redactedItems: [],
      stylometryChanges: 'Empty input provided.',
      safetyScore: 100
    };
  }

  const systemInstruction = `You are the AI Privacy & Stylometric Neutralizer for an anonymous workplace employee platform.
Your primary objective is to protect the SUBMITTER's identity from retribution while ensuring honest reporting.

CRITICAL RULES:
1. THIRD-PARTY NAMES: If the submitter mentions colleagues, team members, or managers by name (e.g. Matthew, Sarah, David), DO NOT REDACT OR REMOVE THESE NAMES. Keep the names of people being reported or discussed intact.
2. SUBMITTER IDENTITY: ONLY redact and protect any information that would identify the SUBMITTER themselves (e.g., if the submitter gives their own name, personal contact information, or unique personal identifiers).
3. STYLOMETRIC NEUTRALIZATION: Eradicate distinctive personal quirks, excessive punctuation (e.g. '!!!', '...'), hyper-specific colloquialisms, emotional venting habits, and distinctive capitalization. Convert into clear, objective, professional language.
4. PRESERVE FACTUAL INTEGRITY: Keep all factual events, timelines, names of people discussed, operational bottlenecks, and achievements completely intact.
5. METRICS: Score morale and cognitive strain from the content and the employee's energy rating.
6. Output strict JSON only in this format:
{
  "neutralizedText": "The sanitized, professionally phrased text here.",
  "redactedItems": ["Protected submitter identifying markers", "Standardized informal phrasing"],
  "stylometryChanges": "Brief summary of tone & stylistic adjustments made",
  "privacyRiskAssessment": "Safe",
  "metrics": {
    "sentimentScore": <number between -1.0 (very negative) and 1.0 (very positive)>,
    "cognitiveStrain": <integer between 0 (no strain) and 100 (severe burnout risk)>,
    "affectiveValence": "Positive" | "Neutral" | "Frustrated" | "Fatigued" | "Anxious" | "Energized",
    "primaryConcern": "<short 2-4 word theme, e.g. Tooling Instability, Meeting Fatigue, Clear Progress>"
  }
}`;

  const prompt = `Input Type: ${context}
Employee Energy Rating: ${energyLevel}/5 (1=Extremely Drained, 5=Highly Energized)
Raw Employee Input:
"""
${rawText}
"""

Please process and return the JSON object:`;

  try {
    const rawResult = await callGemini(prompt, systemInstruction, 1500, { json: true, tier: 'fast' });
    return parseJsonResponse(rawResult);
  } catch (err) {
    console.error('Error in neutralizeFeedback via Gemini:', err.message);
    // Intelligent fallback heuristic
    let fallback = rawText
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[Colleague]')
      .replace(/I am sick of|I hate/gi, 'There is significant friction regarding')
      .replace(/totally broken/gi, 'experiencing recurring failures');
    return {
      neutralizedText: fallback,
      redactedItems: ['Automated heuristic regex fallback applied'],
      stylometryChanges: 'Filtered colloquial friction patterns',
      privacyRiskAssessment: 'Low'
    };
  }
}

/**
 * Analyzes sentiment, emotional energy, and cognitive strain score for an input.
 */
export async function analyzeAffectiveMetrics(text, energyLevel = 3) {
  if (!text || text.trim().length === 0) {
    return {
      sentimentScore: 0.1,
      cognitiveStrain: 30,
      affectiveValence: 'Neutral',
      primaryConcern: 'Routine update'
    };
  }

  const prompt = `Analyze this neutralized workplace feedback for morale and cognitive strain indicators.
Employee Energy Rating: ${energyLevel}/5 (1=Extremely Drained, 5=Highly Energized)
Neutralized Text:
"""
${text}
"""

Respond with strict JSON only:
{
  "sentimentScore": <number between -1.0 (very negative) and 1.0 (very positive)>,
  "cognitiveStrain": <number between 0 (no strain) and 100 (severe burnout risk)>,
  "affectiveValence": "Positive" | "Neutral" | "Frustrated" | "Fatigued" | "Anxious" | "Energized",
  "primaryConcern": "<short 2-4 word theme, e.g. Tooling Instability, Meeting Fatigue, Clear Progress>"
}`;

  try {
    const rawResult = await callGemini(prompt, '', 400, { json: true, tier: 'fast' });
    return parseJsonResponse(rawResult);
  } catch (err) {
    console.error('Error in analyzeAffectiveMetrics:', err.message);
    const strain = energyLevel <= 2 ? 75 : energyLevel === 3 ? 45 : 20;
    const sent = energyLevel <= 2 ? -0.5 : energyLevel === 3 ? 0.0 : 0.6;
    return {
      sentimentScore: sent,
      cognitiveStrain: strain,
      affectiveValence: energyLevel <= 2 ? 'Frustrated' : 'Neutral',
      primaryConcern: 'General Operational Feedback'
    };
  }
}

/**
 * Semantically clusters workplace submissions into Weekly Hurdles and Monthly Systemic Bottlenecks.
 */
export async function generateSemanticClusters(submissions) {
  const recentItems = submissions.slice(-30).map(s => ({
    category: s.category || 'General',
    text: s.neutralizedContent || s.neutralizedText || s.blockers || s.content,
    strain: s.cognitiveStrain || 50,
    timestamp: s.timestamp
  })).filter(s => s.text);

  const prompt = `You are an HR workplace climate analyst evaluating anonymous employee submissions.
Analyze these recent employee submissions and group them into:
1. Top Weekly Operational Hurdles (short-term execution friction, tooling bugs, immediate blockers)
2. Monthly Systemic Bottlenecks (chronic structural or team workflow challenges)
3. Actionable HR Recommendations (concrete operational solutions)

Recent Submissions:
${JSON.stringify(recentItems, null, 2)}

Respond with strict JSON in this exact format:
{
  "weeklyHurdles": [
    {
      "id": "wh-1",
      "title": "<Concise issue title>",
      "category": "Tooling" | "Communication" | "Workload" | "Process",
      "frequency": <number of related mentions>,
      "severity": "Moderate" | "High" | "Critical",
      "impactSummary": "<1-2 sentence description of impact on team morale>",
      "sampleQuote": "<Neutralized quote from feedback>"
    }
  ],
  "monthlySystemicChallenges": [
    {
      "id": "mc-1",
      "title": "<Strategic bottleneck title>",
      "category": "Organizational Architecture" | "Culture & Retention" | "Resource Allocation",
      "persistenceWeeks": <number, e.g. 3 or 4>,
      "burnoutRisk": "Elevated" | "High" | "Severe",
      "underlyingRootCause": "<Deeper systemic cause>",
      "impactSummary": "<Impact on team turnover and productivity>"
    }
  ],
  "leadershipRecommendations": [
    {
      "priority": 1,
      "intervention": "<Specific practical action HR should implement>",
      "targetArea": "<Focus area>",
      "expectedOutcome": "<Expected improvement>"
    }
  ]
}`;

  try {
    const rawResult = await callGemini(prompt, '', 4000, { json: true });
    const parsed = parseJsonResponse(rawResult);
    if (!Array.isArray(parsed.weeklyHurdles) || !Array.isArray(parsed.monthlySystemicChallenges)) {
      throw new Error('Cluster response is missing weeklyHurdles/monthlySystemicChallenges');
    }
    return parsed;
  } catch (err) {
    console.error('Error clustering with Gemini:', err.message);
    // Return structured default clusters if API fails
    return null;
  }
}

/**
 * Interactive discussion assistant for HR to analyze, discuss, and brainstorm
 * solutions regarding employee complaints, specific named conflicts, or systemic hurdles.
 */
export async function discussProblemsWithAI(userQuestion, submissions = [], clusters = {}, chatHistory = []) {
  const anonymizedReports = submissions.slice(0, 12).map(s => ({
    department: s.department,
    text: s.neutralizedContent || s.blockers || s.content,
    strain: s.cognitiveStrain
  }));

  const systemInstruction = `You are the Strategic HR People & Operations Advisor for WellNest.
Your role is to help the HR Lead (Raunak) analyze, discuss, and strategize solutions for employee feedback, interpersonal frictions, bottlenecks, and team health.

CONTEXT (Recent Employee Feedback & Submissions):
${JSON.stringify(anonymizedReports, null, 2)}

ACTIVE PROBLEM CLUSTERS:
- Weekly Operational Hurdles: ${JSON.stringify(clusters?.weeklyHurdles?.map(w => w.title) || [])}
- Monthly Systemic Bottlenecks: ${JSON.stringify(clusters?.monthlySystemicChallenges?.map(m => m.title) || [])}

CAPABILITY TO CREATE ACTIONS:
If the user asks you to create/propose an action for the HR Action Board, OR if you provide a clear concrete intervention to solve an ongoing issue, you MUST append a structured JSON action proposal block at the very end of your response in this exact format:
\`\`\`action_proposal
{
  "title": "<Concise action title, e.g. Sales-to-Operations Pre-Scoping Protocol>",
  "description": "<Specific operational/management steps being implemented>",
  "assignedTo": "<Responsible Squad or Leader, e.g. Sales & Ops Leadership>",
  "publicNote": "<Workforce notice visible to all employees on the Company Action Board explaining what is being done>",
  "status": "In Progress"
}
\`\`\`

GUIDELINES:
1. Provide actionable, empathetic, and professional HR leadership advice.
2. If the user asks about specific colleagues mentioned in feedback (e.g., Matthew in Sales, Sarah, Alex), address the structural friction objectively without unfair personal attacks, and propose healthy mediation or management steps.
3. Suggest concrete action plans that HR can publish to the company Action Board.
4. Keep answers concise, direct, and well-structured with bullet points.`;

  const conversationContext = chatHistory.length > 0 
    ? `Recent Conversation:\n${chatHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}\n\n`
    : '';

  const prompt = `${conversationContext}HR LEAD QUESTION: ${userQuestion}\n\nProvide strategic advice and resolution ideas:`;

  try {
    const rawResult = await callGemini(prompt, systemInstruction, 2000);
    let reply = rawResult;
    let actionProposal = null;

    // Check for ```action_proposal ... ``` block
    const actionMatch = rawResult.match(/```action_proposal\s*([\s\S]*?)\s*```/);
    if (actionMatch && actionMatch[1]) {
      try {
        actionProposal = JSON.parse(actionMatch[1].trim());
        reply = rawResult.replace(/```action_proposal[\s\S]*?```/, '').trim();
      } catch (e) {
        console.error('Error parsing action_proposal JSON:', e);
      }
    }

    return { reply, actionProposal };
  } catch (err) {
    console.error('Error in discussProblemsWithAI:', err.message);
    return {
      reply: `⚠️ AI Communication Notice: The Gemini AI service is overloaded or unreachable right now (${err.message}). Please try again in a minute.`,
      actionProposal: null
    };
  }
}
