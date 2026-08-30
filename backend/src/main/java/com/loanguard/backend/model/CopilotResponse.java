package com.loanguard.backend.model;

import java.util.List;

public class CopilotResponse {

    private Long loanId;
    private String loanNumber;

    private String intent;
    private String answer;
    private String recommendation;
    private String severity;

    private Integer riskScore;
    private String riskLevel;

    private boolean validationPassed;
    private int validationErrorCount;

    private List<String> sources;

    public CopilotResponse() {
    }

    public CopilotResponse(
            Long loanId,
            String loanNumber,
            String intent,
            String answer,
            String recommendation,
            String severity,
            Integer riskScore,
            String riskLevel,
            boolean validationPassed,
            int validationErrorCount,
            List<String> sources) {

        this.loanId = loanId;
        this.loanNumber = loanNumber;
        this.intent = intent;
        this.answer = answer;
        this.recommendation = recommendation;
        this.severity = severity;
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.validationPassed = validationPassed;
        this.validationErrorCount = validationErrorCount;
        this.sources = sources;
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

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
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

    public void setValidationErrorCount(
            int validationErrorCount) {

        this.validationErrorCount =
                validationErrorCount;
    }

    public List<String> getSources() {
        return sources;
    }

    public void setSources(
            List<String> sources) {

        this.sources = sources;
    }
}
