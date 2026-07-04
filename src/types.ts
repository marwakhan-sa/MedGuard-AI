export interface Medication {
  name: string;
  rxcui: string;
}

export interface PairwiseInteraction {
  severity: string; // 'high' | 'moderate' | 'low'
  description: string;
  drugs: {
    rxcui: string;
    name: string;
  }[];
}

export interface AiRiskSummary {
  severity: "Low" | "Moderate" | "High";
  severityJustification: string;
  summary: string;
  questions: string[];
}

export interface AnalysisResult {
  id?: string;
  userId: string;
  createdAt: any; // Firestore Timestamp or ISO string
  medications: Medication[];
  interactions: PairwiseInteraction[];
  aiSummary: AiRiskSummary;
}

export type ActivePage = "landing" | "auth" | "dashboard" | "results" | "history";
