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
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanRepository loanRepository;
    private final LoanValidationService validationService;
    private final AuditLogService auditLogService;

    public LoanController(
            LoanRepository loanRepository,
            LoanValidationService validationService,
            AuditLogService auditLogService
    ) {
        this.loanRepository = loanRepository;
        this.validationService = validationService;
        this.auditLogService = auditLogService;
    }

    // =========================================================
    // GET ALL LOANS
    // =========================================================

    @GetMapping
    public ResponseEntity<List<Loan>> getAllLoans() {

        List<Loan> loans = loanRepository.findAll();

        return ResponseEntity.ok(loans);
    }

    // =========================================================
    // GET SINGLE LOAN
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getLoan(
            @PathVariable Long id
    ) {

        Optional<Loan> optionalLoan =
                loanRepository.findById(id);

        if (optionalLoan.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(message("Loan not found"));
        }

        return ResponseEntity.ok(optionalLoan.get());
    }

    // =========================================================
    // CREATE LOAN
    // =========================================================

    @PostMapping
    public ResponseEntity<?> createLoan(
            @RequestBody Loan loan
    ) {

        // Check duplicate loan number

        if (loan.getLoanNumber() != null &&
                loanRepository
                        .findByLoanNumber(loan.getLoanNumber())
                        .isPresent()) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(
                            message(
                                    "A loan with this loan number already exists."
                            )
                    );
        }

        // Run validation

        ValidationResult validation =
                validationService.validate(loan);

        // Store validation error count

        loan.setValidationErrorCount(
                validation.getErrorCount()
        );

        // Set verification status

        if (validation.isValid()) {

            loan.setVerificationStatus(
                    VerificationStatus.VERIFIED
            );

        } else {

            loan.setVerificationStatus(
                    VerificationStatus.NEEDS_REVIEW
            );
        }

        // Save loan

        Loan savedLoan =
                loanRepository.save(loan);

        // Audit log

        auditLogService.log(
                savedLoan,
                "RECORD_CREATED",
                "Loan record was created and initial validation was completed.",
                "SYSTEM"
        );

        // Build response

        Map<String, Object> response =
                new HashMap<>();

        response.put("loan", savedLoan);

        response.put(
                "valid",
                validation.isValid()
        );

        response.put(
                "validationErrorCount",
                validation.getErrorCount()
        );

        response.put(
                "issues",
                validation.getIssues()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // =========================================================
    // VERIFY LOAN
    // =========================================================

    @PostMapping("/{id}/verify")
    public ResponseEntity<?> verifyLoan(
            @PathVariable Long id
    ) {

        Optional<Loan> optionalLoan =
                loanRepository.findById(id);

        if (optionalLoan.isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(message("Loan not found"));
        }

        Loan loan = optionalLoan.get();

        // Run validation

        ValidationResult validation =
                validationService.validate(loan);

        // Update validation error count

        loan.setValidationErrorCount(
                validation.getErrorCount()
        );

        // Update verification status

        if (validation.isValid()) {

            loan.setVerificationStatus(
                    VerificationStatus.VERIFIED
            );

        } else {

            loan.setVerificationStatus(
                    VerificationStatus.NEEDS_REVIEW
            );
        }

        // Save

        Loan savedLoan =
                loanRepository.save(loan);

        // Audit log

        auditLogService.log(
                savedLoan,
                "RECORD_VERIFIED",
                validation.isValid()
                        ? "Loan passed verification."
                        : "Loan verification completed with validation issues.",
                "SYSTEM"
        );

        Map<String, Object> response =
                new HashMap<>();

        response.put("loan", savedLoan);

        response.put(
                "valid",
                validation.isValid()
        );

        response.put(
                "validationErrorCount",
                validation.getErrorCount()
        );

        response.put(
                "issues",
                validation.getIssues()
        );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // VALIDATE LOAN
    // =========================================================

    @PostMapping("/{id}/validate")
    public ResponseEntity<?> validateLoan(
            @PathVariable Long id
    ) {

        Optional<Loan> optionalLoan =
                loanRepository.findById(id);

        if (optionalLoan.isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(message("Loan not found"));
        }

        Loan loan = optionalLoan.get();

        // Run validation

        ValidationResult validation =
                validationService.validate(loan);

        // Update validation count

        loan.setValidationErrorCount(
                validation.getErrorCount()
        );

        /*
         * Validation does not automatically approve a loan.
         */

        if (validation.isValid()) {

            if (loan.getVerificationStatus()
                    != VerificationStatus.VERIFIED) {

                loan.setVerificationStatus(
                        VerificationStatus.PENDING
                );
            }

        } else {

            loan.setVerificationStatus(
                    VerificationStatus.NEEDS_REVIEW
            );
        }

        // Save

        Loan savedLoan =
                loanRepository.save(loan);

        // Audit

        auditLogService.log(
                savedLoan,
                "VALIDATION_RUN",
                "Loan validation completed. "
                        + validation.getErrorCount()
                        + " validation issue(s) detected.",
                "SYSTEM"
        );

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "loanId",
                savedLoan.getId()
        );

        response.put(
                "loanNumber",
                savedLoan.getLoanNumber()
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

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // UPDATE LOAN
    // =========================================================

    @PutMapping("/{id}")
    public ResponseEntity<?> updateLoan(
            @PathVariable Long id,
            @RequestBody Loan updatedLoan
    ) {

        Optional<Loan> optionalLoan =
                loanRepository.findById(id);

        if (optionalLoan.isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(message("Loan not found"));
        }

        Loan existingLoan =
                optionalLoan.get();

        // Check duplicate loan number

        Optional<Loan> duplicateLoan =
                loanRepository.findByLoanNumber(
                        updatedLoan.getLoanNumber()
                );

        if (duplicateLoan.isPresent()
                && !duplicateLoan.get()
                .getId()
                .equals(id)) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(
                            message(
                                    "A loan with this loan number already exists."
                            )
                    );
        }

        // Update fields

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

        // Reset verification after modification

        existingLoan.setVerificationStatus(
                VerificationStatus.PENDING
        );

        existingLoan.setValidationErrorCount(0);

        // Save

        Loan savedLoan =
                loanRepository.save(existingLoan);

        // Audit

        auditLogService.log(
                savedLoan,
                "RECORD_UPDATED",
                "Loan record was updated. Previous verification was invalidated and revalidation is required.",
                "REVIEWER"
        );

        Map<String, Object> response =
                new HashMap<>();

        response.put("loan", savedLoan);

        response.put("valid", false);

        response.put(
                "validationErrorCount",
                0
        );

        response.put(
                "issues",
                List.of()
        );

        response.put(
                "requiresRevalidation",
                true
        );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // DELETE LOAN
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLoan(
            @PathVariable Long id
    ) {

        Optional<Loan> optionalLoan =
                loanRepository.findById(id);

        if (optionalLoan.isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(message("Loan not found"));
        }

        Loan loan = optionalLoan.get();

        // Audit before deleting

        auditLogService.log(
                loan,
                "RECORD_DELETED",
                "Loan record was deleted.",
                "SYSTEM"
        );

        // Delete

        loanRepository.delete(loan);

        return ResponseEntity.ok(
                message("Loan deleted successfully.")
        );
    }

    // =========================================================
    // HELPER METHOD
    // =========================================================

    private Map<String, String> message(
            String text
    ) {

        Map<String, String> response =
                new HashMap<>();

        response.put("message", text);

        return response;
    }
}