package com.loanguard.backend.service;

import com.loanguard.backend.model.Loan;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class LoanValidationService {

    public ValidationResult validate(Loan loan) {

        List<ValidationIssue> issues = new ArrayList<>();

        // =========================================================
        // 1. NULL LOAN OBJECT
        // =========================================================

        if (loan == null) {

            issues.add(new ValidationIssue(
                    "LOAN_OBJECT_MISSING",
                    "loan",
                    "CRITICAL",
                    "Loan record cannot be null.",
                    null,
                    "A valid loan record"
            ));

            return new ValidationResult(
                    false,
                    issues
            );
        }

        // =========================================================
        // 2. LOAN NUMBER
        // =========================================================

        if (loan.getLoanNumber() == null ||
                loan.getLoanNumber().trim().isEmpty()) {

            issues.add(new ValidationIssue(
                    "LOAN_NUMBER_MISSING",
                    "loanNumber",
                    "HIGH",
                    "Loan number is required.",
                    null,
                    "A valid loan number"
            ));
        }

        // =========================================================
        // 3. BORROWER NAME
        // =========================================================

        if (loan.getBorrowerName() == null ||
                loan.getBorrowerName().trim().isEmpty()) {

            issues.add(new ValidationIssue(
                    "BORROWER_NAME_MISSING",
                    "borrowerName",
                    "HIGH",
                    "Borrower name is required.",
                    null,
                    "A valid borrower name"
            ));
        }

        // =========================================================
        // 4. ORIGINAL LOAN AMOUNT
        // =========================================================

        if (loan.getOriginalLoanAmount() == null) {

            issues.add(new ValidationIssue(
                    "ORIGINAL_AMOUNT_MISSING",
                    "originalLoanAmount",
                    "HIGH",
                    "Original loan amount is required.",
                    null,
                    "A positive amount"
            ));

        } else if (loan.getOriginalLoanAmount()
                .compareTo(BigDecimal.ZERO) <= 0) {

            issues.add(new ValidationIssue(
                    "ORIGINAL_AMOUNT_INVALID",
                    "originalLoanAmount",
                    "HIGH",
                    "Original loan amount must be greater than zero.",
                    loan.getOriginalLoanAmount().toString(),
                    "> 0"
            ));
        }

        // =========================================================
        // 5. CURRENT BALANCE
        // =========================================================

        if (loan.getCurrentBalance() == null) {

            issues.add(new ValidationIssue(
                    "CURRENT_BALANCE_MISSING",
                    "currentBalance",
                    "HIGH",
                    "Current balance is required.",
                    null,
                    "A non-negative amount"
            ));

        } else if (loan.getCurrentBalance()
                .compareTo(BigDecimal.ZERO) < 0) {

            issues.add(new ValidationIssue(
                    "CURRENT_BALANCE_NEGATIVE",
                    "currentBalance",
                    "HIGH",
                    "Current balance cannot be negative.",
                    loan.getCurrentBalance().toString(),
                    ">= 0"
            ));
        }

        // =========================================================
        // 6. CURRENT BALANCE VS ORIGINAL AMOUNT
        // =========================================================

        if (loan.getOriginalLoanAmount() != null &&
                loan.getCurrentBalance() != null &&
                loan.getOriginalLoanAmount()
                        .compareTo(BigDecimal.ZERO) > 0 &&
                loan.getCurrentBalance()
                        .compareTo(loan.getOriginalLoanAmount()) > 0) {

            issues.add(new ValidationIssue(
                    "BALANCE_EXCEEDS_ORIGINAL",
                    "currentBalance",
                    "HIGH",
                    "Current balance exceeds the original loan amount.",
                    loan.getCurrentBalance().toString(),
                    "<= " + loan.getOriginalLoanAmount()
            ));
        }

        // =========================================================
        // 7. INTEREST RATE
        // =========================================================

        if (loan.getInterestRate() == null) {

            issues.add(new ValidationIssue(
                    "INTEREST_RATE_MISSING",
                    "interestRate",
                    "HIGH",
                    "Interest rate is required.",
                    null,
                    "Between 0 and 50"
            ));

        } else if (
                loan.getInterestRate()
                        .compareTo(BigDecimal.ZERO) < 0 ||
                loan.getInterestRate()
                        .compareTo(new BigDecimal("50")) > 0
        ) {

            issues.add(new ValidationIssue(
                    "INTEREST_RATE_INVALID",
                    "interestRate",
                    "HIGH",
                    "Interest rate must be between 0% and 50%.",
                    loan.getInterestRate().toString(),
                    "0 - 50"
            ));
        }

        // =========================================================
        // 8. LOAN TERM
        // =========================================================

        if (loan.getLoanTermMonths() == null) {

            issues.add(new ValidationIssue(
                    "LOAN_TERM_MISSING",
                    "loanTermMonths",
                    "HIGH",
                    "Loan term is required.",
                    null,
                    "A positive number of months"
            ));

        } else if (loan.getLoanTermMonths() <= 0) {

            issues.add(new ValidationIssue(
                    "LOAN_TERM_INVALID",
                    "loanTermMonths",
                    "HIGH",
                    "Loan term must be greater than zero.",
                    loan.getLoanTermMonths().toString(),
                    "> 0"
            ));

        } else if (loan.getLoanTermMonths() > 600) {

            issues.add(new ValidationIssue(
                    "LOAN_TERM_TOO_LONG",
                    "loanTermMonths",
                    "MEDIUM",
                    "Loan term exceeds the configured maximum of 600 months.",
                    loan.getLoanTermMonths().toString(),
                    "<= 600"
            ));
        }

        // =========================================================
        // 9. ORIGINATION DATE
        // =========================================================

        if (loan.getOriginationDate() == null) {

            issues.add(new ValidationIssue(
                    "ORIGINATION_DATE_MISSING",
                    "originationDate",
                    "MEDIUM",
                    "Origination date is required.",
                    null,
                    "A valid date"
            ));
        }

        // =========================================================
        // 10. MATURITY DATE
        // =========================================================

        if (loan.getMaturityDate() == null) {

            issues.add(new ValidationIssue(
                    "MATURITY_DATE_MISSING",
                    "maturityDate",
                    "MEDIUM",
                    "Maturity date is required.",
                    null,
                    "A valid date"
            ));
        }

        // =========================================================
        // 11. MATURITY DATE AFTER ORIGINATION
        // =========================================================

        if (loan.getOriginationDate() != null &&
                loan.getMaturityDate() != null &&
                !loan.getMaturityDate()
                        .isAfter(loan.getOriginationDate())) {

            issues.add(new ValidationIssue(
                    "INVALID_MATURITY_DATE",
                    "maturityDate",
                    "HIGH",
                    "Maturity date must be after the origination date.",
                    loan.getMaturityDate().toString(),
                    "After " + loan.getOriginationDate()
            ));
        }

        // =========================================================
        // 12. LOAN STATUS
        // =========================================================

        if (loan.getLoanStatus() == null ||
                loan.getLoanStatus().trim().isEmpty()) {

            issues.add(new ValidationIssue(
                    "LOAN_STATUS_MISSING",
                    "loanStatus",
                    "MEDIUM",
                    "Loan status is required.",
                    null,
                    "ACTIVE, CLOSED, DEFAULT or PAID_OFF"
            ));

        } else {

            String status =
                    loan.getLoanStatus()
                            .trim()
                            .toUpperCase();

            if (!status.equals("ACTIVE") &&
                    !status.equals("CLOSED") &&
                    !status.equals("DEFAULT") &&
                    !status.equals("PAID_OFF")) {

                issues.add(new ValidationIssue(
                        "LOAN_STATUS_INVALID",
                        "loanStatus",
                        "HIGH",
                        "Loan status is not recognized.",
                        loan.getLoanStatus(),
                        "ACTIVE, CLOSED, DEFAULT or PAID_OFF"
                ));
            }
        }

        // =========================================================
        // 13. DATA SOURCE
        // =========================================================

        if (loan.getDataSource() == null ||
                loan.getDataSource().trim().isEmpty()) {

            issues.add(new ValidationIssue(
                    "DATA_SOURCE_MISSING",
                    "dataSource",
                    "MEDIUM",
                    "Data source is required.",
                    null,
                    "A valid data source"
            ));
        }

        // =========================================================
        // 14. CLOSED / PAID OFF LOANS
        // =========================================================

        if (loan.getLoanStatus() != null &&
                loan.getCurrentBalance() != null) {

            String status =
                    loan.getLoanStatus()
                            .trim()
                            .toUpperCase();

            if ((status.equals("CLOSED") ||
                    status.equals("PAID_OFF")) &&
                    loan.getCurrentBalance()
                            .compareTo(BigDecimal.ZERO) > 0) {

                issues.add(new ValidationIssue(
                        "CLOSED_LOAN_HAS_BALANCE",
                        "currentBalance",
                        "HIGH",
                        "Closed or paid-off loans should not have an outstanding balance.",
                        loan.getCurrentBalance().toString(),
                        "0"
                ));
            }
        }

        // =========================================================
        // 15. ACTIVE LOAN WITH ZERO BALANCE
        // =========================================================

        if (loan.getLoanStatus() != null &&
                loan.getCurrentBalance() != null) {

            String status =
                    loan.getLoanStatus()
                            .trim()
                            .toUpperCase();

            if (status.equals("ACTIVE") &&
                    loan.getCurrentBalance()
                            .compareTo(BigDecimal.ZERO) == 0) {

                issues.add(new ValidationIssue(
                        "ACTIVE_LOAN_ZERO_BALANCE",
                        "currentBalance",
                        "MEDIUM",
                        "Active loan has a zero outstanding balance.",
                        loan.getCurrentBalance().toString(),
                        "> 0"
                ));
            }
        }

        // =========================================================
        // 16. FINAL RESULT
        // =========================================================

        return new ValidationResult(
                issues.isEmpty(),
                issues
        );
    }

    // =============================================================
    // VALIDATION RESULT
    // =============================================================

    public static class ValidationResult {

        private final boolean valid;
        private final List<ValidationIssue> issues;

        public ValidationResult(
                boolean valid,
                List<ValidationIssue> issues) {

            this.valid = valid;
            this.issues = issues;
        }

        public boolean isValid() {
            return valid;
        }

        public List<ValidationIssue> getIssues() {
            return issues;
        }

        public int getErrorCount() {
            return issues.size();
        }
    }

    // =============================================================
    // VALIDATION ISSUE
    // =============================================================

    public static class ValidationIssue {

        private final String rule;
        private final String field;
        private final String severity;
        private final String message;
        private final String actualValue;
        private final String expectedValue;

        public ValidationIssue(
                String rule,
                String field,
                String severity,
                String message,
                String actualValue,
                String expectedValue) {

            this.rule = rule;
            this.field = field;
            this.severity = severity;
            this.message = message;
            this.actualValue = actualValue;
            this.expectedValue = expectedValue;
        }

        public String getRule() {
            return rule;
        }

        public String getField() {
            return field;
        }

        public String getSeverity() {
            return severity;
        }

        public String getMessage() {
            return message;
        }

        public String getActualValue() {
            return actualValue;
        }

        public String getExpectedValue() {
            return expectedValue;
        }
    }
}