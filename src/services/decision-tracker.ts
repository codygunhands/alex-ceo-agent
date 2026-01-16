/**
 * Decision Tracker Service
 * Tracks all decisions made by the board with confidence scores and risk assessment
 */

export interface Decision {
  id: string;
  timestamp: Date;
  member: string;
  type: 'approval' | 'rejection' | 'deferral' | 'proposal' | 'resource_allocation';
  description: string;
  confidence: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  consultedMembers: string[];
  budgetImpact?: number;
  rationale: string;
  outcome?: 'success' | 'failure' | 'pending';
  reviewedByHuman?: boolean;
}

export class DecisionTracker {
  private decisions: Decision[] = [];

  recordDecision(decision: Omit<Decision, 'id' | 'timestamp'>): Decision {
    const fullDecision: Decision = {
      ...decision,
      id: `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.decisions.push(fullDecision);
    return fullDecision;
  }

  getDecisionsSince(date: Date): Decision[] {
    return this.decisions.filter(d => d.timestamp >= date);
  }

  getHighRiskDecisions(): Decision[] {
    return this.decisions.filter(d => d.riskLevel === 'high' && !d.reviewedByHuman);
  }

  getDecisionsRequiringReview(): Decision[] {
    return this.decisions.filter(d => 
      d.riskLevel === 'high' || 
      d.confidence < 70 ||
      (d.budgetImpact && d.budgetImpact > 100)
    );
  }

  calculateConfidenceScore(
    dataQuality: number,
    consultationCount: number,
    precedentExists: boolean,
    riskLevel: 'low' | 'medium' | 'high'
  ): number {
    let confidence = 50; // Base confidence

    // Data quality impact
    confidence += (dataQuality / 100) * 20;

    // Consultation impact
    confidence += Math.min(consultationCount * 5, 15);

    // Precedent impact
    if (precedentExists) confidence += 10;

    // Risk penalty
    if (riskLevel === 'high') confidence -= 15;
    if (riskLevel === 'medium') confidence -= 5;

    return Math.max(0, Math.min(100, Math.round(confidence)));
  }

  assessRisk(
    budgetImpact: number,
    strategicImpact: 'low' | 'medium' | 'high',
    reversibility: boolean,
    consultationCount: number
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Budget impact
    if (budgetImpact > 200) riskScore += 3;
    else if (budgetImpact > 100) riskScore += 2;
    else if (budgetImpact > 50) riskScore += 1;

    // Strategic impact
    if (strategicImpact === 'high') riskScore += 3;
    else if (strategicImpact === 'medium') riskScore += 2;
    else riskScore += 1;

    // Reversibility
    if (!reversibility) riskScore += 2;

    // Consultation (reduces risk)
    riskScore -= Math.min(consultationCount, 2);

    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  generateSummary(hours: number = 24): {
    totalDecisions: number;
    approvals: number;
    rejections: number;
    highRisk: number;
    requiresReview: number;
    totalSpending: number;
    averageConfidence: number;
  } {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recent = this.getDecisionsSince(since);

    return {
      totalDecisions: recent.length,
      approvals: recent.filter(d => d.type === 'approval').length,
      rejections: recent.filter(d => d.type === 'rejection').length,
      highRisk: recent.filter(d => d.riskLevel === 'high').length,
      requiresReview: this.getDecisionsRequiringReview().length,
      totalSpending: recent.reduce((sum, d) => sum + (d.budgetImpact || 0), 0),
      averageConfidence: recent.length > 0
        ? Math.round(recent.reduce((sum, d) => sum + d.confidence, 0) / recent.length)
        : 0
    };
  }
}

