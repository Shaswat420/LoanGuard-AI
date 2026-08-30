package com.loanguard.backend.controller;

import com.loanguard.backend.model.Loan;
import com.loanguard.backend.model.VerificationStatus;
import com.loanguard.backend.repository.LoanRepository;
import com.loanguard.backend.service.AuditLogService;
import com.loanguard.backend.service.LoanValidationService;
import com.loanguard.backend.service.LoanValidationService.ValidationResult;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/reviewer")
@CrossOrigin(origins = "http://localhost:5173")
public class ReviewerController {

    private final LoanRepository loanRepository;
    private final AuditLogService auditLogService;
    private final LoanValidationService validationService;

    public ReviewerController(
            LoanRepository loanRepository,
            AuditLogService auditLogService,
            LoanValidationService validationService) {

        this.loanRepository = loanRepository;
        this.auditLogService = auditLogService;
        this.validationService = validationService;
    }

    // =========================================================
    // APPROVE LOAN
    // =========================================================

    @PostMapping("/loans/{id}/approve")
    public ResponseEntity<?> approveLoan(
            @PathVariable Long id) {

        Optional<Loan> optionalLoan =
                loanRepository.findById(id);

        if (optionalLoan.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(createMessage("Loan not found"));
        }

        Loan loan = optionalLoan.get();

        // -----------------------------------------------------
        // ALWAYS validate before approval
        // -----------------------------------------------------

        ValidationResult validation =
                validationService.validate(loan);

        // -----------------------------------------------------
        // Do not allow approval if validation fails
        // -----------------------------------------------------

        if (!validation.isValid()) {

            loan.setValidationErrorCount(
                    validation.getErrorCount()
            );

            loan.setVerificationStatus(
                    VerificationStatus.NEEDS_REVIEW
            );

            loanRepository.save(loan);

            auditLogService.log(
                    loan,
                    "VALIDATION_RUN",
                    "Approval was blocked because the loan contains "
                            + validation.getErrorCount()
                            + " validation issue(s).",
                    "REVIEWER"
            );

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(createValidationResponse(
                            loan,
                            validation,
                            "Loan cannot be approved until all validation issues are resolved."
                    ));
        }

        // -----------------------------------------------------
        // Validation passed
        // -----------------------------------------------------

        loan.setValidationErrorCount(0);

        loan.setVerificationStatus(
                VerificationStatus.VERIFIED
        );

        Loan savedLoan =
                loanRepository.save(loan);

        // -----------------------------------------------------
        // Audit approval
        // -----------------------------------------------------

        auditLogService.log(
                savedLoan,
                "RECORD_APPROVED",
                "Reviewer approved the loan record after successful validation.",
                "REVIEWER"
        );

        return ResponseEntity.ok(savedLoan);
    }

    // =========================================================
    // REJECT LOAN
    // =========================================================

    @PostMapping("/loans/{id}/reject")
    public ResponseEntity<?> rejectLoan(
            @PathVariable Long id) {

        Optional<Loan> optionalLoan =
                loanRepository.findById(id);

        if (optionalLoan.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(createMessage("Loan not found"));
        }

        Loan loan = optionalLoan.get();

        loan.setVerificationStatus(
                VerificationStatus.REJECTED
        );

        // -----------------------------------------------------
        // Rejection does not require validation to complete.
        // Keep at least one issue indicator for rejected state.
        // -----------------------------------------------------

        loan.setValidationErrorCount(
                Math.max(
                        loan.getValidationErrorCount(),
                        1
                )
        );

        Loan savedLoan =
                loanRepository.save(loan);

        // -----------------------------------------------------
        // Audit rejection
        // -----------------------------------------------------

        auditLogService.log(
                savedLoan,
                "RECORD_REJECTED",
                "Reviewer rejected the loan record.",
                "REVIEWER"
        );

        return ResponseEntity.ok(savedLoan);
    }

    // =========================================================
    // MARK FOR HUMAN REVIEW
    // =========================================================

    @PostMapping("/loans/{id}/review")
    public ResponseEntity<?> markForReview(
            @PathVariable Long id) {

        Optional<Loan> optionalLoan =
                loanRepository.findById(id);

        if (optionalLoan.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(createMessage("Loan not found"));
        }

        Loan loan = optionalLoan.get();

        loan.setVerificationStatus(
                VerificationStatus.NEEDS_REVIEW
        );

        Loan savedLoan =
                loanRepository.save(loan);

        // -----------------------------------------------------
        // Audit human-review decision
        // -----------------------------------------------------

        auditLogService.log(
                savedLoan,
                "RECORD_NEEDS_REVIEW",
                "Loan record was marked for human review.",
                "REVIEWER"
        );

        return ResponseEntity.ok(savedLoan);
    }

    // =========================================================
    // GET LOAN FOR REVIEW
    // =========================================================

    @GetMapping("/loans/{id}")
    public ResponseEntity<?> getLoanForReview(
            @PathVariable Long id) {

        Optional<Loan> optionalLoan =
                loanRepository.findById(id);

        if (optionalLoan.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(createMessage("Loan not found"));
        }

        return ResponseEntity.ok(
                optionalLoan.get()
        );
    }

    // =========================================================
    // UPDATE LOAN
    // =========================================================

    @PutMapping("/loans/{id}")
    public ResponseEntity<?> updateLoan(
            @PathVariable Long id,
            @RequestBody Loan updatedLoan) {

        Optional<Loan> optionalLoan =
                loanRepository.findById(id);

        if (optionalLoan.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(createMessage("Loan not found"));
        }

        Loan existingLoan = optionalLoan.get();

        // -----------------------------------------------------
        // Check duplicate loan number
        // -----------------------------------------------------

        if (updatedLoan.getLoanNumber() != null
                && !updatedLoan.getLoanNumber()
                        .equals(existingLoan.getLoanNumber())) {

            Optional<Loan> duplicateLoan =
                    loanRepository.findByLoanNumber(
                            updatedLoan.getLoanNumber()
                    );

            if (duplicateLoan.isPresent()
                    && !duplicateLoan.get().getId()
                            .equals(existingLoan.getId())) {

                return ResponseEntity
                        .status(HttpStatus.CONFLICT)
                        .body(
                                createMessage(
                                        "A loan with this loan number already exists."
                                )
                        );
            }
        }

        // -----------------------------------------------------
        // Update editable fields
        // -----------------------------------------------------

        existingLoan.setLoanNumber(
                updatedLoan.getLoanNumber()
        );

        existingLoan.setBorrowerName(
                updatedLoan.getBorrowerName()
        );

        existingLoan.setOriginalLoanAmount(
                updatedLoan.getOriginalLoanAmount()
        );

        existingLoan.setCurrentBalance(
                updatedLoan.getCurrentBalance()
        );

        existingLoan.setInterestRate(
                updatedLoan.getInterestRate()
        );

        existingLoan.setLoanTermMonths(
                updatedLoan.getLoanTermMonths()
        );

        existingLoan.setOriginationDate(
                updatedLoan.getOriginationDate()
        );

        existingLoan.setMaturityDate(
                updatedLoan.getMaturityDate()
        );

        existingLoan.setLoanStatus(
                updatedLoan.getLoanStatus()
        );

        existingLoan.setDataSource(
                updatedLoan.getDataSource()
        );

        // -----------------------------------------------------
        // IMPORTANT
        //
        // Editing the record invalidates the previous
        // verification result.
        //
        // The reviewer must explicitly run AI Review again.
        // -----------------------------------------------------

        existingLoan.setVerificationStatus(
                VerificationStatus.PENDING
        );

        existingLoan.setValidationErrorCount(0);

        // -----------------------------------------------------
        // Save updated loan
        // -----------------------------------------------------

        Loan savedLoan =
                loanRepository.save(existingLoan);

        // -----------------------------------------------------
        // Audit update
        // -----------------------------------------------------

        auditLogService.log(
                savedLoan,
                "RECORD_UPDATED",
                "Loan record was updated by the reviewer and requires revalidation.",
                "REVIEWER"
        );

        return ResponseEntity.ok(savedLoan);
    }

    // =========================================================
    // HELPER - CREATE SIMPLE MESSAGE
    // =========================================================

    private Map<String, String> createMessage(
            String message) {

        Map<String, String> response =
                new HashMap<>();

        response.put(
                "message",
                message
        );

        return response;
    }

    // =========================================================
    // HELPER - VALIDATION RESPONSE
    // =========================================================

    private Map<String, Object> createValidationResponse(
            Loan loan,
            ValidationResult validation,
            String message) {

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "message",
                message
        );

        response.put(
                "loanId",
                loan.getId()
        );

        response.put(
                "loanNumber",
                loan.getLoanNumber()
        );

        response.put(
                "valid",
                validation.isValid()
        );

        response.put(
                "errorCount",
                validation.getErrorCount()
        );

        response.put(
                "issues",
                validation.getIssues()
        );

        return response;
    }
}