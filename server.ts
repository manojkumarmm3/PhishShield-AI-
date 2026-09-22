import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

// Initialize GoogleGenAI client lazily or when key exists
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback heuristic analyzer for high-fidelity responses when API key is pending or network fails
function runFallbackAnalysis(content: string, inputType: string) {
  const lower = (content || '').toLowerCase();
  
  const paymentTriggers = [
    'equipment fee', 'wire transfer', 'gift card', 'check cashing',
    'holding deposit', 'crypto', 'cashier\'s check', 'reimbursement check',
    'courier fee', 'western union', 'zelle', 'venmo', 'pay today',
    'vendor payment', 'bitcoin', 'usdt', 'home office supplies', 'certified check'
  ];

  const domainTriggers = [
    '@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com',
    '@aol.com', 't.me/', 'telegram', 'whatsapp', 'signal app'
  ];

  const urgencyTriggers = [
    'urgently', 'immediate start', 'within 24 hours', 'offer expires immediately',
    'act fast', 'limited slot', 'as soon as possible', 'confidential agreement',
    'do not contact hr'
  ];

  const foundPayment = paymentTriggers.filter(term => lower.includes(term));
  const foundDomain = domainTriggers.filter(term => lower.includes(term));
  const foundUrgency = urgencyTriggers.filter(term => lower.includes(term));

  let threatScore = 15;
  const redFlags: Array<{ category: string; flag: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }> = [];
  const highlightedKeywords: Array<{ word: string; riskType: 'PAYMENT' | 'DOMAIN' | 'URGENCY' }> = [];

  if (foundPayment.length > 0) {
    threatScore += 35 + (foundPayment.length - 1) * 10;
    foundPayment.forEach(term => {
      highlightedKeywords.push({ word: term, riskType: 'PAYMENT' });
      redFlags.push({
        category: 'Financial / Advance-Fee Scam',
        flag: `Detected high-risk financial demand involving "${term}". Legitimate employers never require candidates to wire money or purchase equipment from unverified vendors.`,
        severity: 'HIGH'
      });
    });
  }

  if (foundDomain.length > 0) {
    threatScore += 20 + (foundDomain.length - 1) * 8;
    foundDomain.forEach(term => {
      highlightedKeywords.push({ word: term, riskType: 'DOMAIN' });
      redFlags.push({
        category: 'Suspicious Domain / Channel',
        flag: `Communication or submission involves free/unverified messaging channel ("${term}") rather than an authenticated corporate domain.`,
        severity: 'MEDIUM'
      });
    });
  }

  if (foundUrgency.length > 0) {
    threatScore += 15 + (foundUrgency.length - 1) * 5;
    foundUrgency.forEach(term => {
      highlightedKeywords.push({ word: term, riskType: 'URGENCY' });
      redFlags.push({
        category: 'Tactical Urgency & Pressure',
        flag: `Artificial time compression detected ("${term}"). Scammers pressure victims to prevent independent verification.`,
        severity: 'MEDIUM'
      });
    });
  }

  if (inputType === 'url') {
    if (lower.includes('bit.ly') || lower.includes('tinyurl') || lower.includes('-recruiting') || lower.includes('-jobs') || lower.includes('careers-')) {
      threatScore += 25;
      redFlags.push({
        category: 'URL & Domain Spoofing',
        flag: 'Potential typosquatting or URL shortener masking target server destination.',
        severity: 'HIGH'
      });
    }
  }

  threatScore = Math.min(Math.max(threatScore, 8), 98);

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (threatScore >= 80) riskLevel = 'CRITICAL';
  else if (threatScore >= 60) riskLevel = 'HIGH';
  else if (threatScore >= 30) riskLevel = 'MEDIUM';

  const reasoningSummary = threatScore >= 60
    ? `High-confidence phishing indicators identified. The artifact exhibits textbook advance-fee scam signals, unauthorized equipment funding requests, or unverified contact vectors designed to defraud job applicants.`
    : threatScore >= 30
    ? `Moderate anomalies detected. The document contains elements warranting secondary out-of-band verification before signing or sharing banking credentials.`
    : `Low scam probability observed under standard heuristics. Always verify the offer with the company's official human resources department directly.`;

  const recommendedActions = [
    'Do not transfer any funds or purchase hardware through unverified third-party vendor links.',
    'Contact the hiring organization via official switchboard or corporate website to confirm recruiter authenticity.',
    'Examine full email headers for SPF, DKIM, and DMARC authentication alignment.',
    'Never cash advance checks sent before official W-2/I-9 verification.'
  ];

  return {
    scamThreatIndex: threatScore,
    riskLevel,
    reasoningSummary,
    detectedRedFlags: redFlags.length > 0 ? redFlags : [
      {
        category: 'Baseline Heuristics',
        flag: 'Standard phrasing identified without explicit advance-fee payment triggers.',
        severity: 'LOW' as const
      }
    ],
    highlightedKeywords,
    recommendedActions
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // API Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      model: 'gemini-2.5-flash',
      timestamp: new Date().toISOString()
    });
  });

  // Main forensic inspection endpoint
  app.post('/api/inspect', async (req, res) => {
    try {
      const { inputType, content, fileData, mimeType } = req.body;

      if (!content && !fileData) {
        return res.status(400).json({ error: 'Inspection payload requires either content text or file data.' });
      }

      const ai = getAIClient();

      // If no API key is set in environment yet, return heuristic inspection
      if (!ai) {
        console.warn('GEMINI_API_KEY is not set. Executing client heuristic fallback.');
        const fallbackResult = runFallbackAnalysis(content || '', inputType || 'text');
        return res.json({
          ...fallbackResult,
          isHeuristicFallback: true,
          notice: 'Inspection generated via built-in Security Heuristics Engine. Configure GEMINI_API_KEY in Settings > Secrets for Gemini 1.5 Flash deep neural analysis.'
        });
      }

      const promptContext = `
You are a Principal Lead Cybersecurity Specialist and Offer Letter Phishing Forensics Expert.
Analyze the following input thoroughly for scam patterns, advance-fee fraud, pay-for-equipment phishing, deposit traps, recruiter impersonation, domain anomalies, and spoofed RFC 822 email headers.

Input Type: ${inputType}
Content Provided:
${content ? content : '(Multimodal document attached)'}

Instructions:
1. Examine if this contains fake check scams, fake office equipment reimbursement checks, wire transfers, crypto deposits, gift card requests, interview bypasses, high salaries for minimal requirements, suspicious free email domains (@gmail, @yahoo, etc.), or spoofed headers.
2. Determine scamThreatIndex from 0 to 100:
   - 0–29: LOW
   - 30–59: MEDIUM
   - 60–79: HIGH
   - 80–100: CRITICAL
3. Provide rigorous reasoning summary, pinpoint specific red flags with category and severity ('LOW', 'MEDIUM', 'HIGH'), extract high-risk keywords with riskType ('PAYMENT', 'DOMAIN', 'URGENCY'), and list actionable protective recommendations.
`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          scamThreatIndex: {
            type: Type.INTEGER,
            description: 'Base threat rating strictly from 0 to 100',
          },
          riskLevel: {
            type: Type.STRING,
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
          },
          reasoningSummary: {
            type: Type.STRING,
            description: 'Concise, high-impact cybersecurity summary explaining the verdict',
          },
          detectedRedFlags: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                flag: { type: Type.STRING },
                severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
              },
              required: ['category', 'flag', 'severity'],
            },
          },
          highlightedKeywords: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                riskType: { type: Type.STRING, enum: ['PAYMENT', 'DOMAIN', 'URGENCY'] },
              },
              required: ['word', 'riskType'],
            },
          },
          recommendedActions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: [
          'scamThreatIndex',
          'riskLevel',
          'reasoningSummary',
          'detectedRedFlags',
          'highlightedKeywords',
          'recommendedActions',
        ],
      };

      let contentsPayload: any;

      if (fileData && mimeType) {
        contentsPayload = {
          parts: [
            {
              inlineData: {
                data: fileData,
                mimeType: mimeType,
              },
            },
            {
              text: promptContext,
            },
          ],
        };
      } else {
        contentsPayload = promptContext;
      }

      let responseText: string | null = null;
      let lastError: any = null;

      // Model Endpoints: Primary (gemini-2.5-flash), Secondary (gemini-1.5-flash), Tertiary (gemini-2.0-flash / fallback endpoints)
      const models = [
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-2.0-flash',
        'gemini-flash-lite-latest',
        'gemini-3.7-flash',
        'gemini-3.6-flash'
      ];
      const backoffDelays = [1000, 2000, 4000];

      const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms))
        ]);
      };

      for (const modelName of models) {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            console.log(`Attempting analysis with model: ${modelName} (attempt ${attempt + 1}/3)`);
            const response = await withTimeout(
              ai.models.generateContent({
                model: modelName,
                contents: contentsPayload,
                config: {
                  maxOutputTokens: 1000,
                  responseMimeType: 'application/json',
                  responseSchema: responseSchema,
                },
              }),
              20000
            );

            if (response && response.text) {
              responseText = response.text;
              break;
            }
          } catch (err: any) {
            lastError = err;
            const errMsg = String(err?.message || err);
            const isNotFound = errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('no longer available');
            console.warn(`Attempt ${attempt + 1}/3 on model ${modelName} failed:`, errMsg);

            if (isNotFound) {
              // Immediately advance to next model if model endpoint is retired/unsupported
              break;
            }

            // Exponential backoff for 503 (UNAVAILABLE), 429 (RATE_LIMIT), or timeout
            if (attempt < 2) {
              const delay = backoffDelays[attempt] || 1000;
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }
        if (responseText) break;
      }

      if (!responseText) {
        throw new Error(lastError?.message || 'All candidate models failed or returned 503.');
      }

      const parsedData = JSON.parse(responseText.trim());
      return res.json({
        ...parsedData,
        isHeuristicFallback: false,
        notice: null,
      });
    } catch (err: any) {
      console.error('Gemini Inspection Error / Server Load Spike:', err);
      // Graceful heuristic fallback state on 503 / high demand / quota exhaustion
      const fallbackResult = runFallbackAnalysis(req.body.content || '', req.body.inputType || 'text');
      return res.json({
        ...fallbackResult,
        isHeuristicFallback: true,
        notice: '⚠️ AI servers are experiencing high traffic. Displaying real-time local cybersecurity heuristic analysis.'
      });
    }
  });

  // Setup Vite or Static File Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PhishShield AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
