package com.loanguard.backend.service;

import com.loanguard.backend.model.AIReviewResponse;
import com.loanguard.backend.model.Loan;
import com.loanguard.backend.service.LoanValidationService.ValidationIssue;
import com.loanguard.backend.service.LoanValidationService.ValidationResult;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AIReviewService {

    private final LoanValidationService validationService;
    private final LoanRiskService loanRiskService;

    public AIReviewService(
            LoanValidationService validationService,
            LoanRiskService loanRiskService) {

        this.validationService = validationService;
        this.loanRiskService = loanRiskService;
    }

    public AIReviewResponse reviewLoan(Loan loan) {

        ValidationResult validation =
                validationService.validate(loan);

        var risk =
                loanRiskService.assessRisk(loan);

        List<String> corrections =
                new ArrayList<>();

        String severity = "LOW";

        StringBuilder explanation =
                new StringBuilder();

        // =====================================================
        // VALIDATION ANALYSIS
        // =====================================================

        if (!validation.isValid()) {

            for (ValidationIssue issue :
                    validation.getIssues()) {

                corrections.add(
                        buildCorrection(issue)
                );

                explanation
                        .append(issue.getMessage())
                        .append(" ");

                if ("CRITICAL".equalsIgnoreCase(
                        issue.getSeverity())) {

                    severity = "CRITICAL";

                } else if (
                        "HIGH".equalsIgnoreCase(
                                issue.getSeverity())
                        && !"CRITICAL".equals(
                                severity)) {

                    severity = "HIGH";

                } else if (
                        "MEDIUM".equalsIgnoreCase(
                                issue.getSeverity())
                        && "LOW".equals(
                                severity)) {

                    severity = "MEDIUM";
                }
            }

        } else {

            explanation.append(
                    "The loan passed all configured "
                    + "validation rules. "
            );
        }

        // =====================================================
        // RISK ANALYSIS
        // =====================================================

        explanation
                .append("The calculated AI-assisted risk profile "
                        + "is ")
                .append(risk.getRiskLevel())
                .append(" with a risk score of ")
                .append(risk.getRiskScore())
                .append(" out of 100.");

        // =====================================================
        // RECOMMENDATION
        // =====================================================

        String recommendation;

        if (!validation.isValid()) {

            recommendation =
                    "HUMAN_REVIEW";

        } else if (
                "HIGH".equalsIgnoreCase(
                        risk.getRiskLevel())) {

            recommendation =
                    "HUMAN_REVIEW";

        } else if (
                "MEDIUM".equalsIgnoreCase(
                        risk.getRiskLevel())) {

            recommendation =
                    "ADDITIONAL_VERIFICATION";

        } else {

            recommendation =
                    "APPROVE";
        }

        // =====================================================
        // REVIEWER NOTE
        // =====================================================

        String reviewerNote;

        if (!validation.isValid()) {

            reviewerNote =
                    "Validation identified "
                    + validation.getErrorCount()
                    + " issue(s). Review and correct "
                    + "the flagged fields before approval.";

        } else {

            reviewerNote =
                    "Loan passed validation. "
                    + "Review the risk factors and "
                    + "confirm the final decision.";
        }

        // =====================================================
        // SUMMARY
        // =====================================================

        String summary;

        if (!validation.isValid()) {

            summary =
                    "Loan requires human review because "
                    + validation.getErrorCount()
                    + " validation issue(s) were detected.";

        } else {

            summary =
                    "Loan passed validation and received a "
                    + risk.getRiskLevel()
                    + " risk classification.";
        }

        return new AIReviewResponse(
                loan.getId(),
                loan.getLoanNumber(),
                summary,
                severity,
                explanation.toString().trim(),
                corrections,
                reviewerNote,
                recommendation,
                "LoanGuard-Rules-v1",
                LocalDateTime.now().toString()
        );
    }

    // =========================================================
    // CORRECTION GENERATOR
    // =========================================================

    private String buildCorrection(
            ValidationIssue issue) {

        if (issue.getExpectedValue() == null) {

            return "Review the "
                    + issue.getField()
                    + " field.";
        }

        return "Correct "
                + issue.getField()
                + " to satisfy the expected value: "
                + issue.getExpectedValue()
                + ".";
    }
}