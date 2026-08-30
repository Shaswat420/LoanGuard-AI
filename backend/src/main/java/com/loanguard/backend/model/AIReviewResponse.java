package com.loanguard.backend.model;

import java.util.List;

public class AIReviewResponse {

    private Long loanId;
    private String loanNumber;

    private String summary;
    private String severity;
    private String explanation;

    private List<String> suggestedCorrections;

    private String reviewerNote;
    private String recommendation;

    private String model;
    private String generatedAt;

    public AIReviewResponse() {
    }

    public AIReviewResponse(
            Long loanId,
            String loanNumber,
            String summary,
            String severity,
            String explanation,
            List<String> suggestedCorrections,
            String reviewerNote,
            String recommendation,
            String model,
            String generatedAt) {

        this.loanId = loanId;
        this.loanNumber = loanNumber;
        this.summary = summary;
        this.severity = severity;
        this.explanation = explanation;
        this.suggestedCorrections = suggestedCorrections;
        this.reviewerNote = reviewerNote;
        this.recommendation = recommendation;
        this.model = model;
        this.generatedAt = generatedAt;
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

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public List<String> getSuggestedCorrections() {
        return suggestedCorrections;
    }

    public void setSuggestedCorrections(
            List<String> suggestedCorrections) {
        this.suggestedCorrections =
                suggestedCorrections;
    }

    public String getReviewerNote() {
        return reviewerNote;
    }

    public void setReviewerNote(String reviewerNote) {
        this.reviewerNote = reviewerNote;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(String generatedAt) {
        this.generatedAt = generatedAt;
    }
}