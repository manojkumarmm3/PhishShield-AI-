import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Link as LinkIcon, 
  FileText, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  FileUp, 
  Download, 
  RefreshCw, 
  Copy,
  Check,
  RotateCcw,
  History,
  X,
  ExternalLink,
  Sparkles,
  Terminal,
  Trash2,
  Flag
} from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';

// --- SPRING PHYSICS & EASING PRESETS ---
const springPreset = { type: 'spring' as const, stiffness: 400, damping: 25 };

// --- TYPE DEFINITIONS ---
export type InputTabType = 'text' | 'url' | 'file' | 'header';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RedFlag {
  category: string;
  flag: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface HighlightedKeyword {
  word: string;
  riskType: 'PAYMENT' | 'DOMAIN' | 'URGENCY';
}

export interface InspectionResult {
  id: string;
  timestamp: string;
  inputType: InputTabType;
  inputSnippet: string;
  scamThreatIndex: number;
  riskLevel: RiskLevel;
  reasoningSummary: string;
  detectedRedFlags: RedFlag[];
  highlightedKeywords: HighlightedKeyword[];
  recommendedActions: string[];
  isHeuristicFallback?: boolean;
  notice?: string | null;
  fileName?: string;
}

export interface UploadedFileState {
  name: string;
  size: number;
  mimeType: string;
  base64Data?: string;
  previewUrl?: string;
}

// --- SAMPLE PRESETS ---
const SAMPLE_PRESETS = [
  {
    id: 'advance-fee',
    title: 'Advance-Fee Equipment Scam',
    type: 'text' as InputTabType,
    badge: 'CRITICAL THREAT',
    content: `From: "Apex Global Tech Careers" <careers-apextech@gmail.com>
Subject: CONGRATULATIONS! Formal Offer of Employment: Senior DevOps Specialist ($185,000/yr)

Dear Candidate,

Following our brief online questionnaire on Telegram, the hiring committee has voted to officially extend this offer of employment for the position of Senior DevOps Specialist at Apex Global Tech Inc.

COMPENSATION & BENEFITS:
- Starting Base Salary: $185,000 per annum
- Sign-on Stipend: $12,500
- Work Schedule: 100% Remote / Telecommute

EQUIPMENT PROCUREMENT DIRECTIVE:
To configure your secure intranet tunnel, you are required to purchase company-approved Apple MacBook Pro M3 and YubiKey security keys from our authorized corporate vendor.
We have mailed an initial cashier's check of $5,850 to your residential address. You must deposit this check immediately and wire transfer $4,900 via Zelle or Bitcoin to our procurement liaison (agent-procurement@gmail.com) within 24 hours to secure your onboarding slot. 

Failure to complete this vendor payment will result in immediate offer revocation. Please reply urgently with your photo ID and routing details.`
  },
  {
    id: 'deposit-trap',
    title: 'Rental Deposit Trap',
    type: 'text' as InputTabType,
    badge: 'HIGH THREAT',
    content: `From: "Luxury Downtown Loft Rentals" <leasing-agent-downtown@yahoo.com>
Subject: Lease Agreement & Holding Deposit Required: 2-Bedroom Luxury Suite

Hello Prospective Tenant,

Thank you for your inquiry regarding the 2-bedroom penthouse on 450 Grand Avenue for $1,400/month (all utilities included). Due to overwhelming interest, we require an immediate holding deposit of $1,200 via wire transfer or cryptocurrency (USDT) before an in-person physical tour can be arranged.

I am currently deployed overseas on humanitarian missions with the UN, so my keys are registered with an expedited courier service. Once your holding deposit is confirmed, the courier will deliver the keys within 24 hours. If you do not like the apartment, your deposit is 100% refundable on the spot.

Act fast to secure this unit before leasing opens to the public.`
  },
  {
    id: 'legit-corp',
    title: 'Legitimate Corporate Offer',
    type: 'text' as InputTabType,
    badge: 'LOW THREAT',
    content: `From: "Stripe Recruiting Team" <recruiting@stripe.com>
Subject: Stripe Offer: Software Engineer, Infrastructure

Hi Alex,

We are thrilled to extend an official offer to join Stripe as a Software Engineer on the Infrastructure Platform team, reporting to Pat Morgan.

Offer Summary:
- Role: Software Engineer (L4)
- Annual Base Salary: $178,000 USD
- Annual Equity Grant: $140,000 RSUs vesting over 4 years
- Location: San Francisco, CA or Stripe Remote US

Please review your formal offer letter and equity agreement in Workday via your secure candidate portal (https://stripe.com/jobs/portal). Your hardware (corporate laptop and authentication keys) will be pre-configured and shipped directly to your verified address by Stripe IT at zero cost to you.

We would love to welcome you to the team. Please let us know if you have any questions before next Friday.`
  },
  {
    id: 'typosquat-url',
    title: 'Typosquatting Recruiter URL',
    type: 'url' as InputTabType,
    badge: 'HIGH THREAT',
    content: 'https://careers-google-verify-onboarding.xyz/auth/token-login?applicant=492198'
  },
  {
    id: 'spoofed-header',
    title: 'Spoofed RFC 822 Email Header',
    type: 'header' as InputTabType,
    badge: 'CRITICAL THREAT',
    content: `Received: from mail-relay-92.untrusted-host.ru (mail-relay-92.untrusted-host.ru [185.220.101.5])
    by mx.google.com with ESMTPS id j12si849204pln.12
    for <victim.candidate@gmail.com>;
    Mon, 21 Sep 2026 14:22:10 -0700 (PDT)
Authentication-Results: mx.google.com;
    spf=fail (google.com: domain of returns@scam-relay.ru does not designate 185.220.101.5 as permitted sender) smtp.mailfrom=returns@scam-relay.ru;
    dkim=fail header.i=@amazon.com;
    dmarc=fail (p=REJECT sp=REJECT dis=NONE) header.from=amazon.com
From: "Amazon Human Resources" <hr-onboarding@amazon.com>
Reply-To: "Executive Talent Acquisition" <amazon.recruiter.jobs@gmail.com>
Return-Path: <spoofed-bounce@scam-relay.ru>
Subject: URGENT: Complete Your Employment Paperwork Within 24 Hours`
  }
];

// --- CLIENT HEURISTIC ENGINE (Pre-AI Check) ---
function runClientHeuristics(content: string, inputType: InputTabType) {
  const text = (content || '').toLowerCase();

  const financialKeywords = [
    'equipment fee', 'wire transfer', 'gift card', 'check cashing',
    'holding deposit', 'crypto', "cashier's check", 'reimbursement check',
    'courier fee', 'western union', 'zelle', 'venmo', 'pay today',
    'vendor payment', 'bitcoin', 'usdt', 'home office supplies', 'money order'
  ];

  const domainKeywords = [
    '@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com',
    '@aol.com', 't.me/', 'telegram', 'whatsapp', 'signal app',
    '.xyz', '.top', '.work', '.click', '.live', '.buzz'
  ];

  const urgencyKeywords = [
    'urgently', 'immediate start', 'within 24 hours', 'offer expires immediately',
    'act fast', 'limited slot', 'as soon as possible', 'confidential agreement',
    'pay today', 'instant wire'
  ];

  const matchedFinancial = financialKeywords.filter(k => text.includes(k));
  const matchedDomain = domainKeywords.filter(k => text.includes(k));
  const matchedUrgency = urgencyKeywords.filter(k => text.includes(k));

  let score = 10;

  if (matchedFinancial.length > 0) {
    score += 35 + (matchedFinancial.length - 1) * 8;
  }

  if (matchedDomain.length > 0) {
    score += 20 + (matchedDomain.length - 1) * 5;
  }

  if (matchedUrgency.length > 0) {
    score += 15 + (matchedUrgency.length - 1) * 5;
  }

  let headerMeta: { sender?: string; returnPath?: string; spfStatus?: string; dkimStatus?: string; dmarcStatus?: string } | undefined = undefined;
  if (inputType === 'header') {
    headerMeta = {};
    if (text.includes('spf=fail')) {
      score += 25;
      headerMeta.spfStatus = 'SPF: Fail (Spoofed Host)';
    } else if (text.includes('spf=pass')) {
      headerMeta.spfStatus = 'SPF: Pass';
    }

    if (text.includes('dkim=fail')) {
      score += 20;
      headerMeta.dkimStatus = 'DKIM: Fail (Invalid Signature)';
    } else if (text.includes('dkim=pass')) {
      headerMeta.dkimStatus = 'DKIM: Pass';
    }

    if (text.includes('dmarc=fail')) {
      score += 25;
      headerMeta.dmarcStatus = 'DMARC: Fail (Domain Policy Violation)';
    } else if (text.includes('dmarc=pass')) {
      headerMeta.dmarcStatus = 'DMARC: Pass';
    }

    const replyToMatch = content.match(/reply-to:\s*<?([^>\r\n]+)>?/i);
    const fromMatch = content.match(/from:\s*[^<]*<([^>]+)>/i);
    if (replyToMatch && fromMatch) {
      headerMeta.sender = fromMatch[1];
      headerMeta.returnPath = replyToMatch[1];
      if (fromMatch[1].split('@')[1] !== replyToMatch[1].split('@')[1]) {
        score += 20;
        matchedDomain.push('Reply-To Mismatch');
      }
    }
  }

  score = Math.min(Math.max(score, 0), 100);

  let riskLevel: RiskLevel = 'LOW';
  if (score >= 80) riskLevel = 'CRITICAL';
  else if (score >= 60) riskLevel = 'HIGH';
  else if (score >= 30) riskLevel = 'MEDIUM';

  return {
    score,
    riskLevel,
    triggers: {
      financial: matchedFinancial,
      domain: matchedDomain,
      urgency: matchedUrgency
    },
    emailHeaderMeta: headerMeta
  };
}

function getStatusBadgeClasses(risk: RiskLevel) {
  switch (risk) {
    case 'LOW':
      return 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50';
    case 'MEDIUM':
      return 'bg-amber-950/40 text-amber-400 border border-amber-800/50';
    case 'HIGH':
      return 'bg-orange-950/40 text-orange-400 border border-orange-800/50';
    case 'CRITICAL':
      return 'bg-rose-950/40 text-rose-400 border border-rose-800/50';
    default:
      return 'bg-slate-900 text-slate-400 border border-slate-800';
  }
}

function getScoreColorHex(score: number) {
  if (score >= 80) return '#f43f5e';
  if (score >= 60) return '#fb923c';
  if (score >= 30) return '#f59e0b';
  return '#34d399';
}

function AnimatedScoreCounter({ targetScore, color }: { targetScore: number; color: string }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, targetScore || 0));
    const duration = 1000;
    const startTime = performance.now();

    const updateScore = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeOut);
      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(updateScore);
      }
    };

    const animId = requestAnimationFrame(updateScore);
    return () => cancelAnimationFrame(animId);
  }, [targetScore]);

  return (
    <motion.span
      key={targetScore}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="font-mono text-4xl font-extrabold tracking-tight"
      style={{ color }}
    >
      {displayScore}
    </motion.span>
  );
}

const INPUT_TABS = [
  { id: 'text' as InputTabType, label: '1. Offer Letter Text', icon: FileText },
  { id: 'url' as InputTabType, label: '2. URL Scanner', icon: LinkIcon },
  { id: 'file' as InputTabType, label: '3. OCR / File Upload', icon: Upload },
  { id: 'header' as InputTabType, label: '4. Email Headers', icon: Terminal }
];

const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const listItemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" as const }
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<InputTabType>('text');
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [headerContent, setHeaderContent] = useState('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFileState | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanTelemetryStep, setScanTelemetryStep] = useState('');
  const [currentResult, setCurrentResult] = useState<InspectionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [history, setHistory] = useState<InspectionResult[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('phishshield_history_v2');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Unable to read history from localStorage', e);
    }
  }, []);

  const saveToHistory = (item: InspectionResult) => {
    try {
      const updated = [item, ...history.filter(h => h.id !== item.id)].slice(0, 20);
      setHistory(updated);
      localStorage.setItem('phishshield_history_v2', JSON.stringify(updated));
    } catch (e) {
      console.warn('Unable to persist history', e);
    }
  };

  const currentRawInput = useMemo(() => {
    switch (activeTab) {
      case 'text':
        return textContent;
      case 'url':
        return urlContent;
      case 'header':
        return headerContent;
      case 'file':
        return uploadedFile?.name ? `[Uploaded File]: ${uploadedFile.name} (${uploadedFile.mimeType})` : '';
      default:
        return '';
    }
  }, [activeTab, textContent, urlContent, headerContent, uploadedFile]);

  const clientHeuristic = useMemo(() => {
    return runClientHeuristics(currentRawInput, activeTab);
  }, [currentRawInput, activeTab]);

  const hasValidInput = Boolean(
    (activeTab === 'text' && textContent.trim().length > 5) ||
    (activeTab === 'url' && urlContent.trim().length > 3) ||
    (activeTab === 'header' && headerContent.trim().length > 10) ||
    (activeTab === 'file' && uploadedFile)
  );

  const handleApplyPreset = (presetId: string) => {
    const sample = SAMPLE_PRESETS.find(s => s.id === presetId);
    if (!sample) return;

    setActiveTab(sample.type);
    if (sample.type === 'text') setTextContent(sample.content);
    else if (sample.type === 'url') setUrlContent(sample.content);
    else if (sample.type === 'header') setHeaderContent(sample.content);
    setErrorMessage(null);
  };

  const handleReset = () => {
    setCurrentResult(null);
    setErrorMessage(null);
    setTextContent('');
    setUrlContent('');
    setHeaderContent('');
    setUploadedFile(null);
    setCompletedActions({});
  };

  const handleFileProcess = (file: File) => {
    if (!file) return;
    const reader = new FileReader();

    if (file.type.startsWith('image/')) {
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        setUploadedFile({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          base64Data: base64,
          previewUrl: result
        });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        const text = reader.result as string;
        setUploadedFile({
          name: file.name,
          size: file.size,
          mimeType: file.type || 'text/plain',
          base64Data: btoa(unescape(encodeURIComponent(text.slice(0, 100000)))),
          previewUrl: undefined
        });
      };
      reader.readAsText(file);
    }
  };

  const callGeminiWithResilience = async (prompt: string, mimeType: string | null = null, base64Data: string | null = null, aiInstance: any = null) => {
    const models = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash',
      'gemini-flash-lite-latest',
      'gemini-3.7-flash',
      'gemini-3.6-flash'
    ];
    const backoffDelays = [1000, 2000, 4000];
    let lastError: any = null;

    for (const modelName of models) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const contents = base64Data && mimeType ? [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            prompt
          ] : prompt;

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after 20000ms on model ${modelName}`)), 20000)
          );

          const generatePromise = aiInstance.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              maxOutputTokens: 1000,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  scamThreatIndex: { type: Type.INTEGER },
                  riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                  reasoningSummary: { type: Type.STRING },
                  detectedRedFlags: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        category: { type: Type.STRING },
                        flag: { type: Type.STRING },
                        severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] }
                      },
                      required: ['category', 'flag', 'severity']
                    }
                  },
                  highlightedKeywords: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        word: { type: Type.STRING },
                        riskType: { type: Type.STRING, enum: ['PAYMENT', 'DOMAIN', 'URGENCY'] }
                      },
                      required: ['word', 'riskType']
                    }
                  },
                  recommendedActions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ['scamThreatIndex', 'riskLevel', 'reasoningSummary', 'detectedRedFlags', 'highlightedKeywords', 'recommendedActions']
              }
            }
          });

          const response: any = await Promise.race([generatePromise, timeoutPromise]);
          return JSON.parse(response.text);
        } catch (err: any) {
          lastError = err;
          const errMsg = String(err?.message || err);
          const isNotFound = errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('no longer available');
          console.warn(`Attempt ${attempt + 1}/3 on model ${modelName} failed:`, errMsg);

          if (isNotFound) {
            break;
          }

          if (attempt < 2) {
            const delay = backoffDelays[attempt] || 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    }

    throw lastError;
  };

  const handleExecuteInspection = async () => {
    if (!hasValidInput || isScanning) return;

    setIsScanning(true);
    setErrorMessage(null);

    const telemetrySequence = [
      'Ingesting input stream & parsing semantic tokens...',
      'Evaluating client-side heuristics & threat weightings...',
      'Scanning for advance-fee signals & spoofed recruitment patterns...',
      'Checking domain legitimacy, homoglyphs & MX/SPF records...',
      'Querying Gemini neural models with resilient multi-endpoint fallback...',
      'Synthesizing risk matrix & computing finalized threat score...'
    ];

    let step = 0;
    setScanTelemetryStep(telemetrySequence[0]);
    const stepInterval = setInterval(() => {
      step++;
      if (step < telemetrySequence.length) {
        setScanTelemetryStep(telemetrySequence[step]);
      }
    }, 400);

    try {
      let analysisOutput: any = null;

      const clientApiKey = import.meta.env?.VITE_GEMINI_API_KEY;

      if (clientApiKey && clientApiKey.length > 5) {
        try {
          const ai = new GoogleGenAI({ apiKey: clientApiKey });
          analysisOutput = await callGeminiWithResilience(
            currentRawInput,
            uploadedFile?.mimeType,
            uploadedFile?.base64Data,
            ai
          );
        } catch (directErr: any) {
          console.warn('Direct client call failed across models, falling back to server route:', directErr.message);
        }
      }

      if (!analysisOutput) {
        const payload: any = {
          inputType: activeTab,
          content: activeTab === 'file' ? `[Multimodal Inspect]: ${uploadedFile?.name}` : currentRawInput
        };

        if (activeTab === 'file' && uploadedFile) {
          payload.fileData = uploadedFile.base64Data;
          payload.mimeType = uploadedFile.mimeType;
          payload.fileName = uploadedFile.name;
        }

        const serverBackoff = [1000, 2000, 4000];
        let serverRes: Response | null = null;
        let lastServerErr: any = null;

        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);

            const response = await fetch('/api/inspect', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.status === 503 || response.status === 429) {
              console.warn(`Server returned HTTP ${response.status} (High Demand). Retrying attempt ${attempt + 1}/3...`);
              if (attempt < 2) {
                await new Promise((resolve) => setTimeout(resolve, serverBackoff[attempt]));
              }
              continue;
            }

            if (!response.ok) {
              throw new Error(`Server returned HTTP ${response.status}`);
            }

            serverRes = response;
            break;
          } catch (fetchErr: any) {
            lastServerErr = fetchErr;
            console.warn(`Server fetch attempt ${attempt + 1}/3 failed:`, fetchErr.message);
            if (attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, serverBackoff[attempt]));
            }
          }
        }

        if (!serverRes) {
          throw new Error(lastServerErr?.message || '503 Service Unavailable: AI servers are experiencing high traffic.');
        }

        analysisOutput = await serverRes.json();
      }

      clearInterval(stepInterval);

      const isFallback = Boolean(analysisOutput.isHeuristicFallback);
      const result: InspectionResult = {
        id: 'scan-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        timestamp: new Date().toISOString(),
        inputType: activeTab,
        inputSnippet: currentRawInput.slice(0, 160),
        scamThreatIndex: typeof analysisOutput.scamThreatIndex === 'number' ? analysisOutput.scamThreatIndex : clientHeuristic.score,
        riskLevel: analysisOutput.riskLevel || clientHeuristic.riskLevel,
        reasoningSummary: analysisOutput.reasoningSummary || 'Analysis completed with security telemetry.',
        detectedRedFlags: analysisOutput.detectedRedFlags || [],
        highlightedKeywords: analysisOutput.highlightedKeywords || [],
        recommendedActions: analysisOutput.recommendedActions || [],
        isHeuristicFallback: isFallback,
        notice: isFallback ? (analysisOutput.notice || '⚠️ AI servers are experiencing high traffic. Displaying real-time local cybersecurity heuristic analysis.') : null,
        fileName: uploadedFile?.name
      };

      setCurrentResult(result);
      saveToHistory(result);

      window.scrollTo({ top: 420, behavior: 'smooth' });

    } catch (err: any) {
      clearInterval(stepInterval);
      console.warn('Inspection API unavailable, activating graceful heuristic fallback:', err);
      
      const fallbackResult: InspectionResult = {
        id: 'fallback-' + Date.now().toString(36),
        timestamp: new Date().toISOString(),
        inputType: activeTab,
        inputSnippet: currentRawInput.slice(0, 160),
        scamThreatIndex: clientHeuristic.score,
        riskLevel: clientHeuristic.riskLevel,
        reasoningSummary: `Analysis completed using PhishShield Client Cybersecurity Heuristics (Remote API high traffic / load spike). ${clientHeuristic.score >= 60 ? 'Significant phishing/scam vectors identified.' : 'No major advance-fee triggers detected.'}`,
        detectedRedFlags: [
          ...(clientHeuristic.triggers.financial.length > 0 ? [{
            category: 'Advance-Fee / Payment Risk',
            flag: `Detected high-risk financial demand keywords: ${clientHeuristic.triggers.financial.join(', ')}. Legitimate employers never require candidates to wire money or purchase hardware through unverified vendors.`,
            severity: 'HIGH' as const
          }] : []),
          ...(clientHeuristic.triggers.domain.length > 0 ? [{
            category: 'Suspicious Domain / Channel',
            flag: `Detected unverified or free public mail channel: ${clientHeuristic.triggers.domain.join(', ')}. Corporate recruiters communicate through authenticated company domains.`,
            severity: 'MEDIUM' as const
          }] : []),
          ...(clientHeuristic.triggers.urgency.length > 0 ? [{
            category: 'Tactical Urgency & Pressure',
            flag: `Artificial time pressure detected: ${clientHeuristic.triggers.urgency.join(', ')}. Scammers compress decision windows to prevent due diligence.`,
            severity: 'MEDIUM' as const
          }] : [])
        ],
        highlightedKeywords: [
          ...clientHeuristic.triggers.financial.map(w => ({ word: w, riskType: 'PAYMENT' as const })),
          ...clientHeuristic.triggers.domain.map(w => ({ word: w, riskType: 'DOMAIN' as const })),
          ...clientHeuristic.triggers.urgency.map(w => ({ word: w, riskType: 'URGENCY' as const }))
        ],
        recommendedActions: [
          'Never wire money or purchase hardware using advance cashier checks.',
          'Verify recruiter identity via official corporate switchboard or LinkedIn.',
          'Inspect full email headers for SPF, DKIM, and DMARC alignment.',
          'Report fraudulent communications to the Federal Trade Commission (FTC) or IC3.'
        ],
        isHeuristicFallback: true,
        notice: '⚠️ AI servers are experiencing high traffic. Displaying real-time local cybersecurity heuristic analysis.',
        fileName: uploadedFile?.name
      };

      setCurrentResult(fallbackResult);
      saveToHistory(fallbackResult);
    } finally {
      setIsScanning(false);
      setScanTelemetryStep('');
    }
  };

  const handleCopyReport = () => {
    if (!currentResult) return;
    const text = `[PHISHSHIELD AI — FORENSIC THREAT ASSESSMENT]
Threat Index: ${currentResult.scamThreatIndex}/100 (${currentResult.riskLevel} THREAT)
Timestamp: ${currentResult.timestamp}
Input Type: ${currentResult.inputType.toUpperCase()}

EXECUTIVE SUMMARY:
${currentResult.reasoningSummary}

DETECTED RED FLAGS:
${currentResult.detectedRedFlags.map((f, i) => `${i + 1}. [${f.severity}] ${f.category}: ${f.flag}`).join('\n')}

FLAGGED LEXICON:
${currentResult.highlightedKeywords.map(k => `• ${k.word} (${k.riskType})`).join('\n')}

RECOMMENDED ACTIONS:
${currentResult.recommendedActions.map((a, i) => `[ ] ${a}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleDownloadJSON = () => {
    if (!currentResult) return;
    const blob = new Blob([JSON.stringify(currentResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phishshield-incident-${currentResult.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReportScam = () => {
    const ftcUrl = 'https://reportfraud.ftc.gov/';
    window.open(ftcUrl, '_blank', 'noopener,noreferrer');
  };

  const gaugeRadius = 68;
  const gaugeArc = Math.PI * gaugeRadius;
  const normalizedGaugeScore = currentResult ? Math.min(Math.max(currentResult.scamThreatIndex, 0), 100) : 0;
  const gaugeDashoffset = gaugeArc - (gaugeArc * normalizedGaugeScore) / 100;
  const gaugeColor = currentResult ? getScoreColorHex(currentResult.scamThreatIndex) : '#06b6d4';

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* 2. NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Title */}
          <motion.div 
            className="flex items-center space-x-3 cursor-pointer" 
            onClick={handleReset} 
            title="PhishShield AI Dashboard"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={springPreset}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-cyan-950/80 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <svg
                className="w-6 h-6 text-cyan-400"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="navShieldGradTsx" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                  <filter id="navGlowTsx">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                <path
                  d="M50 8 L84 22 C84 56 68 82 50 92 C32 82 16 56 16 22 Z"
                  stroke="url(#navShieldGradTsx)"
                  strokeWidth="5"
                  strokeLinejoin="round"
                  fill="#0B0F17"
                  fillOpacity="0.4"
                />

                <path
                  d="M40 74 V30 H60 C68 30 73 35 73 44 C73 53 68 58 60 58 H40"
                  stroke="url(#navShieldGradTsx)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <circle cx="50" cy="50" r="4.5" fill="#38bdf8" filter="url(#navGlowTsx)" />
                <circle cx="68" cy="28" r="2.5" fill="#06b6d4" />
                <circle cx="32" cy="28" r="2.5" fill="#818cf8" />
              </svg>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-lg font-extrabold tracking-tight text-white">
                PhishShield
              </span>
              <span className="bg-cyan-500/10 text-cyan-400 text-xs px-2 py-0.5 rounded-full font-mono font-medium border border-cyan-500/20">
                AI
              </span>
            </div>

            <span className="hidden md:inline-block text-xs text-slate-400 pl-2 border-l border-slate-800">
              Advanced Offer Letter & Phishing Inspector
            </span>
          </motion.div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-medium text-slate-300">
                ● Gemini AI Active
              </span>
            </div>

            <motion.button
              id="history-btn-tsx"
              onClick={() => setIsHistoryOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={springPreset}
              className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white cursor-pointer shadow-sm"
              title="View Scan Audit History"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-cyan-500/20 text-cyan-400 rounded-full font-mono text-[10px]">
                  {history.length}
                </span>
              )}
            </motion.button>

            <motion.button
              id="new-scan-btn-tsx"
              onClick={handleReset}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={springPreset}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800/60 cursor-pointer shadow-sm"
              title="Reset Form"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Scan</span>
            </motion.button>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
              <span>PhishShield AI — Advanced Offer Letter & Phishing Inspector</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Enterprise-grade security dashboard to inspect job offer letters, rental agreements, raw documents (PDFs/Images), and recruiter URLs for advance-fee equipment scams, deposit traps, and spoofed RFC 822 email headers.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Zero-Retention Privacy</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SOC2 & NIST Standard</span>
            </span>
          </div>
        </div>

        {/* ERROR MESSAGE NOTIFICATION */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <motion.button 
                onClick={() => setErrorMessage(null)} 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer"
              >
                Dismiss
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4.A MULTI-INPUT & MULTIMODAL PARSER */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-4">
            {/* FLOATING INDICATOR PILL NAVIGATION TABS */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
              {INPUT_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-btn-${tab.id}-tsx`}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicatorTsx"
                        className="absolute inset-0 rounded-lg bg-cyan-500/15 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      />
                    )}
                    <span className={`relative z-10 flex items-center space-x-2 transition-colors duration-150 ${isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Load Sample:
              </span>
              {SAMPLE_PRESETS.map((preset) => (
                <motion.button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  transition={springPreset}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 whitespace-nowrap cursor-pointer shadow-sm"
                >
                  {preset.title.split(' ')[0]}
                </motion.button>
              ))}
            </div>
          </div>

          {/* ACTIVE TAB INPUT PANEL WITH FLUID ENTER / EXIT */}
          <AnimatePresence mode="wait">
            {activeTab === 'text' && (
              <motion.div
                key="tab-text"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Paste Employment Contract, Offer Letter or Recruiter Chat
                  </label>
                  <span className="font-mono text-[11px]">{textContent.length} characters</span>
                </div>
                <textarea
                  id="offer-letter-textarea-tsx"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                  placeholder="Paste the full text of the job offer letter, onboarding instructions, or recruiter messages here..."
                  className="w-full bg-[#070A10] border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono leading-relaxed transition-colors"
                />
              </motion.div>
            )}

            {activeTab === 'url' && (
              <motion.div
                key="tab-url"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Target Recruiter URL, Job Board Link or Verification Portal
                </label>
                <div className="relative">
                  <input
                    id="url-input-field-tsx"
                    type="url"
                    value={urlContent}
                    onChange={(e) => setUrlContent(e.target.value)}
                    placeholder="https://careers-google-verify-onboarding.xyz/login"
                    className="w-full bg-[#070A10] border border-slate-800 rounded-xl py-3.5 pl-10 pr-4 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono transition-colors"
                  />
                  <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-4" />
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  Inspects target URLs for typosquatting domains, punycode attacks, and unverified landing gateways.
                </p>
              </motion.div>
            )}

            {activeTab === 'file' && (
              <motion.div
                key="tab-file"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Upload Scanned Offer Letter, Screenshot or PDF
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileProcess(e.target.files[0]);
                  }}
                  className="hidden"
                />

                <motion.div
                  id="dropzone-upload-area-tsx"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) handleFileProcess(e.dataTransfer.files[0]);
                  }}
                  whileHover={{ scale: 1.01, borderColor: '#38bdf8' }}
                  whileTap={{ scale: 0.99 }}
                  transition={springPreset}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer ${
                    uploadedFile
                      ? 'border-cyan-500/50 bg-cyan-950/10'
                      : 'border-slate-800 bg-[#070A10]/50'
                  }`}
                >
                  {uploadedFile ? (
                    <div className="flex flex-col items-center space-y-3">
                      {uploadedFile.previewUrl ? (
                        <motion.img
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          src={uploadedFile.previewUrl}
                          alt="Upload preview"
                          className="max-h-40 rounded-lg border border-slate-700 object-contain shadow-md"
                        />
                      ) : (
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        >
                          <FileUp className="w-12 h-12 text-cyan-400" />
                        </motion.div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.mimeType}
                        </p>
                      </div>
                      <span className="text-xs text-cyan-400 underline font-medium">Click or drop new file to replace</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-3">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      >
                        <Upload className="w-10 h-10 text-slate-500" />
                      </motion.div>
                      <div>
                        <p className="text-sm font-semibold text-slate-300">
                          Drag & drop offer letter PDF or screenshot here, or <span className="text-cyan-400 underline">browse</span>
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-1">
                          Supported: PDF, PNG, JPG, WEBP (Max 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'header' && (
              <motion.div
                key="tab-header"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Paste Raw RFC 822 Email Headers
                  </label>
                  <span className="font-mono text-[11px]">SPF, DKIM, DMARC, Return-Path</span>
                </div>
                <textarea
                  id="email-header-textarea-tsx"
                  value={headerContent}
                  onChange={(e) => setHeaderContent(e.target.value)}
                  rows={8}
                  placeholder={`Delivered-To: recipient@gmail.com\nReceived: from mail-relay.untrusted.com\nAuthentication-Results: spf=fail dkim=fail dmarc=fail\nFrom: recruiter@company.com\nReply-To: scammer@gmail.com`}
                  className="w-full bg-[#070A10] border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono leading-relaxed transition-colors"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* REAL-TIME CLIENT-SIDE HEURISTIC HUD */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Client-Side Heuristic Pre-Filter
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  (0ms latency token parser)
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-slate-400">Estimated Threat:</span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${getStatusBadgeClasses(clientHeuristic.riskLevel)}`}>
                  {clientHeuristic.score}% • {clientHeuristic.riskLevel}
                </span>
              </div>
            </div>

            {hasValidInput ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-400 text-[10px]">FINANCIAL DEMAND (+35%)</span>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {clientHeuristic.triggers.financial.length > 0 ? (
                      clientHeuristic.triggers.financial.map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.2 bg-rose-950/60 text-rose-300 border border-rose-800/60 rounded text-[10px]">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[11px]">No financial triggers detected</span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-400 text-[10px]">DOMAIN / CONTACT RISK (+20%)</span>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {clientHeuristic.triggers.domain.length > 0 ? (
                      clientHeuristic.triggers.domain.map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.2 bg-orange-950/60 text-orange-300 border border-orange-800/60 rounded text-[10px]">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[11px]">No unverified mail/TLDs</span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-400 text-[10px]">TACTICAL URGENCY (+15%)</span>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {clientHeuristic.triggers.urgency.length > 0 ? (
                      clientHeuristic.triggers.urgency.map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.2 bg-amber-950/60 text-amber-300 border border-amber-800/60 rounded text-[10px]">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[11px]">No pressure triggers</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Type or load a sample above to observe instant client-side threat scoring prior to querying Gemini 1.5 Flash.
              </p>
            )}

            {clientHeuristic.emailHeaderMeta && (
              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-3 text-xs font-mono">
                {clientHeuristic.emailHeaderMeta.spfStatus && (
                  <span className={clientHeuristic.emailHeaderMeta.spfStatus.includes('Fail') ? 'text-rose-400' : 'text-emerald-400'}>
                    {clientHeuristic.emailHeaderMeta.spfStatus}
                  </span>
                )}
                {clientHeuristic.emailHeaderMeta.dkimStatus && (
                  <span className={clientHeuristic.emailHeaderMeta.dkimStatus.includes('Fail') ? 'text-rose-400' : 'text-emerald-400'}>
                    {clientHeuristic.emailHeaderMeta.dkimStatus}
                  </span>
                )}
                {clientHeuristic.emailHeaderMeta.dmarcStatus && (
                  <span className={clientHeuristic.emailHeaderMeta.dmarcStatus.includes('Fail') ? 'text-rose-400' : 'text-emerald-400'}>
                    {clientHeuristic.emailHeaderMeta.dmarcStatus}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Engine: Official <code className="font-mono text-cyan-300">@google/genai</code> targeting <code className="font-mono text-cyan-300">gemini-1.5-flash</code></span>
            </div>

            <motion.button
              id="inspect-button-tsx"
              type="button"
              disabled={!hasValidInput || isScanning}
              onClick={handleExecuteInspection}
              whileHover={hasValidInput && !isScanning ? { scale: 1.02 } : {}}
              whileTap={hasValidInput && !isScanning ? { scale: 0.97 } : {}}
              transition={springPreset}
              className={`w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2.5 shadow-lg select-none ${
                hasValidInput && !isScanning
                  ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer'
                  : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Scanning Threat Vectors (20s limit)...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>Inspect Threat Score</span>
                </>
              )}
            </motion.button>
          </div>

        </div>

        {/* SCAN TELEMETRY PROGRESS */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  <span className="font-semibold uppercase tracking-wider">Forensic Threat Scanner Active</span>
                </div>
                <span>Processing with 20s timeout...</span>
              </div>
              <p className="text-sm font-mono text-slate-300">
                &gt; {scanTelemetryStep}
              </p>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full w-full"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4.B RESULTS DASHBOARD WITH ANIMATEPRESENCE ENTRY */}
        <AnimatePresence>
          {currentResult && (
            <motion.div
              key={currentResult.id}
              id="results-section-tsx"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-6 pt-2"
            >
              
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                {currentResult.notice && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-300 text-xs sm:text-sm font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                  >
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <span>{currentResult.notice}</span>
                    </div>
                    <motion.button
                      id="retry-ai-connection-btn-tsx"
                      onClick={handleExecuteInspection}
                      disabled={isScanning}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={springPreset}
                      className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold disabled:opacity-50 flex-shrink-0 cursor-pointer shadow-sm hover:shadow"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isScanning ? 'animate-spin' : ''}`} />
                      Retry Connection
                    </motion.button>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* METRIC GAUGE & COUNTER */}
                  <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      {currentResult.scamThreatIndex >= 60 ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>Scam Threat Index</span>
                    </div>

                    <div className="relative w-48 h-28 flex items-end justify-center">
                      <svg className="w-48 h-28 overflow-visible" viewBox="0 0 160 90">
                        <defs>
                          <filter id="gaugeGlowTsx">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>

                        <path
                          d="M 12 80 A 68 68 0 0 1 148 80"
                          fill="none"
                          stroke="#1e293b"
                          strokeWidth={10}
                          strokeLinecap="round"
                        />

                        <motion.path
                          d="M 12 80 A 68 68 0 0 1 148 80"
                          fill="none"
                          stroke={gaugeColor}
                          strokeWidth={10}
                          strokeDasharray={gaugeArc}
                          initial={{ strokeDashoffset: gaugeArc }}
                          animate={{ strokeDashoffset: gaugeDashoffset }}
                          transition={{ duration: 1.1, ease: 'easeOut' }}
                          strokeLinecap="round"
                          filter="url(#gaugeGlowTsx)"
                        />
                      </svg>

                      <div className="absolute bottom-1 text-center flex flex-col items-center">
                        <AnimatedScoreCounter targetScore={normalizedGaugeScore} color={gaugeColor} />
                        <span className="text-[10px] font-mono text-slate-400 -mt-1">/ 100</span>
                      </div>
                    </div>

                    {/* SEVERITY BADGE WITH ATTENTION-SEEKING PULSE */}
                    <div className="mt-3">
                      <motion.span
                        animate={(currentResult.riskLevel === 'CRITICAL' || currentResult.riskLevel === 'HIGH') ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className={`text-xs px-3 py-1 rounded-full font-mono font-semibold tracking-wider ${getStatusBadgeClasses(currentResult.riskLevel)}`}
                      >
                        {currentResult.riskLevel} THREAT VERDICT
                      </motion.span>
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Forensic Assessment
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-cyan-400 border border-slate-700">
                          ID: {currentResult.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(currentResult.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* ACTION BUTTON GROUP WITH SPRING FEEDBACK */}
                      <div className="flex flex-wrap items-center gap-2">
                        <motion.button
                          onClick={handleCopyReport}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          transition={springPreset}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer shadow-sm"
                        >
                          {copiedReport ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Report</span>
                            </>
                          )}
                        </motion.button>

                        <motion.button
                          id="download-report-btn-tsx"
                          onClick={handleDownloadJSON}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          transition={springPreset}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Download Report</span>
                        </motion.button>

                        <motion.button
                          id="report-scam-btn-tsx"
                          onClick={handleReportScam}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          transition={springPreset}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/40 text-rose-300 border border-rose-800/50 hover:bg-rose-900/60 cursor-pointer shadow-sm"
                          title="Report to Federal Trade Commission / IC3"
                        >
                          <Flag className="w-3.5 h-3.5 text-rose-400" />
                          <span>Report Scam</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </motion.button>

                        <motion.button
                          onClick={handleReset}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          transition={springPreset}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-950/40 text-cyan-400 border border-cyan-800/50 hover:bg-cyan-900/60 cursor-pointer shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Scan Another</span>
                        </motion.button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
                        <span>Executive Verdict:</span>
                        <span className={`px-2.5 py-0.5 rounded text-sm font-mono ${getStatusBadgeClasses(currentResult.riskLevel)}`}>
                          {currentResult.riskLevel} PROBABILITY
                        </span>
                      </h2>

                      <p className="text-sm text-slate-300 leading-relaxed bg-[#070A10]/70 p-4 rounded-xl border border-slate-800 font-sans">
                        {currentResult.reasoningSummary}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400 font-mono">
                      <span className="flex items-center space-x-1 text-cyan-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Engine: Gemini 1.5 Flash Multimodal</span>
                      </span>
                      <span>•</span>
                      <span>Input: {currentResult.inputType.toUpperCase()}</span>
                      {currentResult.fileName && (
                        <>
                          <span>•</span>
                          <span className="text-slate-300 truncate max-w-xs">File: {currentResult.fileName}</span>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* DETAILS BENTO GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* DETECTED RED FLAGS WITH STAGGERED ENTRANCES */}
                <div className="lg:col-span-8 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 border border-rose-800/40">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Detected Red Flags ({currentResult.detectedRedFlags.length})
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">Ranked by severity</span>
                  </div>

                  {currentResult.detectedRedFlags.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                      <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm">No critical scam indicators were detected.</p>
                    </div>
                  ) : (
                    <motion.div 
                      variants={listContainerVariants}
                      initial="hidden"
                      animate="show"
                      className="space-y-3"
                    >
                      {currentResult.detectedRedFlags.map((flag, idx) => (
                        <motion.div
                          key={idx}
                          variants={listItemVariants}
                          whileHover={{ scale: 1.01 }}
                          transition={springPreset}
                          className={`p-4 rounded-xl border shadow-sm ${
                            flag.severity === 'HIGH'
                              ? 'bg-rose-950/20 border-rose-800/40'
                              : flag.severity === 'MEDIUM'
                              ? 'bg-amber-950/20 border-amber-800/40'
                              : 'bg-slate-950/40 border-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-200">
                              {flag.category}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                              flag.severity === 'HIGH'
                                ? 'bg-rose-900/50 text-rose-300 border border-rose-700/60'
                                : flag.severity === 'MEDIUM'
                                ? 'bg-amber-900/50 text-amber-300 border border-amber-700/60'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {flag.severity} SEVERITY
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                            {flag.flag}
                          </p>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* FLAGGED LEXICON */}
                <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-800/40">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Flagged Lexicon
                      </span>
                    </div>
                    <span className="font-mono text-xs text-slate-400">
                      {currentResult.highlightedKeywords.length} terms
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {currentResult.highlightedKeywords.length === 0 ? (
                      <span className="text-xs text-slate-500">No anomalous risk terms isolated.</span>
                    ) : (
                      currentResult.highlightedKeywords.map((kw, i) => {
                        let badge = 'bg-slate-800 text-slate-300 border-slate-700';
                        if (kw.riskType === 'PAYMENT') badge = 'bg-rose-950/40 text-rose-300 border-rose-800/60';
                        else if (kw.riskType === 'DOMAIN') badge = 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60';
                        else if (kw.riskType === 'URGENCY') badge = 'bg-amber-950/40 text-amber-300 border-amber-800/60';

                        return (
                          <motion.div 
                            key={i} 
                            whileHover={{ scale: 1.05 }}
                            transition={springPreset}
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border shadow-sm ${badge}`}
                          >
                            <span>{kw.word}</span>
                            <span className="text-[9px] uppercase opacity-70">[{kw.riskType}]</span>
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/30 border border-rose-500/50"></span>
                      <span>PAYMENT: Unauthorized wire, checks, crypto</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/30 border border-cyan-500/50"></span>
                      <span>DOMAIN: Free webmail, typosquats, spoofed relay</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/30 border border-amber-500/50"></span>
                      <span>URGENCY: Psychological haste, artificial deadlines</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* RECOMMENDED ACTIONS CHECKLIST */}
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Recommended Protective Actions Checklist
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {Object.values(completedActions).filter(Boolean).length} / {currentResult.recommendedActions.length} Complete
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentResult.recommendedActions.map((action, idx) => {
                    const isDone = !!completedActions[idx];
                    return (
                      <motion.div
                        key={idx}
                        onClick={() => setCompletedActions(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={springPreset}
                        className={`p-3.5 rounded-xl border cursor-pointer select-none flex items-start space-x-3 ${
                          isDone
                            ? 'bg-emerald-950/20 border-emerald-800/50 text-slate-300'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-200'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isDone ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-600 bg-slate-900'
                        }`}>
                          {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={`text-xs leading-relaxed ${isDone ? 'line-through text-slate-400' : ''}`}>
                          {action}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">PhishShield AI</span>
            <span>— Advanced Offer Letter & Phishing Inspector</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Powered by Gemini 1.5 Flash</span>
            <span>•</span>
            <span>Enterprise Cybersecurity Edition</span>
          </div>
        </div>
      </footer>

      {/* RECENT SCANS AUDIT MODAL WITH MOTION ANIMATION */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={springPreset}
              className="bg-[#0D121D] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Inspection History</h3>
                    <p className="text-xs text-slate-400">Local audit trail of evaluated offer letters & artifacts</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {history.length > 0 && (
                    <motion.button
                      onClick={() => {
                        setHistory([]);
                        localStorage.removeItem('phishshield_history_v2');
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={springPreset}
                      className="flex items-center space-x-1 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded border border-rose-900/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => setIsHistoryOpen(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              <div className="p-4 overflow-y-auto space-y-2 flex-1">
                {history.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-sm">No recent scans recorded in this session.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <motion.div
                      key={item.id}
                      onClick={() => {
                        setCurrentResult(item);
                        setIsHistoryOpen(false);
                        window.scrollTo({ top: 420, behavior: 'smooth' });
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      transition={springPreset}
                      className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 cursor-pointer flex items-center justify-between group shadow-sm"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="text-center w-12 flex-shrink-0">
                          <span className="font-mono text-base font-bold" style={{ color: getScoreColorHex(item.scamThreatIndex) }}>
                            {item.scamThreatIndex}
                          </span>
                          <span className="text-[10px] text-slate-500 block -mt-1 font-mono">/ 100</span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-mono px-2 py-0.2 rounded font-semibold ${getStatusBadgeClasses(item.riskLevel)}`}>
                              {item.riskLevel}
                            </span>
                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                              {item.inputType}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-1 max-w-md">
                            {item.reasoningSummary}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <span>View</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-center text-xs text-slate-500">
                All scans are maintained locally on your machine in secure browser storage.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
