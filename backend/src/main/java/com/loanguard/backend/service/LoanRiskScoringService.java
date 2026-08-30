package com.loanguard.backend.service;

import com.loanguard.backend.model.Loan;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class LoanRiskScoringService {

    private final LoanValidationService validationService;

    public LoanRiskScoringService(
            LoanValidationService validationService) {

        this.validationService = validationService;
    }

    public RiskAnalysis analyze(Loan loan) {

        LoanValidationService.ValidationResult validation =
                validationService.validate(loan);

        List<RiskFactor> factors = new ArrayList<>();

        int riskScore = 0;

        // =====================================================
        // 1. VALIDATION RISK
        // =====================================================

        if (validation.getErrorCount() == 0) {

            factors.add(new RiskFactor(
                    "Data Quality",
                    "LOW",
                    "POSITIVE",
                    "No validation issues were detected."
            ));

        } else {

            int validationRisk =
                    Math.min(
                            50,
                            validation.getErrorCount() * 15
                    );

            riskScore += validationRisk;

            factors.add(new RiskFactor(
                    "Data Quality",
                    validationRisk >= 30
                            ? "HIGH"
                            : "MEDIUM",
                    "NEGATIVE",
                    validation.getErrorCount()
                            + " validation issue(s) detected."
            ));
        }

        // =====================================================
        // 2. BALANCE RISK
        // =====================================================

        if (loan.getOriginalLoanAmount() != null &&
                loan.getCurrentBalance() != null &&
                loan.getOriginalLoanAmount()
                        .compareTo(BigDecimal.ZERO) > 0) {

            BigDecimal balanceRatio =
                    loan.getCurrentBalance()
                            .divide(
                                    loan.getOriginalLoanAmount(),
                                    4,
                                    java.math.RoundingMode.HALF_UP
                            );

            if (balanceRatio.compareTo(new BigDecimal("1")) > 0) {

                riskScore += 25;

                factors.add(new RiskFactor(
                        "Loan Balance",
                        "HIGH",
                        "NEGATIVE",
                        "Current balance exceeds the original loan amount."
                ));

            } else if (balanceRatio.compareTo(new BigDecimal("0.90")) > 0) {

                riskScore += 10;

                factors.add(new RiskFactor(
                        "Loan Balance",
                        "MEDIUM",
                        "NEGATIVE",
                        "Current balance remains above 90% of the original amount."
                ));

            } else {

                factors.add(new RiskFactor(
                        "Loan Balance",
                        "LOW",
                        "POSITIVE",
                        "Current balance is within the original loan amount."
                ));
            }
        }

        // =====================================================
        // 3. INTEREST RATE RISK
        // =====================================================

        if (loan.getInterestRate() != null) {

            BigDecimal rate = loan.getInterestRate();

            if (rate.compareTo(new BigDecimal("30")) > 0) {

                riskScore += 15;

                factors.add(new RiskFactor(
                        "Interest Rate",
                        "HIGH",
                        "NEGATIVE",
                        "Interest rate is above 30%."
                ));

            } else if (rate.compareTo(new BigDecimal("20")) > 0) {

                riskScore += 8;

                factors.add(new RiskFactor(
                        "Interest Rate",
                        "MEDIUM",
                        "NEGATIVE",
                        "Interest rate is above 20%."
                ));

            } else {

                factors.add(new RiskFactor(
                        "Interest Rate",
                        "LOW",
                        "POSITIVE",
                        "Interest rate is within the configured normal range."
                ));
            }
        }

        // =====================================================
        // 4. LOAN LIFECYCLE RISK
        // =====================================================

        LocalDate origination =
                loan.getOriginationDate();

        LocalDate maturity =
                loan.getMaturityDate();

        if (origination != null && maturity != null) {

            if (!maturity.isAfter(origination)) {

                riskScore += 20;

                factors.add(new RiskFactor(
                        "Loan Lifecycle",
                        "HIGH",
                        "NEGATIVE",
                        "Maturity date is not after the origination date."
                ));

            } else {

                factors.add(new RiskFactor(
                        "Loan Lifecycle",
                        "LOW",
                        "POSITIVE",
                        "Origination and maturity dates are consistent."
                ));
            }
        }

        // =====================================================
        // 5. LOAN STATUS
        // =====================================================

        if (loan.getLoanStatus() != null) {

            String status =
                    loan.getLoanStatus()
                            .trim()
                            .toUpperCase();

            if ("DEFAULT".equals(status) ||
                    "DELINQUENT".equals(status) ||
                    "CHARGED_OFF".equals(status)) {

                riskScore += 20;

                factors.add(new RiskFactor(
                        "Loan Status",
                        "HIGH",
                        "NEGATIVE",
                        "Loan status indicates elevated credit risk."
                ));

            } else if ("ACTIVE".equals(status)) {

                factors.add(new RiskFactor(
                        "Loan Status",
                        "LOW",
                        "POSITIVE",
                        "Loan is currently active."
                ));

            } else {

                factors.add(new RiskFactor(
                        "Loan Status",
                        "MEDIUM",
                        "NEUTRAL",
                        "Loan status requires contextual review."
                ));
            }
        }

        // =====================================================
        // CAP SCORE
        // =====================================================

        riskScore = Math.min(100, riskScore);

        // =====================================================
        // RISK LEVEL
        // =====================================================

        String riskLevel;

        if (riskScore >= 60) {
            riskLevel = "HIGH";
        } else if (riskScore >= 30) {
            riskLevel = "MEDIUM";
        } else {
            riskLevel = "LOW";
        }

        // =====================================================
        // RECOMMENDATION
        // =====================================================

        String recommendation;

        if (riskScore >= 75) {

            recommendation = "REJECT";

        } else if (riskScore >= 30 ||
                !validation.isValid()) {

            recommendation = "HUMAN_REVIEW";

        } else {

            recommendation = "APPROVE";
        }

        // =====================================================
        // CONFIDENCE
        // =====================================================

        int confidence;

        if (validation.isValid()) {

            confidence = riskScore < 30
                    ? 94
                    : riskScore < 60
                        ? 87
                        : 80;

        } else {

            confidence = 90;
        }

        return new RiskAnalysis(
                loan.getId(),
                loan.getLoanNumber(),
                riskScore,
                riskLevel,
                recommendation,
                confidence,
                validation.isValid(),
                validation.getErrorCount(),
                factors
        );
    }

    // =========================================================
    // RISK ANALYSIS RESPONSE
    // =========================================================

    public static class RiskAnalysis {

        private final Long loanId;
        private final String loanNumber;
        private final int riskScore;
        private final String riskLevel;
        private final String recommendation;
        private final int confidence;
        private final boolean validationPassed;
        private final int validationErrorCount;
        private final List<RiskFactor> factors;

        public RiskAnalysis(
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

        public String getLoanNumber() {
            return loanNumber;
        }

        public int getRiskScore() {
            return riskScore;
        }

        public String getRiskLevel() {
            return riskLevel;
        }

        public String getRecommendation() {
            return recommendation;
        }

        public int getConfidence() {
            return confidence;
        }

        public boolean isValidationPassed() {
            return validationPassed;
        }

        public int getValidationErrorCount() {
            return validationErrorCount;
        }

        public List<RiskFactor> getFactors() {
            return factors;
        }
    }

    // =========================================================
    // RISK FACTOR
    // =========================================================

    public static class RiskFactor {

        private final String factor;
        private final String severity;
        private final String impact;
        private final String description;

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

        public String getSeverity() {
            return severity;
        }

        public String getImpact() {
            return impact;
        }

        public String getDescription() {
            return description;
        }
    }
}