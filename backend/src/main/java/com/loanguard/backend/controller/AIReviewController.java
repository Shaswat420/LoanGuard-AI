package com.loanguard.backend.controller;

import com.loanguard.backend.model.AIReviewResponse;
import com.loanguard.backend.model.Loan;
import com.loanguard.backend.repository.LoanRepository;
import com.loanguard.backend.service.AIReviewService;
import com.loanguard.backend.service.AuditLogService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ai-review")
@CrossOrigin(origins = "http://localhost:5173")
public class AIReviewController {

    private final LoanRepository loanRepository;
    private final AIReviewService aiReviewService;
    private final AuditLogService auditLogService;

    public AIReviewController(
            LoanRepository loanRepository,
            AIReviewService aiReviewService,
            AuditLogService auditLogService) {

        this.loanRepository = loanRepository;
        this.aiReviewService = aiReviewService;
        this.auditLogService = auditLogService;
    }

    // =========================================================
    // AI REVIEW LOAN
    // =========================================================

    @PostMapping("/loans/{id}")
    public ResponseEntity<?> reviewLoan(
            @PathVariable Long id) {

        Optional<Loan> optionalLoan =
                loanRepository.findById(id);

        if (optionalLoan.isEmpty()) {

            Map<String, String> response =
                    new HashMap<>();

            response.put(
                    "message",
                    "Loan not found"
            );

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(response);
        }

        Loan loan = optionalLoan.get();

        AIReviewResponse result =
                aiReviewService.reviewLoan(loan);

        // -----------------------------------------------------
        // IMPORTANT:
        //
        // AI does NOT modify the loan.
        // It only generates a recommendation.
        // -----------------------------------------------------

        auditLogService.log(
                loan,
                "AI_RECOMMENDATION_GENERATED",
                "AI review generated a "
                        + result.getRecommendation()
                        + " recommendation with "
                        + result.getSeverity()
                        + " severity.",
                "AI"
        );

        return ResponseEntity.ok(result);
    }
}