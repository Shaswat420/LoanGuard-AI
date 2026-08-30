package com.loanguard.backend.controller;

import com.loanguard.backend.model.AuditLog;
import com.loanguard.backend.model.Loan;
import com.loanguard.backend.repository.LoanRepository;
import com.loanguard.backend.service.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/audit")
@CrossOrigin(origins = "http://localhost:5173")
public class AuditController {

    private final AuditLogService auditLogService;
    private final LoanRepository loanRepository;

    public AuditController(
            AuditLogService auditLogService,
            LoanRepository loanRepository) {

        this.auditLogService = auditLogService;
        this.loanRepository = loanRepository;
    }

    @GetMapping("/loans/{id}")
    public ResponseEntity<?> getLoanAudit(
            @PathVariable Long id) {

        Optional<Loan> loan =
                loanRepository.findById(id);

        if (loan.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            new ErrorResponse(
                                    "Loan not found"
                            )
                    );
        }

        List<AuditLog> logs =
                auditLogService.getLoanAudit(id);

        return ResponseEntity.ok(logs);
    }

    @GetMapping("/loans/{id}/hash")
    public ResponseEntity<?> getCurrentHash(
            @PathVariable Long id) {

        Optional<Loan> optionalLoan =
                loanRepository.findById(id);

        if (optionalLoan.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            new ErrorResponse(
                                    "Loan not found"
                            )
                    );
        }

        Loan loan = optionalLoan.get();

        String hash =
                auditLogService.generateHash(loan);

        return ResponseEntity.ok(
                new HashResponse(
                        loan.getId(),
                        loan.getLoanNumber(),
                        hash
                )
        );
    }

    public static class HashResponse {

        private final Long loanId;
        private final String loanNumber;
        private final String recordHash;

        public HashResponse(
                Long loanId,
                String loanNumber,
                String recordHash) {

            this.loanId = loanId;
            this.loanNumber = loanNumber;
            this.recordHash = recordHash;
        }

        public Long getLoanId() {
            return loanId;
        }

        public String getLoanNumber() {
            return loanNumber;
        }

        public String getRecordHash() {
            return recordHash;
        }
    }

    public static class ErrorResponse {

        private final String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }
}
