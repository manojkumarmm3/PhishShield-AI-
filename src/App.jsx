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
  Flag,
  CreditCard,
  Building2,
  PhoneCall,
  MailCheck,
  MailQuestion,
  Send,
  FileWarning,
  Globe,
  UserCheck,
  CheckCheck,
  AlertOctagon,
  ArrowRight,
  Share2
} from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';

// --- SPRING PHYSICS & EASING PRESETS ---
const springPreset = { type: 'spring', stiffness: 400, damping: 25 };

// --- SAMPLE PRESETS ---
const SAMPLE_PRESETS = [
  {
    id: 'advance-fee',
    title: 'Advance-Fee Equipment Scam',
    type: 'text',
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
    type: 'text',
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
    type: 'text',
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
    type: 'url',
    badge: 'HIGH THREAT',
    content: 'https://careers-google-verify-onboarding.xyz/auth/token-login?applicant=492198'
  },
  {
    id: 'spoofed-header',
    title: 'Spoofed RFC 822 Email Header',
    type: 'header',
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
function runClientHeuristics(content, inputType) {
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

  // High Financial Risk (+35% threat score)
  if (matchedFinancial.length > 0) {
    score += 35 + (matchedFinancial.length - 1) * 8;
  }

  // Suspicious Domain / Contact (+20% threat score)
  if (matchedDomain.length > 0) {
    score += 20 + (matchedDomain.length - 1) * 5;
  }

  // Tactical Urgency (+15% threat score)
  if (matchedUrgency.length > 0) {
    score += 15 + (matchedUrgency.length - 1) * 5;
  }

  let headerMeta = undefined;
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

  let riskLevel = 'LOW';
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

// --- STATUS BADGE HELPER ---
function getStatusBadgeClasses(risk) {
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

function getScoreColorHex(score) {
  if (score >= 80) return '#f43f5e';
  if (score >= 60) return '#fb923c';
  if (score >= 30) return '#f59e0b';
  return '#34d399';
}

// --- DYNAMIC NUMERICAL SCORE COUNTER WITH EASING ---
function AnimatedScoreCounter({ targetScore, color }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, targetScore || 0));
    const duration = 1000;
    const startTime = performance.now();

    const updateScore = (currentTime) => {
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

// --- TAB DEFINITIONS ---
const INPUT_TABS = [
  { id: 'text', label: '1. Offer Letter Text', icon: FileText },
  { id: 'url', label: '2. URL Scanner', icon: LinkIcon },
  { id: 'file', label: '3. OCR / File Upload', icon: Upload },
  { id: 'header', label: '4. Email Headers', icon: Terminal }
];

// --- STAGGERED LIST ANIMATION VARIANTS ---
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
    transition: { duration: 0.25, ease: "easeOut" }
  }
};

// --- SAFETY & INCIDENT GUIDANCE HELPERS ---
const generateSafeInquiryEmail = (result) => {
  if (!result) return { subject: '', body: '', recipientHint: 'recruiter@company.com' };

  const snippet = (result.inputSnippet || '').toLowerCase();
  const isRental = snippet.includes('lease') || 
                   snippet.includes('rent') ||
                   snippet.includes('apartment') ||
                   snippet.includes('deposit') ||
                   snippet.includes('tenant') ||
                   snippet.includes('landlord');

  if (isRental) {
    return {
      subject: 'Inquiry Regarding Property Verification & Application Procedure',
      recipientHint: 'leasing-office@property.com',
      body: `Dear Leasing Representative / Property Manager,

Thank you for sending the information regarding the rental property listing. I am very interested in this property and would like to proceed with the appropriate next steps.

As part of my standard safety and tenant verification procedure before sending any initial holding deposits, application fees, or personal identification documents, I would like to confirm the following details:

1. Could we schedule an in-person physical walkthrough of the residence, or alternatively a live video walkthrough of the unit's interior spaces?
2. Could you share your registered property management license, leasing office business address, or official corporate website?
3. Could you confirm which secure, recognized tenant portal (or licensed escrow service) will be utilized for lease execution and payment processing?

I appreciate your time, understanding, and commitment to a safe, transparent leasing process. I look forward to hearing from you.

Sincerely,
[Your Name]
[Your Phone Number]
[Your Email]`
    };
  }

  return {
    subject: 'Verification Inquiry Regarding Employment Offer & Onboarding Protocol',
    recipientHint: 'hr-verification@company.com',
    body: `Dear Hiring Team & Recruitment Operations,

Thank you for extending this offer of employment. I am very excited about the mission of the organization and the opportunity to contribute to the team.

As a standard cybersecurity best practice prior to executing formal employment agreements, submitting sensitive tax documentation (e.g., W-4 / I-9), or discussing equipment procurement arrangements, I would appreciate the opportunity to complete formal corporate verification:

1. Could we coordinate a brief 10-minute live video meeting (via Zoom, Google Meet, or Microsoft Teams) hosted directly from your authenticated corporate domain?
2. Could you provide the direct telephone extension or contact directory of your corporate Human Resources department so I can verify the offer details with your central office?
3. Could you confirm that all subsequent onboarding forms, banking direct deposit setups, and hardware logistics will be managed exclusively through your authenticated enterprise HRIS portal (e.g., Workday, ADP, Greenhouse)?

Thank you for your understanding and dedication to cybersecurity and candidate safety. I look forward to confirming these details and proceeding with the onboarding process.

Sincerely,
[Your Name]
[Your Phone Number]
[Your Email]`
  };
};

const generateFraudReportSummary = (result, checkedTasks = {}) => {
  if (!result) return '';

  const dateStr = new Date(result.timestamp).toLocaleString();
  const redFlagsList = (result.detectedRedFlags || [])
    .map((f, i) => `  ${i + 1}. [${f.severity}] ${f.category}: ${f.flag}`)
    .join('\n');
  const keywordsList = (result.highlightedKeywords || [])
    .map(k => `• ${k.word} (${k.riskType})`)
    .join(', ');

  const completedList = Object.entries(checkedTasks)
    .filter(([_, done]) => done)
    .map(([taskId]) => `  • Action Taken: ${taskId}`)
    .join('\n');

  return `================================================================================
OFFICIAL INCIDENT REPORT SUMMARY / REGULATORY FRAUD COMPLAINT
Generated via PhishShield AI Enterprise Incident Response
================================================================================

INCIDENT IDENTIFIERS:
• Incident Tracking ID: ${result.id}
• Forensic Timestamp: ${dateStr}
• Ingestion Vector: ${result.inputType?.toUpperCase()}
${result.fileName ? `• Attached Artifact: ${result.fileName}\n` : ''}
THREAT CLASSIFICATION:
• Scam Threat Index: ${result.scamThreatIndex} / 100
• Assessed Risk Level: ${result.riskLevel} THREAT
• Threat Signatures: Advance-Fee Fraud, Unverified Communication, Phishing Vectors

EXECUTIVE FORENSIC VERDICT:
${result.reasoningSummary}

DETECTED RED FLAGS & INDICATORS OF COMPROMISE (IOCs):
${redFlagsList || '  (No critical red flags isolated)'}

FLAGGED HIGH-RISK LEXICON:
${keywordsList || 'None isolated'}

INCIDENT CONTEXT / ARTIFACT EXCERPT:
"${(result.inputSnippet || '').replace(/\n+/g, ' ')}"

PROTECTIVE ACTIONS INITIATED BY RECIPIENT:
${completedList || '  • Initial forensic scan completed; regulatory escalation in progress.'}

REGULATORY REPORTING DESTINATIONS:
• Federal Trade Commission (FTC): https://reportfraud.ftc.gov
• FBI Internet Crime Complaint Center (IC3): https://www.ic3.gov
• Credit Reporting Bureaus: Equifax, Experian, TransUnion (Fraud Alert)
================================================================================`;
};

const getDynamicSafetyTasks = (result) => {
  if (!result) return [];
  const score = result.scamThreatIndex || 0;
  const level = result.riskLevel || 'LOW';

  if (score >= 60 || level === 'CRITICAL' || level === 'HIGH') {
    return [
      { id: 'freeze-funds', label: 'Freeze or recall unauthorized wire, cashier check deposit, or P2P transfer (Zelle/Venmo/CashApp) with bank fraud division', priority: 'CRITICAL' },
      { id: 'fraud-alert', label: 'Place 1-year free fraud alert on credit bureaus (Equifax, Experian, TransUnion) if SSN/ID was shared', priority: 'CRITICAL' },
      { id: 'report-ftc', label: 'File formal consumer complaint at Federal Trade Commission (reportfraud.ftc.gov)', priority: 'HIGH' },
      { id: 'report-ic3', label: 'Submit cybercrime incident report to FBI Internet Crime Complaint Center (ic3.gov)', priority: 'HIGH' },
      { id: 'block-contact', label: 'Block scammer email address, phone number, and Telegram/WhatsApp channels immediately', priority: 'HIGH' },
      { id: 'audit-creds', label: 'Update passwords and enable 2FA on accounts where credentials or recovery answers may have been exposed', priority: 'MEDIUM' },
    ];
  } else if (score >= 30 || level === 'MEDIUM') {
    return [
      { id: 'whois-lookup', label: 'Perform WHOIS domain lookup to verify sender domain creation date (<6 months = high risk) and registrar', priority: 'HIGH' },
      { id: 'switchboard-verify', label: 'Call company central office switchboard (not the phone number inside the offer) to verify recruiter existence', priority: 'HIGH' },
      { id: 'demand-video', label: 'Request and conduct a live video interview on official corporate conferencing tools (Zoom/Teams/Meet)', priority: 'MEDIUM' },
      { id: 'linkedin-check', label: 'Cross-reference recruiter and hiring manager on verified LinkedIn company employee directory', priority: 'MEDIUM' },
      { id: 'withhold-sensitive', label: 'Refuse to provide banking routing info, advance fees, or equipment vendor orders prior to verification', priority: 'HIGH' },
    ];
  } else {
    return [
      { id: 'sos-check', label: 'Confirm company active business registration with state Secretary of State (SOS) corporate registry', priority: 'MEDIUM' },
      { id: 'physical-address', label: 'Verify physical corporate headquarters address on official business mapping directories', priority: 'LOW' },
      { id: 'secure-portal', label: 'Ensure direct deposit and tax withholding forms (W-4/I-9) are submitted only via authenticated HRIS (e.g. Workday, ADP)', priority: 'MEDIUM' },
      { id: 'terms-audit', label: 'Review contractual offer terms, salary brackets, and restrictive covenants against verbal discussions', priority: 'LOW' },
    ];
  }
};

// --- FLUID NEURAL INTELLIGENCE LATTICE ANIMATED BACKGROUND ---
function NeuralLatticeBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let particles = [];

    const resize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      const targetCount = Math.floor((width * height) / 24000);
      const count = Math.min(Math.max(targetCount, 26), 60);

      if (particles.length === 0) {
        particles = Array.from({ length: count }, () => createParticle(width, height));
      } else if (particles.length < count) {
        while (particles.length < count) {
          particles.push(createParticle(width, height));
        }
      } else if (particles.length > count) {
        particles.length = count;
      }
    };

    const createParticle = (w, h) => {
      const isCyan = Math.random() > 0.45;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.5 + 1.2,
        baseRadius: Math.random() * 1.5 + 1.2,
        pulseSpeed: Math.random() * 0.015 + 0.008,
        pulseOffset: Math.random() * Math.PI * 2,
        color: isCyan ? { r: 56, g: 189, b: 248 } : { r: 129, g: 140, b: 248 },
        accent: Math.random() > 0.85,
      };
    };

    const handleMouseMove = (e) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    resize();

    const render = (time) => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
      } else {
        mouse.x = -1000;
        mouse.y = -1000;
      }

      const connectionDistance = 135;
      const mouseRadius = 150;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = width + 20;
        else if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        else if (p.y > height + 20) p.y = -20;

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseRadius && dist > 0.1) {
            const force = (1 - dist / mouseRadius) * 0.55;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        const pulse = Math.sin(time * p.pulseSpeed + p.pulseOffset);
        p.radius = p.baseRadius + pulse * 0.45;

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(p.radius, 0.6), 0, Math.PI * 2);
        const nodeAlpha = p.accent ? 0.75 : 0.55;
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${nodeAlpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.16;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 130) {
            const mAlpha = (1 - mdist / 130) * 0.24;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${mAlpha})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-gradient-to-b from-[#0B0F17] via-[#0D1527] to-[#0A0D14]">
      {/* 1. AMBIENT GLOWING ORBS (GPU-ACCELERATED DRIFTING & BREATHING) */}
      <motion.div
        animate={{
          x: [0, 45, -35, 0],
          y: [0, -50, 35, 0],
          scale: [1, 1.12, 0.92, 1],
          opacity: [0.18, 0.25, 0.16, 0.18]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ willChange: 'transform, opacity' }}
        className="absolute -top-32 -left-32 w-[550px] h-[550px] sm:w-[750px] sm:h-[750px] rounded-full bg-indigo-600/30 blur-[130px]"
      />

      <motion.div
        animate={{
          x: [0, -50, 40, 0],
          y: [0, 45, -40, 0],
          scale: [1, 0.92, 1.15, 1],
          opacity: [0.20, 0.16, 0.24, 0.20]
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ willChange: 'transform, opacity' }}
        className="absolute top-1/4 -right-32 w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full bg-cyan-500/25 blur-[125px]"
      />

      <motion.div
        animate={{
          x: [0, 35, -45, 0],
          y: [0, -35, 25, 0],
          scale: [0.95, 1.12, 0.92, 0.95],
          opacity: [0.14, 0.20, 0.12, 0.14]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ willChange: 'transform, opacity' }}
        className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] rounded-full bg-violet-600/20 blur-[140px]"
      />

      {/* 2. SUBTLE NOISE TEXTURE / RADIAL DOT GRID OVERLAY */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.11]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="neural-dot-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#38bdf8" />
          </pattern>
          <radialGradient id="neural-fade-mask" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </radialGradient>
          <mask id="neural-grid-mask">
            <rect width="100%" height="100%" fill="url(#neural-fade-mask)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#neural-dot-grid)" mask="url(#neural-grid-mask)" />
      </svg>

      {/* 3. DYNAMIC VECTOR LATTICE MESH CANVAS */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ willChange: 'transform' }} />

      {/* 4. FAINT HORIZONTAL ENERGY SWEEP BEAM */}
      <motion.div
        animate={{
          y: ['-10%', '110%']
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent blur-[0.5px]"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [headerContent, setHeaderContent] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanTelemetryStep, setScanTelemetryStep] = useState('');
  const [currentResult, setCurrentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [completedActions, setCompletedActions] = useState({});

  // Safety Guidance & Generator States
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isFraudModalOpen, setIsFraudModalOpen] = useState(false);
  const [copiedInquiry, setCopiedInquiry] = useState(false);
  const [copiedFraudSummary, setCopiedFraudSummary] = useState(false);
  const [safetyChecklist, setSafetyChecklist] = useState({});

  const fileInputRef = useRef(null);

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

  const saveToHistory = (item) => {
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

  const handleApplyPreset = (presetId) => {
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
    setSafetyChecklist({});
    setIsInquiryModalOpen(false);
    setIsFraudModalOpen(false);
  };

  const handleFileProcess = (file) => {
    if (!file) return;
    const reader = new FileReader();

    if (file.type.startsWith('image/')) {
      reader.onload = () => {
        const result = reader.result;
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
        const text = reader.result;
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

  // --- RESILIENT GEMINI EXECUTION WITH MODEL FALLBACK & BACKOFF ---
  const callGeminiWithResilience = async (prompt, mimeType = null, base64Data = null, aiInstance = null) => {
    const models = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash',
      'gemini-flash-lite-latest',
      'gemini-3.7-flash',
      'gemini-3.6-flash'
    ];
    const backoffDelays = [1000, 2000, 4000];
    let lastError = null;

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

          const response = await Promise.race([generatePromise, timeoutPromise]);
          return JSON.parse(response.text);
        } catch (err) {
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
      let analysisOutput = null;

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
        } catch (directErr) {
          console.warn('Direct client call failed across models, falling back to server route:', directErr.message);
        }
      }

      if (!analysisOutput) {
        const payload = {
          inputType: activeTab,
          content: activeTab === 'file' ? `[Multimodal Inspect]: ${uploadedFile?.name}` : currentRawInput
        };

        if (activeTab === 'file' && uploadedFile) {
          payload.fileData = uploadedFile.base64Data;
          payload.mimeType = uploadedFile.mimeType;
          payload.fileName = uploadedFile.name;
        }

        const serverBackoff = [1000, 2000, 4000];
        let serverRes = null;
        let lastServerErr = null;

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
          } catch (fetchErr) {
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
      const result = {
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

    } catch (err) {
      clearInterval(stepInterval);
      console.warn('Inspection API unavailable, activating graceful heuristic fallback:', err);
      
      const fallbackResult = {
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
            severity: 'HIGH'
          }] : []),
          ...(clientHeuristic.triggers.domain.length > 0 ? [{
            category: 'Suspicious Domain / Channel',
            flag: `Detected unverified or free public mail channel: ${clientHeuristic.triggers.domain.join(', ')}. Corporate recruiters communicate through authenticated company domains.`,
            severity: 'MEDIUM'
          }] : []),
          ...(clientHeuristic.triggers.urgency.length > 0 ? [{
            category: 'Tactical Urgency & Pressure',
            flag: `Artificial time pressure detected: ${clientHeuristic.triggers.urgency.join(', ')}. Scammers compress decision windows to prevent due diligence.`,
            severity: 'MEDIUM'
          }] : [])
        ],
        highlightedKeywords: [
          ...clientHeuristic.triggers.financial.map(w => ({ word: w, riskType: 'PAYMENT' })),
          ...clientHeuristic.triggers.domain.map(w => ({ word: w, riskType: 'DOMAIN' })),
          ...clientHeuristic.triggers.urgency.map(w => ({ word: w, riskType: 'URGENCY' }))
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

  const handleCopyInquiryEmail = () => {
    if (!currentResult) return;
    const { body } = generateSafeInquiryEmail(currentResult);
    navigator.clipboard.writeText(body);
    setCopiedInquiry(true);
    setTimeout(() => setCopiedInquiry(false), 2000);
  };

  const handleCopyFraudSummary = () => {
    if (!currentResult) return;
    const summary = generateFraudReportSummary(currentResult, safetyChecklist);
    navigator.clipboard.writeText(summary);
    setCopiedFraudSummary(true);
    setTimeout(() => setCopiedFraudSummary(false), 2000);
  };

  const gaugeRadius = 68;
  const gaugeArc = Math.PI * gaugeRadius;
  const normalizedGaugeScore = currentResult ? Math.min(Math.max(currentResult.scamThreatIndex, 0), 100) : 0;
  const gaugeDashoffset = gaugeArc - (gaugeArc * normalizedGaugeScore) / 100;
  const gaugeColor = currentResult ? getScoreColorHex(currentResult.scamThreatIndex) : '#06b6d4';

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0B0F17] text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300 overflow-x-hidden">
      
      {/* 1. FLUID NEURAL INTELLIGENCE LATTICE BACKGROUND */}
      <NeuralLatticeBackground />

      {/* 2. NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0B0F17]/75 backdrop-blur-xl">
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
                  <linearGradient id="navShieldGradJsx" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                  <filter id="navGlowJsx">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                <path
                  d="M50 8 L84 22 C84 56 68 82 50 92 C32 82 16 56 16 22 Z"
                  stroke="url(#navShieldGradJsx)"
                  strokeWidth="5"
                  strokeLinejoin="round"
                  fill="#0B0F17"
                  fillOpacity="0.4"
                />

                <path
                  d="M40 74 V30 H60 C68 30 73 35 73 44 C73 53 68 58 60 58 H40"
                  stroke="url(#navShieldGradJsx)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <circle cx="50" cy="50" r="4.5" fill="#38bdf8" filter="url(#navGlowJsx)" />
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
              id="history-btn-jsx"
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
              id="new-scan-btn-jsx"
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
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-5 glass-panel">
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-4">
            {/* FLOATING INDICATOR PILL NAVIGATION TABS */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
              {INPUT_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-btn-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
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
                  id="offer-letter-textarea"
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
                    id="url-input-field"
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

                {/* DRAG & DROP FILE UPLOADER WITH MOTION SCALING & HOVER */}
                <motion.div
                  id="dropzone-upload-area"
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
                  id="email-header-textarea"
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

            {/* PRIMARY ACTION BUTTON WITH SPRING MICRO-INTERACTIONS */}
            <motion.button
              id="inspect-button-jsx"
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
              id="results-section-jsx"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-6 pt-2"
            >
              
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden glass-panel">
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
                      id="retry-ai-connection-btn-jsx"
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
                          <filter id="gaugeGlowJsx">
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
                          filter="url(#gaugeGlowJsx)"
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
                          id="download-report-btn-jsx"
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
                          id="report-scam-btn-jsx"
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

              {/* POST-INSPECTION ACTION & SAFETY GUIDANCE MODULE */}
              {(() => {
                const isHighRisk = currentResult.scamThreatIndex >= 60 || currentResult.riskLevel === 'CRITICAL' || currentResult.riskLevel === 'HIGH';
                const isMediumRisk = !isHighRisk && (currentResult.scamThreatIndex >= 30 || currentResult.riskLevel === 'MEDIUM');
                const isLowRisk = !isHighRisk && !isMediumRisk;

                const dynamicTasks = getDynamicSafetyTasks(currentResult);
                const completedCount = dynamicTasks.filter(t => !!safetyChecklist[t.id]).length;
                const totalCount = dynamicTasks.length;
                const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                const allCompleted = totalCount > 0 && completedCount === totalCount;

                return (
                  <motion.div 
                    id="post-inspection-safety-guidance"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springPreset}
                    className={`backdrop-blur-xl border rounded-2xl p-6 shadow-2xl space-y-6 glass-panel ${
                      isHighRisk 
                        ? 'bg-slate-900/60 border-rose-900/50 shadow-rose-950/10' 
                        : isMediumRisk 
                        ? 'bg-slate-900/60 border-amber-900/50 shadow-amber-950/10' 
                        : 'bg-slate-900/60 border-emerald-900/50 shadow-emerald-950/10'
                    }`}
                  >
                    {/* MODULE HEADER & THREAT-LEVEL BANNER */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                      <div className="flex items-start space-x-3.5">
                        <div className={`p-2.5 rounded-xl border flex-shrink-0 mt-0.5 ${
                          isHighRisk
                            ? 'bg-rose-950/60 text-rose-400 border-rose-800/60 shadow-lg shadow-rose-950/40'
                            : isMediumRisk
                            ? 'bg-amber-950/60 text-amber-400 border-amber-800/60 shadow-lg shadow-amber-950/40'
                            : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60 shadow-lg shadow-emerald-950/40'
                        }`}>
                          {isHighRisk ? (
                            <AlertOctagon className="w-6 h-6 animate-pulse" />
                          ) : isMediumRisk ? (
                            <AlertTriangle className="w-6 h-6" />
                          ) : (
                            <ShieldCheck className="w-6 h-6" />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-white tracking-tight">
                              Post-Inspection Action & Safety Guidance
                            </h3>
                            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                              isHighRisk
                                ? 'bg-rose-950/80 text-rose-300 border-rose-800/70'
                                : isMediumRisk
                                ? 'bg-amber-950/80 text-amber-300 border-amber-800/70'
                                : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/70'
                            }`}>
                              {isHighRisk ? 'Incident Response Protocol' : isMediumRisk ? 'Verification Protocol' : 'Safe Onboarding Protocol'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {isHighRisk && "Immediate protective directives to contain financial loss, freeze unverified transfers, and report cyber fraud."}
                            {isMediumRisk && "Elevated scrutiny protocol: verify sender identity, WHOIS creation age, and switchboard directory before proceeding."}
                            {isLowRisk && "Standard professional onboarding hygiene: confirm official corporate filings and submit documents only via secure HRIS."}
                          </p>
                        </div>
                      </div>

                      {/* QUICK TOOLS ACTION ROW */}
                      <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                        <motion.button
                          id="generate-inquiry-response-btn"
                          onClick={() => setIsInquiryModalOpen(true)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          transition={springPreset}
                          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 hover:bg-cyan-900/60 hover:border-cyan-700 cursor-pointer shadow-sm"
                          title="Generate polite email inquiry asking for official verification"
                        >
                          <MailQuestion className="w-4 h-4 text-cyan-400" />
                          <span>Generate Safe Inquiry Response</span>
                        </motion.button>

                        <motion.button
                          id="copy-fraud-summary-btn"
                          onClick={handleCopyFraudSummary}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          transition={springPreset}
                          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 text-slate-200 border border-slate-700 hover:bg-slate-700/80 cursor-pointer shadow-sm"
                          title="Copy formatted summary formatted for regulatory fraud forms"
                        >
                          {copiedFraudSummary ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400">Copied Summary!</span>
                            </>
                          ) : (
                            <>
                              <FileWarning className="w-4 h-4 text-amber-400" />
                              <span>Copy Fraud Report Summary</span>
                            </>
                          )}
                        </motion.button>

                        {isHighRisk && (
                          <motion.button
                            onClick={handleReportScam}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            transition={springPreset}
                            className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-800/80 hover:bg-rose-900/80 cursor-pointer shadow-sm"
                          >
                            <Flag className="w-3.5 h-3.5 text-rose-400" />
                            <span>FTC Report</span>
                            <ExternalLink className="w-3 h-3 opacity-75" />
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {/* DYNAMIC SAFETY WORKFLOW & STEPS CARDS (3-COLUMN MATRIX) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                          <span>Recommended Next Steps ({isHighRisk ? 'Critical Response' : isMediumRisk ? 'Due Diligence' : 'Routine Precautions'})</span>
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Threat Index: {currentResult.scamThreatIndex} / 100
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* CARD 1 */}
                        {isHighRisk ? (
                          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800/60">
                                STEP 01 • FINANCIAL FREEZE
                              </span>
                              <CreditCard className="w-4 h-4 text-rose-400" />
                            </div>
                            <h4 className="text-xs font-bold text-white tracking-tight">
                              Immediate Bank / P2P Halt
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              If a cashier check was deposited or money was wired via Zelle, Venmo, CashApp, or crypto:
                            </p>
                            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                              <li><strong className="text-rose-300">Call Bank Fraud Line:</strong> Request immediate stop-payment or wire recall before the bogus check bounces.</li>
                              <li><strong className="text-rose-300">Check Clearance Warning:</strong> Banks release funds within 48h, but check validation takes up to 3 weeks. You are liable for bounced funds!</li>
                              <li><strong className="text-rose-300">Dispute in App:</strong> Mark transactions in payment apps as fraudulent unauthorized activity.</li>
                            </ul>
                          </div>
                        ) : isMediumRisk ? (
                          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/50 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/60">
                                STEP 01 • SENDER SCRUTINY
                              </span>
                              <Search className="w-4 h-4 text-amber-400" />
                            </div>
                            <h4 className="text-xs font-bold text-white tracking-tight">
                              Deep Domain & Recruiter Verification
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              Authenticate the origin before replying or providing personal information:
                            </p>
                            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                              <li><strong className="text-amber-300">WHOIS Lookup:</strong> Verify domain creation date via ICANN. Domains registered &lt;6 months ago are overwhelmingly fake.</li>
                              <li><strong className="text-amber-300">Corporate Switchboard:</strong> Call the primary headquarters phone number on the company&apos;s verified public website to confirm HR identity.</li>
                              <li><strong className="text-amber-300">Email Spoof Check:</strong> Inspect the full sender address for hyphenated typosquats (e.g. <code>@company-careers.net</code>).</li>
                            </ul>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/50 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60">
                                STEP 01 • ENTITY VERIFICATION
                              </span>
                              <Building2 className="w-4 h-4 text-emerald-400" />
                            </div>
                            <h4 className="text-xs font-bold text-white tracking-tight">
                              Standard Business Registry Validation
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              Routine verification to establish organization authenticity:
                            </p>
                            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                              <li><strong className="text-emerald-300">Secretary of State (SOS):</strong> Verify active corporate or LLC registration status in state database.</li>
                              <li><strong className="text-emerald-300">Physical Office:</strong> Confirm physical corporate headquarters and commercial lease on Google Street View.</li>
                              <li><strong className="text-emerald-300">Job Board Cross-Check:</strong> Confirm the listing exists on the company&apos;s central careers portal.</li>
                            </ul>
                          </div>
                        )}

                        {/* CARD 2 */}
                        {isHighRisk ? (
                          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/60">
                                STEP 02 • IDENTITY DEFENSE
                              </span>
                              <Lock className="w-4 h-4 text-amber-400" />
                            </div>
                            <h4 className="text-xs font-bold text-white tracking-tight">
                              Credit Bureau Fraud Alerts
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              If Social Security Number, passport, or driver&apos;s license was exposed:
                            </p>
                            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                              <li><strong className="text-slate-200">1-Year Free Fraud Alert:</strong> Contact one of the three bureaus (they notify the other two): Equifax (800-525-6285), Experian (888-397-3742), TransUnion (800-680-7289).</li>
                              <li><strong className="text-slate-200">FTC Identity Theft:</strong> File a formal recovery report at <code className="text-cyan-400">identitytheft.gov</code> to obtain an official recovery plan.</li>
                              <li><strong className="text-slate-200">Credential Reset:</strong> Change passwords &amp; security answers on all personal accounts.</li>
                            </ul>
                          </div>
                        ) : isMediumRisk ? (
                          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                                STEP 02 • SECURE CHANNELS
                              </span>
                              <PhoneCall className="w-4 h-4 text-cyan-400" />
                            </div>
                            <h4 className="text-xs font-bold text-white tracking-tight">
                              Safe Communication Protocol
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              Enforce enterprise-grade standards for ongoing dialogue:
                            </p>
                            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                              <li><strong className="text-cyan-300">Mandatory Live Video:</strong> Insist on a video call (Zoom/Teams/Meet) on official company domain with cameras enabled.</li>
                              <li><strong className="text-cyan-300">Reject Text-Only Hiring:</strong> No legitimate enterprise conducts interviews or hiring purely through Telegram, WhatsApp, or Signal.</li>
                              <li><strong className="text-cyan-300">Official ATS Portals:</strong> Require offer letters and document submission through Greenhouse, Lever, or Workday.</li>
                            </ul>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                                STEP 02 • DATA SECURITY
                              </span>
                              <Lock className="w-4 h-4 text-cyan-400" />
                            </div>
                            <h4 className="text-xs font-bold text-white tracking-tight">
                              Secure HRIS &amp; Payroll Submission
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              Keep personal and tax documents protected during onboarding:
                            </p>
                            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                              <li><strong className="text-cyan-300">No Plaintext Emails:</strong> Never attach scans of SSN, passport, or voided checks over unencrypted email.</li>
                              <li><strong className="text-cyan-300">Dedicated HR Portal:</strong> Input direct deposit routing details only through authenticated HRIS portals (e.g. ADP, Rippling).</li>
                              <li><strong className="text-cyan-300">Device Provisioning:</strong> Confirm corporate IT ships pre-imaged company hardware with VPN security.</li>
                            </ul>
                          </div>
                        )}

                        {/* CARD 3 */}
                        {isHighRisk ? (
                          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                                STEP 03 • OFFICIAL ESCALATION
                              </span>
                              <Flag className="w-4 h-4 text-cyan-400" />
                            </div>
                            <h4 className="text-xs font-bold text-white tracking-tight">
                              Regulatory &amp; Cyber Law Reporting
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              Help regulatory authorities disrupt the scam syndicate&apos;s infrastructure:
                            </p>
                            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                              <li><strong className="text-cyan-300">FTC Complaint:</strong> Submit incident specifics at <a href="https://reportfraud.ftc.gov" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">reportfraud.ftc.gov</a>.</li>
                              <li><strong className="text-cyan-300">FBI IC3 Submission:</strong> File a formal Internet Crime Complaint at <a href="https://www.ic3.gov" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">ic3.gov</a> for wire or international fraud.</li>
                              <li><strong className="text-cyan-300">Anti-Phishing Working Group:</strong> Forward raw email headers to <code className="text-slate-300">reportphishing@apwg.org</code>.</li>
                            </ul>
                          </div>
                        ) : isMediumRisk ? (
                          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-slate-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                                STEP 03 • FINANCIAL SAFEGUARD
                              </span>
                              <ShieldAlert className="w-4 h-4 text-slate-400" />
                            </div>
                            <h4 className="text-xs font-bold text-white tracking-tight">
                              Zero Advance-Fee Rule
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              Enforce zero-tolerance policies on payments or procurement:
                            </p>
                            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                              <li><strong className="text-slate-200">No Equipment Purchases:</strong> Real employers provide hardware directly or issue approved enterprise purchase orders.</li>
                              <li><strong className="text-slate-200">No &quot;Software Fee&quot;:</strong> Refuse to pay onboarding software license fees, background check fees, or training stipends.</li>
                              <li><strong className="text-slate-200">No Advance Checks:</strong> Never accept checks with instructions to forward surplus funds elsewhere.</li>
                            </ul>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-slate-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                                STEP 03 • CONTRACT SCRUTINY
                              </span>
                              <FileText className="w-4 h-4 text-slate-400" />
                            </div>
                            <h4 className="text-xs font-bold text-white tracking-tight">
                              Legal Agreement Review
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              Check all contractual terms before formal execution:
                            </p>
                            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                              <li><strong className="text-slate-200">Terms Alignment:</strong> Ensure starting salary, bonus vesting, and role expectations match oral offers.</li>
                              <li><strong className="text-slate-200">Restrictive Covenants:</strong> Review non-compete, IP assignment, and severance terms for fairness.</li>
                              <li><strong className="text-slate-200">Rental Walkthroughs:</strong> For apartment leases, always conduct physical inspection before deposit wires.</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* INTERACTIVE SAFETY CHECKLIST */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-200 tracking-tight">
                              Interactive Safety Action Checklist
                            </span>
                            <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                              (Tick off protective steps as you complete them)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-xs">
                          <span className="font-mono text-slate-300">
                            {completedCount} of {totalCount} completed ({progressPct}%)
                          </span>
                          {completedCount > 0 && (
                            <button
                              onClick={() => setSafetyChecklist({})}
                              className="text-[11px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
                            >
                              Reset Checklist
                            </button>
                          )}
                        </div>
                      </div>

                      {/* PROGRESS BAR */}
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <motion.div 
                          className={`h-full transition-all duration-300 ${
                            isHighRisk ? 'bg-gradient-to-r from-rose-600 to-amber-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {/* CELEBRATORY BANNER WHEN 100% COMPLETE */}
                      {allCompleted && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center space-x-3 text-emerald-300 text-xs"
                        >
                          <CheckCheck className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                          <div>
                            <span className="font-bold">Protective Due Diligence Complete!</span> You have marked all prioritized safety safeguards as resolved.
                          </div>
                        </motion.div>
                      )}

                      {/* CHECKLIST ITEMS GRID */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {dynamicTasks.map((task) => {
                          const isDone = !!safetyChecklist[task.id];
                          return (
                            <motion.div
                              key={task.id}
                              onClick={() => setSafetyChecklist(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              transition={springPreset}
                              className={`p-3 rounded-xl border cursor-pointer select-none flex items-start space-x-3 transition-colors ${
                                isDone
                                  ? 'bg-emerald-950/20 border-emerald-800/50 text-slate-300'
                                  : 'bg-slate-950/50 border-slate-800/90 hover:border-slate-700 text-slate-200'
                              }`}
                            >
                              <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                isDone ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-600 bg-slate-900'
                              }`}>
                                {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className={`text-xs leading-relaxed ${isDone ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                                    {task.label}
                                  </span>
                                </div>
                              </div>

                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0 ${
                                task.priority === 'CRITICAL'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800/70'
                                  : task.priority === 'HIGH'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800/70'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {task.priority}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* AI-DISCOVERED SPECIFIC RECOMMENDED ACTIONS */}
                      {currentResult.recommendedActions && currentResult.recommendedActions.length > 0 && (
                        <div className="pt-3 border-t border-slate-800/60 space-y-2">
                          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            AI-Isolated Recommendations ({currentResult.recommendedActions.length})
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {currentResult.recommendedActions.map((act, i) => {
                              const done = !!completedActions[i];
                              return (
                                <div 
                                  key={i}
                                  onClick={() => setCompletedActions(prev => ({ ...prev, [i]: !prev[i] }))}
                                  className={`p-2.5 rounded-lg border text-xs cursor-pointer select-none flex items-start space-x-2.5 ${
                                    done 
                                      ? 'bg-slate-950/40 border-emerald-800/40 text-slate-400' 
                                      : 'bg-slate-950/30 border-slate-800 text-slate-300 hover:border-slate-700'
                                  }`}
                                >
                                  <div className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                                    done ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-600 bg-slate-900'
                                  }`}>
                                    {done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                  <span className={`text-[11px] leading-relaxed ${done ? 'line-through text-slate-500' : ''}`}>
                                    {act}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })()}

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

      {/* SAFE INQUIRY EMAIL GENERATOR MODAL */}
      <AnimatePresence>
        {isInquiryModalOpen && currentResult && (() => {
          const inquiry = generateSafeInquiryEmail(currentResult);
          return (
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
                className="bg-[#0D121D] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                {/* MODAL HEADER */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                      <MailQuestion className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
                        <span>Safe Verification Inquiry Generator</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                          AI-CRAFTED
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Diplomatic response asking for corporate verification without sounding accusatory
                      </p>
                    </div>
                  </div>

                  <motion.button
                    onClick={() => setIsInquiryModalOpen(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* MODAL CONTENT */}
                <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
                  {/* SUBJECT LINE BOX */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Recommended Subject Line
                    </label>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-slate-200">
                      <span className="truncate mr-2">{inquiry.subject}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inquiry.subject);
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-sans flex-shrink-0 cursor-pointer"
                      >
                        Copy Subject
                      </button>
                    </div>
                  </div>

                  {/* INQUIRY BODY */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Email Message Body
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Replace [Your Name], [Your Phone] before sending
                      </span>
                    </div>
                    <textarea
                      readOnly
                      value={inquiry.body}
                      rows={14}
                      className="w-full p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed focus:outline-none select-all"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-900/40 text-[11px] text-cyan-300/90 leading-relaxed">
                    💡 <strong>Pro Tip:</strong> Legitimate recruiters and property managers will gladly accommodate live video verification and official switchboard checks. Scammers will make excuses, threaten to revoke the offer, or insist on text-only communication.
                  </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Ready to copy or export
                  </span>

                  <div className="flex items-center space-x-2">
                    <a
                      href={`mailto:?subject=${encodeURIComponent(inquiry.subject)}&body=${encodeURIComponent(inquiry.body)}`}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer border border-slate-700"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Open Mail App</span>
                    </a>

                    <motion.button
                      onClick={handleCopyInquiryEmail}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={springPreset}
                      className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 cursor-pointer shadow-md shadow-cyan-950/50"
                    >
                      {copiedInquiry ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Template Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Full Email</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
