package com.loanguard.backend.service;

import com.loanguard.backend.model.Loan;
import com.loanguard.backend.model.LoanRiskAssessment;
import com.loanguard.backend.model.LoanRiskAssessment.RiskFactor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class LoanRiskService {

    public LoanRiskAssessment assessRisk(Loan loan) {

        int riskScore = 0;

        List<RiskFactor> factors = new ArrayList<>();

        // =========================================================
        // 1. VALIDATION ERRORS
        // =========================================================

        int validationErrors =
                loan.getValidationErrorCount() == null
                        ? 0
                        : loan.getValidationErrorCount();

        if (validationErrors > 0) {

            int impact =
                    Math.min(validationErrors * 10, 30);

            riskScore += impact;

            factors.add(
                    new RiskFactor(
                            "Validation Errors",
                            "HIGH",
                            "+" + impact,
                            validationErrors
                                    + " validation issue(s) detected."
                    )
            );
        }

        // =========================================================
        // 2. BALANCE UTILIZATION
        // =========================================================

        BigDecimal originalAmount =
                loan.getOriginalLoanAmount();

        BigDecimal currentBalance =
                loan.getCurrentBalance();

        if (originalAmount != null &&
                currentBalance != null &&
                originalAmount.compareTo(BigDecimal.ZERO) > 0) {

            BigDecimal utilization =
                    currentBalance
                            .divide(
                                    originalAmount,
                                    4,
                                    RoundingMode.HALF_UP
                            )
                            .multiply(
                                    new BigDecimal("100")
                            );

            if (utilization.compareTo(
                    new BigDecimal("90")) >= 0) {

                riskScore += 25;

                factors.add(
                        new RiskFactor(
                                "High Balance Utilization",
                                "HIGH",
                                "+25",
                                "Current balance is 90% or more "
                                        + "of the original loan amount."
                        )
                );

            } else if (utilization.compareTo(
                    new BigDecimal("75")) >= 0) {

                riskScore += 15;

                factors.add(
                        new RiskFactor(
                                "Elevated Balance Utilization",
                                "MEDIUM",
                                "+15",
                                "Current balance is 75% or more "
                                        + "of the original loan amount."
                        )
                );

            } else if (utilization.compareTo(
                    new BigDecimal("50")) >= 0) {

                riskScore += 5;

                factors.add(
                        new RiskFactor(
                                "Moderate Balance Utilization",
                                "LOW",
                                "+5",
                                "Current balance is 50% or more "
                                        + "of the original loan amount."
                        )
                );
            }
        }

        // =========================================================
        // 3. INTEREST RATE
        // =========================================================

        BigDecimal interestRate =
                loan.getInterestRate();

        if (interestRate != null) {

            if (interestRate.compareTo(
                    new BigDecimal("15")) >= 0) {

                riskScore += 20;

                factors.add(
                        new RiskFactor(
                                "High Interest Rate",
                                "HIGH",
                                "+20",
                                "Interest rate is 15% or higher."
                        )
                );

            } else if (interestRate.compareTo(
                    new BigDecimal("10")) >= 0) {

                riskScore += 10;

                factors.add(
                        new RiskFactor(
                                "Elevated Interest Rate",
                                "MEDIUM",
                                "+10",
                                "Interest rate is between 10% and 15%."
                        )
                );
            }
        }

        // =========================================================
        // 4. MATURITY PROXIMITY
        // =========================================================

        LocalDate maturityDate =
                loan.getMaturityDate();

        if (maturityDate != null) {

            long daysUntilMaturity =
                    ChronoUnit.DAYS.between(
                            LocalDate.now(),
                            maturityDate
                    );

            if (daysUntilMaturity < 0) {

                riskScore += 25;

                factors.add(
                        new RiskFactor(
                                "Maturity Date Passed",
                                "HIGH",
                                "+25",
                                "Loan maturity date has already passed."
                        )
                );

            } else if (daysUntilMaturity <= 90) {

                riskScore += 20;

                factors.add(
                        new RiskFactor(
                                "Near Maturity",
                                "HIGH",
                                "+20",
                                "Loan matures within 90 days."
                        )
                );

            } else if (daysUntilMaturity <= 180) {

                riskScore += 10;

                factors.add(
                        new RiskFactor(
                                "Maturity Approaching",
                                "MEDIUM",
                                "+10",
                                "Loan matures within 180 days."
                        )
                );
            }
        }

        // =========================================================
        // 5. LOAN STATUS
        // =========================================================

        String loanStatus =
                loan.getLoanStatus();

        if (loanStatus != null) {

            String normalizedStatus =
                    loanStatus.trim().toUpperCase();

            if (normalizedStatus.contains("DEFAULT") ||
                    normalizedStatus.contains("DELINQUENT")) {

                riskScore += 25;

                factors.add(
                        new RiskFactor(
                                "Default or Delinquency",
                                "HIGH",
                                "+25",
                                "Loan status indicates default "
                                        + "or delinquency."
                        )
                );

            } else if (normalizedStatus.contains("OVERDUE")) {

                riskScore += 20;

                factors.add(
                        new RiskFactor(
                                "Overdue Loan",
                                "HIGH",
                                "+20",
                                "Loan is currently overdue."
                        )
                );
            }
        }

        // =========================================================
        // 6. VERIFICATION STATUS
        // =========================================================

        if (loan.getVerificationStatus() != null) {

            switch (loan.getVerificationStatus()) {

                case NEEDS_REVIEW -> {

                    riskScore += 10;

                    factors.add(
                            new RiskFactor(
                                    "Human Review Required",
                                    "MEDIUM",
                                    "+10",
                                    "Loan requires human verification review."
                            )
                    );
                }

                case REJECTED -> {

                    riskScore += 20;

                    factors.add(
                            new RiskFactor(
                                    "Record Rejected",
                                    "HIGH",
                                    "+20",
                                    "Loan record has been rejected."
                            )
                    );
                }

                default -> {
                    // No additional risk
                }
            }
        }

        // =========================================================
        // LIMIT SCORE
        // =========================================================

        riskScore =
                Math.min(riskScore, 100);

        // =========================================================
        // RISK LEVEL
        // =========================================================

        String riskLevel;

        if (riskScore >= 70) {

            riskLevel = "HIGH";

        } else if (riskScore >= 40) {

            riskLevel = "MEDIUM";

        } else {

            riskLevel = "LOW";
        }

        // =========================================================
        // RECOMMENDATION
        // =========================================================

        String recommendation;

        if ("HIGH".equals(riskLevel)) {

            recommendation =
                    "Human review required";

        } else if ("MEDIUM".equals(riskLevel)) {

            recommendation =
                    "Additional verification recommended";

        } else {

            recommendation =
                    "Loan appears to have low risk";
        }

        // =========================================================
        // CONFIDENCE
        // =========================================================
        //
        // Confidence represents how much reliable information
        // was available for the assessment.
        //
        // More validation errors = lower confidence.
        // =========================================================

        int confidence;

        if (validationErrors == 0) {

            confidence = 95;

        } else if (validationErrors <= 2) {

            confidence = 80;

        } else if (validationErrors <= 4) {

            confidence = 65;

        } else {

            confidence = 50;
        }

        // =========================================================
        // VALIDATION STATUS
        // =========================================================

        boolean validationPassed =
                validationErrors == 0;

        // =========================================================
        // RETURN ASSESSMENT
        // =========================================================

        return new LoanRiskAssessment(
                loan.getId(),
                loan.getLoanNumber(),
                riskScore,
                riskLevel,
                recommendation,
                confidence,
                validationPassed,
                validationErrors,
                factors
        );
    }
}