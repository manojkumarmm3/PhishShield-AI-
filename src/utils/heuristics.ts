import { ClientHeuristicAnalysis, RiskLevel } from '../types';

export const FINANCIAL_TRIGGERS = [
  'equipment fee',
  'wire transfer',
  'gift card',
  'check cashing',
  'holding deposit',
  'crypto',
  'cashier\'s check',
  'reimbursement check',
  'courier fee',
  'western union',
  'moneygram',
  'zelle',
  'venmo',
  'pay today',
  'certified check',
  'security deposit',
  'advance payment',
  'home office supply vendor',
  'bitcoin',
  'usdt'
];

export const SUSPICIOUS_DOMAIN_TRIGGERS = [
  '@gmail.com',
  '@yahoo.com',
  '@hotmail.com',
  '@outlook.com',
  '@aol.com',
  '@protonmail.com',
  '@zoho.com',
  '@icloud.com',
  't.me/',
  'telegram',
  'whatsapp',
  'signal app'
];

export const TACTICAL_URGENCY_TRIGGERS = [
  'urgently',
  'immediate start',
  'within 24 hours',
  'pay today',
  'offer expires immediately',
  'act fast',
  'limited slot',
  'as soon as possible',
  'confidential agreement',
  'within 48 hours',
  'sign immediately',
  'do not disclose to third parties'
];

export function parseEmailHeaders(headerText: string) {
  const lines = headerText.split(/\r?\n/);
  let spfStatus = 'Not found';
  let dkimStatus = 'Not found';
  let dmarcStatus = 'Not found';
  let returnPath = '';
  let sender = '';
  let replyTo = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^Received-SPF:/i.test(line)) {
      if (/pass/i.test(line)) spfStatus = 'Pass';
      else if (/fail|softfail/i.test(line)) spfStatus = 'Fail (High Risk)';
      else if (/neutral|none/i.test(line)) spfStatus = 'Neutral / None';
    }

    if (/^Authentication-Results:/i.test(line)) {
      if (/dkim=pass/i.test(line)) dkimStatus = 'Pass';
      else if (/dkim=fail/i.test(line)) dkimStatus = 'Fail (High Risk)';

      if (/dmarc=pass/i.test(line)) dmarcStatus = 'Pass';
      else if (/dmarc=fail/i.test(line)) dmarcStatus = 'Fail (High Risk)';
    }

    if (/^Return-Path:\s*<?([^>]+)>?/i.test(line)) {
      const match = line.match(/^Return-Path:\s*<?([^>\r\n]+)>?/i);
      if (match) returnPath = match[1].trim();
    }

    if (/^From:\s*(.+)$/i.test(line)) {
      sender = line.replace(/^From:\s*/i, '').trim();
    }

    if (/^Reply-To:\s*(.+)$/i.test(line)) {
      replyTo = line.replace(/^Reply-To:\s*/i, '').trim();
    }
  }

  return {
    spfStatus,
    dkimStatus,
    dmarcStatus,
    returnPath,
    sender,
    replyTo,
  };
}

export function runClientHeuristics(content: string, inputType: string): ClientHeuristicAnalysis {
  if (!content || !content.trim()) {
    return {
      score: 0,
      riskLevel: 'LOW',
      triggers: { payment: [], domain: [], urgency: [] },
      hasHighFinancialRisk: false,
      hasSuspiciousDomain: false,
      hasTacticalUrgency: false,
      detectedDomains: [],
    };
  }

  const lower = content.toLowerCase();

  const foundPayment = FINANCIAL_TRIGGERS.filter(trigger => lower.includes(trigger.toLowerCase()));
  const foundDomain = SUSPICIOUS_DOMAIN_TRIGGERS.filter(trigger => lower.includes(trigger.toLowerCase()));
  const foundUrgency = TACTICAL_URGENCY_TRIGGERS.filter(trigger => lower.includes(trigger.toLowerCase()));

  // Extract explicit emails or URLs
  const emailMatches = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const detectedDomains = Array.from(new Set(emailMatches.map(e => e.split('@')[1])));

  let score = 5; // baseline

  if (foundPayment.length > 0) {
    score += 35 + Math.min((foundPayment.length - 1) * 8, 25);
  }

  if (foundDomain.length > 0) {
    score += 20 + Math.min((foundDomain.length - 1) * 6, 18);
  }

  if (foundUrgency.length > 0) {
    score += 15 + Math.min((foundUrgency.length - 1) * 5, 15);
  }

  let emailHeaderMeta: ClientHeuristicAnalysis['emailHeaderMeta'];

  if (inputType === 'header') {
    emailHeaderMeta = parseEmailHeaders(content);
    if (emailHeaderMeta.spfStatus?.includes('Fail')) score += 25;
    if (emailHeaderMeta.dkimStatus?.includes('Fail')) score += 20;
    if (emailHeaderMeta.dmarcStatus?.includes('Fail')) score += 25;
    if (emailHeaderMeta.returnPath && emailHeaderMeta.sender) {
      const returnDomain = emailHeaderMeta.returnPath.split('@')[1];
      const senderDomain = emailHeaderMeta.sender.split('@')[1]?.replace(/>/, '');
      if (returnDomain && senderDomain && !senderDomain.includes(returnDomain)) {
        score += 20;
      }
    }
  }

  if (inputType === 'url') {
    const suspiciousTlds = ['.xyz', '.top', '.work', '.click', '.buzz', '.monster', '.icu', '.tk', '.gq'];
    if (suspiciousTlds.some(tld => lower.includes(tld))) {
      score += 25;
    }
    if (lower.includes('bit.ly') || lower.includes('tinyurl') || lower.includes('t.co')) {
      score += 20;
    }
    if (/([a-z0-9]+)-(careers|recruitment|jobs|hr|portal)/.test(lower)) {
      score += 22; // classic typosquatting pattern
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
      payment: foundPayment,
      domain: foundDomain,
      urgency: foundUrgency,
    },
    hasHighFinancialRisk: foundPayment.length > 0,
    hasSuspiciousDomain: foundDomain.length > 0,
    hasTacticalUrgency: foundUrgency.length > 0,
    detectedDomains,
    emailHeaderMeta,
  };
}

export function getRiskBadgeClasses(level: RiskLevel): string {
  switch (level) {
    case 'LOW':
      return 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50';
    case 'MEDIUM':
      return 'bg-amber-950/40 text-amber-400 border border-amber-800/50';
    case 'HIGH':
      return 'bg-orange-950/40 text-orange-400 border border-orange-800/50';
    case 'CRITICAL':
      return 'bg-rose-950/40 text-rose-400 border border-rose-800/50';
    default:
      return 'bg-slate-800 text-slate-300 border border-slate-700';
  }
}

export function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-rose-400';
  if (score >= 60) return 'text-orange-400';
  if (score >= 30) return 'text-amber-400';
  return 'text-emerald-400';
}

export function getRiskColorHex(level: RiskLevel): string {
  switch (level) {
    case 'LOW': return '#34d399';
    case 'MEDIUM': return '#fbbf24';
    case 'HIGH': return '#fb923c';
    case 'CRITICAL': return '#f43f5e';
    default: return '#94a3b8';
  }
}
