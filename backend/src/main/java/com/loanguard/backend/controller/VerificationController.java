package com.loanguard.backend.controller;

import com.loanguard.backend.model.Loan;
import com.loanguard.backend.model.VerificationStatus;
import com.loanguard.backend.repository.LoanRepository;
import com.loanguard.backend.service.LoanValidationService;
import com.loanguard.backend.service.LoanValidationService.ValidationIssue;
import com.loanguard.backend.service.LoanValidationService.ValidationResult;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class VerificationController {

    private final LoanRepository loanRepository;
    private final LoanValidationService validationService;

    public VerificationController(
            LoanRepository loanRepository,
            LoanValidationService validationService) {

        this.loanRepository = loanRepository;
        this.validationService = validationService;
    }

    // =========================================================
    // EXCEPTIONS
    // =========================================================

    @GetMapping("/exceptions")
    public ResponseEntity<List<Map<String, Object>>> getExceptions() {

        List<Loan> loans =
                loanRepository
                        .findByValidationErrorCountGreaterThan(0);

        List<Map<String, Object>> exceptions =
                new ArrayList<>();

        for (Loan loan : loans) {

            ValidationResult result =
                    validationService.validate(loan);

            Map<String, Object> record =
                    new LinkedHashMap<>();

            record.put("loanId", loan.getId());
            record.put("loanNumber", loan.getLoanNumber());
            record.put("borrowerName", loan.getBorrowerName());
            record.put(
                    "verificationStatus",
                    loan.getVerificationStatus()
            );
            record.put(
                    "validationErrorCount",
                    result.getErrorCount()
            );
            record.put(
                    "valid",
                    result.isValid()
            );
            record.put(
                    "issues",
                    result.getIssues()
            );

            exceptions.add(record);
        }

        return ResponseEntity.ok(exceptions);
    }

    // =========================================================
    // VERIFIED LOANS
    // =========================================================

    @GetMapping("/verified-loans")
    public ResponseEntity<List<Loan>> getVerifiedLoans() {

        return ResponseEntity.ok(
                loanRepository.findByVerificationStatus(
                        VerificationStatus.VERIFIED
                )
        );
    }

    // =========================================================
    // VERIFIED LOAN BY ID
    // =========================================================

    @GetMapping("/verified-loans/{id}")
    public ResponseEntity<?> getVerifiedLoan(
            @PathVariable Long id) {

        return loanRepository.findById(id)
                .map(loan -> {

                    if (loan.getVerificationStatus()
                            != VerificationStatus.VERIFIED) {

                        Map<String, Object> response =
                                new LinkedHashMap<>();

                        response.put(
                                "message",
                                "Loan is not verified."
                        );

                        response.put(
                                "loanId",
                                loan.getId()
                        );

                        response.put(
                                "verificationStatus",
                                loan.getVerificationStatus()
                        );

                        return ResponseEntity
                                .status(409)
                                .body(response);
                    }

                    return ResponseEntity.ok(
                            (Object) loan
                    );
                })
                .orElseGet(() ->
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }

    // =========================================================
    // SUMMARY
    // =========================================================

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {

        List<Loan> loans =
                loanRepository.findAll();

        int total =
                loans.size();

        int verified =
                0;

        int pending =
                0;

        int needsReview =
                0;

        int rejected =
                0;

        int validationExceptions =
                0;

        for (Loan loan : loans) {

            VerificationStatus status =
                    loan.getVerificationStatus();

            if (status == VerificationStatus.VERIFIED) {
                verified++;
            }

            if (status == VerificationStatus.PENDING) {
                pending++;
            }

            if (status == VerificationStatus.NEEDS_REVIEW) {
                needsReview++;
            }

            if (status == VerificationStatus.REJECTED) {
                rejected++;
            }

            if (loan.getValidationErrorCount() != null &&
                    loan.getValidationErrorCount() > 0) {

                validationExceptions++;
            }
        }

        double verificationRate =
                total == 0
                        ? 0
                        : ((double) verified / total) * 100;

        Map<String, Object> summary =
                new LinkedHashMap<>();

        summary.put("totalLoans", total);
        summary.put("verifiedLoans", verified);
        summary.put("pendingLoans", pending);
        summary.put("needsReviewLoans", needsReview);
        summary.put("rejectedLoans", rejected);
        summary.put(
                "validationExceptions",
                validationExceptions
        );
        summary.put(
                "verificationRate",
                Math.round(
                        verificationRate * 100.0
                ) / 100.0
        );

        return ResponseEntity.ok(summary);
    }
}