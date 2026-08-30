package com.loanguard.backend.model;

import java.util.List;

public class LoanRiskAssessment {

    private Long loanId;
    private String loanNumber;

    private int riskScore;
    private String riskLevel;

    private String recommendation;
    private int confidence;

    private boolean validationPassed;
    private int validationErrorCount;

    private List<RiskFactor> factors;

    public LoanRiskAssessment() {
    }

    public LoanRiskAssessment(
            Long loanId,
            String loanNumber,
            int riskScore,
            String riskLevel,
            String recommendation,
            int confidence,
            boolean validationPassed,
            int validationErrorCount,
            List<RiskFactor> factors) {

        this.loanId = loanId;
        this.loanNumber = loanNumber;
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.recommendation = recommendation;
        this.confidence = confidence;
        this.validationPassed = validationPassed;
        this.validationErrorCount = validationErrorCount;
        this.factors = factors;
    }

    public Long getLoanId() {
        return loanId;
    }

    public void setLoanId(Long loanId) {
        this.loanId = loanId;
    }

    public String getLoanNumber() {
        return loanNumber;
    }

    public void setLoanNumber(String loanNumber) {
        this.loanNumber = loanNumber;
    }

    public int getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(int riskScore) {
        this.riskScore = riskScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public int getConfidence() {
        return confidence;
    }

    public void setConfidence(int confidence) {
        this.confidence = confidence;
    }

    public boolean isValidationPassed() {
        return validationPassed;
    }

    public void setValidationPassed(boolean validationPassed) {
        this.validationPassed = validationPassed;
    }

    public int getValidationErrorCount() {
        return validationErrorCount;
    }

    public void setValidationErrorCount(int validationErrorCount) {
        this.validationErrorCount = validationErrorCount;
    }

    public List<RiskFactor> getFactors() {
        return factors;
    }

    public void setFactors(List<RiskFactor> factors) {
        this.factors = factors;
    }

    // =========================================================
    // RISK FACTOR
    // =========================================================

    public static class RiskFactor {

        private String factor;
        private String severity;
        private String impact;
        private String description;

        public RiskFactor() {
        }

        public RiskFactor(
                String factor,
                String severity,
                String impact,
                String description) {

            this.factor = factor;
            this.severity = severity;
            this.impact = impact;
            this.description = description;
        }

        public String getFactor() {
            return factor;
        }

        public void setFactor(String factor) {
            this.factor = factor;
        }

        public String getSeverity() {
            return severity;
        }

        public void setSeverity(String severity) {
            this.severity = severity;
        }

        public String getImpact() {
            return impact;
        }

        public void setImpact(String impact) {
            this.impact = impact;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }
}