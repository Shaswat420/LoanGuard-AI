package com.loanguard.backend.service;

import com.loanguard.backend.model.Loan;
import com.loanguard.backend.model.LoanRiskAssessment;
import com.loanguard.backend.model.LoanRiskAssessment.RiskFactor;
import com.loanguard.backend.model.CopilotResponse;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class CopilotService {

    private final LoanValidationService validationService;
    private final LoanRiskService riskService;

    public CopilotService(
            LoanValidationService validationService,
            LoanRiskService riskService) {

        this.validationService = validationService;
        this.riskService = riskService;
    }

    public CopilotResponse answer(
            Loan loan,
            String question) {

        String normalizedQuestion =
                question == null
                        ? ""
                        : question.trim().toLowerCase();

        LoanValidationService.ValidationResult validation =
                validationService.validate(loan);

        LoanRiskAssessment risk =
                riskService.assessRisk(loan);

        if (containsAny(
                normalizedQuestion,
                "approve",
                "approval",
                "eligible",
                "can i approve")) {

            return approvalAnswer(
                    loan,
                    validation,
                    risk
            );
        }

        if (containsAny(
                normalizedQuestion,
                "risk",
                "risky",
                "risk score",
                "why risk")) {

            return riskAnswer(
                    loan,
                    validation,
                    risk
            );
        }

        if (containsAny(
                normalizedQuestion,
                "exception",
                "exceptions",
                "issue",
                "issues",
                "error",
                "errors",
                "problem")) {

            return exceptionAnswer(
                    loan,
                    validation,
                    risk
            );
        }

        if (containsAny(
                normalizedQuestion,
                "audit",
                "history",
                "what happened",
                "activity",
                "changes")) {

            return auditAnswer(
                    loan,
                    validation,
                    risk
            );
        }

        if (containsAny(
                normalizedQuestion,
                "summary",
                "summarize",
                "overview",
                "tell me about")) {

            return summaryAnswer(
                    loan,
                    validation,
                    risk
            );
        }

        return generalAnswer(
                loan,
                validation,
                risk
        );
    }

    // =========================================================
    // APPROVAL
    // =========================================================

    private CopilotResponse approvalAnswer(
            Loan loan,
            LoanValidationService.ValidationResult validation,
            LoanRiskAssessment risk) {

        List<String> sources = new ArrayList<>();

        sources.add("Loan record");
        sources.add("Validation engine");
        sources.add("Risk engine");

        if (!validation.isValid()) {

            StringBuilder answer =
                    new StringBuilder();

            answer.append(
                    "Approval is currently blocked. "
            );

            answer.append(
                    "The loan has "
            );

            answer.append(
                    validation.getErrorCount()
            );

            answer.append(
                    " unresolved validation issue(s). "
            );

            answer.append(
                    "These issues must be corrected "
                            + "and the loan must be revalidated "
                            + "before approval."
            );

            return new CopilotResponse(
                    loan.getId(),
                    loan.getLoanNumber(),
                    "APPROVAL_READINESS",
                    answer.toString(),
                    "HUMAN_REVIEW",
                    "HIGH",
                    risk.getRiskScore(),
                    risk.getRiskLevel(),
                    false,
                    validation.getErrorCount(),
                    sources
            );
        }

        String answer =
                "The loan has passed all configured "
                        + "validation checks and is eligible "
                        + "for reviewer approval. ";

        answer +=
                "The current risk classification is "
                        + risk.getRiskLevel()
                        + " with a score of "
                        + risk.getRiskScore()
                        + " out of 100. ";

        answer +=
                "Final approval should still be confirmed "
                        + "by the authorized reviewer.";

        return new CopilotResponse(
                loan.getId(),
                loan.getLoanNumber(),
                "APPROVAL_READINESS",
                answer,
                "APPROVE",
                risk.getRiskLevel(),
                risk.getRiskScore(),
                risk.getRiskLevel(),
                true,
                0,
                sources
        );
    }

    // =========================================================
    // RISK
    // =========================================================

    private CopilotResponse riskAnswer(
            Loan loan,
            LoanValidationService.ValidationResult validation,
            LoanRiskAssessment risk) {

        List<String> sources = new ArrayList<>();

        sources.add("Risk engine");
        sources.add("Loan record");

        StringBuilder answer =
                new StringBuilder();

        answer.append(
                "The current risk score is "
        );

        answer.append(
                risk.getRiskScore()
        );

        answer.append(
                " out of 100, classified as "
        );

        answer.append(
                risk.getRiskLevel()
        );

        answer.append(". ");

        if (risk.getFactors() == null ||
                risk.getFactors().isEmpty()) {

            answer.append(
                    "No additional risk factors were "
                            + "identified by the configured "
                            + "risk rules."
            );

        } else {

            answer.append(
                    "The main contributing factors are: "
            );

            for (int i = 0;
                 i < risk.getFactors().size();
                 i++) {

                RiskFactor factor =
                        risk.getFactors().get(i);

                if (i > 0) {
                    answer.append("; ");
                }

                answer.append(
                        factor.getFactor()
                );

                answer.append(
                        " ("
                );

                answer.append(
                        factor.getImpact()
                );

                answer.append(
                        ")"
                );
            }

            answer.append(".");
        }

        if (!validation.isValid()) {

            answer.append(
                    " There are also "
            );

            answer.append(
                    validation.getErrorCount()
            );

            answer.append(
                    " validation issue(s), "
                            + "which require reviewer attention."
            );
        }

        return new CopilotResponse(
                loan.getId(),
                loan.getLoanNumber(),
                "RISK_ANALYSIS",
                answer.toString(),
                risk.getRecommendation(),
                risk.getRiskLevel(),
                risk.getRiskScore(),
                risk.getRiskLevel(),
                validation.isValid(),
                validation.getErrorCount(),
                sources
        );
    }

    // =========================================================
    // EXCEPTIONS
    // =========================================================

    private CopilotResponse exceptionAnswer(
            Loan loan,
            LoanValidationService.ValidationResult validation,
            LoanRiskAssessment risk) {

        List<String> sources = new ArrayList<>();

        sources.add("Validation engine");
        sources.add("Loan record");

        if (validation.isValid()) {

            return new CopilotResponse(
                    loan.getId(),
                    loan.getLoanNumber(),
                    "EXCEPTIONS",
                    "There are currently no validation "
                            + "exceptions on this loan. "
                            + "All configured data-quality "
                            + "checks have passed.",
                    "NO_ACTION_REQUIRED",
                    "LOW",
                    risk.getRiskScore(),
                    risk.getRiskLevel(),
                    true,
                    0,
                    sources
            );
        }

        StringBuilder answer =
                new StringBuilder();

        answer.append(
                "This loan has "
        );

        answer.append(
                validation.getErrorCount()
        );

        answer.append(
                " validation exception(s): "
        );

        validation.getIssues().forEach(
                issue -> {

                    answer.append(
                            issue.getMessage()
                    );

                    answer.append(
                            " Field: "
                    );

                    answer.append(
                            issue.getField()
                    );

                    if (issue.getActualValue() != null) {

                        answer.append(
                                ". Actual: "
                        );

                        answer.append(
                                issue.getActualValue()
                        );
                    }

                    answer.append(
                            ". Expected: "
                    );

                    answer.append(
                            issue.getExpectedValue()
                    );

                    answer.append(". ");
                }
        );

        answer.append(
                "Correct the affected fields and "
                        + "run validation again before approval."
        );

        return new CopilotResponse(
                loan.getId(),
                loan.getLoanNumber(),
                "EXCEPTIONS",
                answer.toString(),
                "HUMAN_REVIEW",
                "HIGH",
                risk.getRiskScore(),
                risk.getRiskLevel(),
                false,
                validation.getErrorCount(),
                sources
        );
    }

    // =========================================================
    // AUDIT
    // =========================================================

    private CopilotResponse auditAnswer(
            Loan loan,
            LoanValidationService.ValidationResult validation,
            LoanRiskAssessment risk) {

        List<String> sources = new ArrayList<>();

        sources.add("Loan record");
        sources.add("Audit trail");

        String answer =
                "The audit trail is available for this loan "
                        + "and records important lifecycle events "
                        + "such as record creation, validation, "
                        + "AI recommendations, reviewer decisions, "
                        + "and record updates. ";

        answer +=
                "For the current state, the loan is "
                        + safe(loan.getVerificationStatus())
                        + " with "
                        + validation.getErrorCount()
                        + " validation issue(s). ";

        answer +=
                "Open the Audit Trail section to inspect "
                        + "the complete chronological history "
                        + "and record hashes.";

        return new CopilotResponse(
                loan.getId(),
                loan.getLoanNumber(),
                "AUDIT_HISTORY",
                answer,
                "REVIEW_AUDIT_TRAIL",
                validation.isValid()
                        ? "LOW"
                        : "HIGH",
                risk.getRiskScore(),
                risk.getRiskLevel(),
                validation.isValid(),
                validation.getErrorCount(),
                sources
        );
    }

    // =========================================================
    // SUMMARY
    // =========================================================

    private CopilotResponse summaryAnswer(
            Loan loan,
            LoanValidationService.ValidationResult validation,
            LoanRiskAssessment risk) {

        List<String> sources = new ArrayList<>();

        sources.add("Loan record");
        sources.add("Validation engine");
        sources.add("Risk engine");

        StringBuilder answer =
                new StringBuilder();

        answer.append(
                "Loan "
        );

        answer.append(
                safe(loan.getLoanNumber())
        );

        answer.append(
                " belongs to "
        );

        answer.append(
                safe(loan.getBorrowerName())
        );

        answer.append(". ");

        answer.append(
                "The original loan amount is "
        );

        answer.append(
                formatMoney(
                        loan.getOriginalLoanAmount()
                )
        );

        answer.append(
                " and the current balance is "
        );

        answer.append(
                formatMoney(
                        loan.getCurrentBalance()
                )
        );

        answer.append(". ");

        answer.append(
                "The interest rate is "
        );

        answer.append(
                safe(loan.getInterestRate())
        );

        answer.append(
                "% and the loan status is "
        );

        answer.append(
                safe(loan.getLoanStatus())
        );

        answer.append(". ");

        answer.append(
                "Validation is "
        );

        answer.append(
                validation.isValid()
                        ? "passed"
                        : "not passed"
        );

        answer.append(
                " with "
        );

        answer.append(
                validation.getErrorCount()
        );

        answer.append(
                " issue(s). "
        );

        answer.append(
                "Risk is "
        );

        answer.append(
                risk.getRiskLevel()
        );

        answer.append(
                " with a score of "
        );

        answer.append(
                risk.getRiskScore()
        );

        answer.append(
                " out of 100."
        );

        return new CopilotResponse(
                loan.getId(),
                loan.getLoanNumber(),
                "LOAN_SUMMARY",
                answer.toString(),
                risk.getRecommendation(),
                risk.getRiskLevel(),
                risk.getRiskScore(),
                risk.getRiskLevel(),
                validation.isValid(),
                validation.getErrorCount(),
                sources
        );
    }

    // =========================================================
    // GENERAL
    // =========================================================

    private CopilotResponse generalAnswer(
            Loan loan,
            LoanValidationService.ValidationResult validation,
            LoanRiskAssessment risk) {

        List<String> sources = new ArrayList<>();

        sources.add("Loan record");
        sources.add("Validation engine");
        sources.add("Risk engine");

        String answer =
                "I can help you review loan "
                        + safe(loan.getLoanNumber())
                        + ". Ask me about approval readiness, "
                        + "risk, exceptions, the loan summary, "
                        + "or the audit history.";

        return new CopilotResponse(
                loan.getId(),
                loan.getLoanNumber(),
                "GENERAL_LOAN_ASSISTANCE",
                answer,
                "REVIEW_LOAN",
                validation.isValid()
                        ? risk.getRiskLevel()
                        : "HIGH",
                risk.getRiskScore(),
                risk.getRiskLevel(),
                validation.isValid(),
                validation.getErrorCount(),
                sources
        );
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private boolean containsAny(
            String value,
            String... terms) {

        for (String term : terms) {

            if (value.contains(term)) {
                return true;
            }
        }

        return false;
    }

    private String safe(Object value) {

        return value == null
                ? "not available"
                : value.toString();
    }

    private String formatMoney(
            BigDecimal value) {

        if (value == null) {
            return "not available";
        }

        return "₹" + value.toPlainString();
    }
}
