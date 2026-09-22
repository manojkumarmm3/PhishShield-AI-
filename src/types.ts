export type InputTabType = 'text' | 'url' | 'file' | 'header';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';
export type RiskKeywordType = 'PAYMENT' | 'DOMAIN' | 'URGENCY';

export interface RedFlag {
  category: string;
  flag: string;
  severity: Severity;
}

export interface HighlightedKeyword {
  word: string;
  riskType: RiskKeywordType;
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
  notice?: string;
  fileName?: string;
}

export interface ClientHeuristicAnalysis {
  score: number;
  riskLevel: RiskLevel;
  triggers: {
    payment: string[];
    domain: string[];
    urgency: string[];
  };
  hasHighFinancialRisk: boolean;
  hasSuspiciousDomain: boolean;
  hasTacticalUrgency: boolean;
  detectedDomains: string[];
  emailHeaderMeta?: {
    spfStatus?: string;
    dkimStatus?: string;
    dmarcStatus?: string;
    returnPath?: string;
    sender?: string;
    replyTo?: string;
  };
}

export interface PresetSample {
  id: string;
  title: string;
  type: InputTabType;
  description: string;
  badge: string;
  content: string;
}
