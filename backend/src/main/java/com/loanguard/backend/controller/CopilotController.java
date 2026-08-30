package com.loanguard.backend.controller;

import com.loanguard.backend.model.CopilotResponse;
import com.loanguard.backend.model.Loan;
import com.loanguard.backend.repository.LoanRepository;
import com.loanguard.backend.service.CopilotService;
import com.loanguard.backend.service.AuditLogService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/copilot")
@CrossOrigin(origins = "http://localhost:5173")
public class CopilotController {

    private final LoanRepository loanRepository;
    private final CopilotService copilotService;
    private final AuditLogService auditLogService;

    public CopilotController(
            LoanRepository loanRepository,
            CopilotService copilotService,
            AuditLogService auditLogService) {

        this.loanRepository = loanRepository;
        this.copilotService = copilotService;
        this.auditLogService = auditLogService;
    }

    // =========================================================
    // ASK COPILOT ABOUT A LOAN
    // =========================================================

    @PostMapping("/loans/{id}")
    public ResponseEntity<?> askCopilot(
            @PathVariable Long id,
            @RequestBody CopilotRequest request) {

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

        // -----------------------------------------------------
        // Validate request
        // -----------------------------------------------------

        if (request == null ||
                request.getQuestion() == null ||
                request.getQuestion().trim().isEmpty()) {

            Map<String, String> response =
                    new HashMap<>();

            response.put(
                    "message",
                    "Please enter a question."
            );

            return ResponseEntity
                    .badRequest()
                    .body(response);
        }

        Loan loan = optionalLoan.get();

        String question =
                request.getQuestion().trim();

        // -----------------------------------------------------
        // Generate contextual response
        // -----------------------------------------------------

        CopilotResponse result =
                copilotService.answer(
                        loan,
                        question
                );

        // -----------------------------------------------------
        // Audit Copilot interaction
        // -----------------------------------------------------

        auditLogService.log(
                loan,
                "COPILOT_QUERY",
                "Copilot answered a loan-specific question.",
                "AI"
        );

        return ResponseEntity.ok(result);
    }

    // =========================================================
    // REQUEST DTO
    // =========================================================

    public static class CopilotRequest {

        private String question;

        public CopilotRequest() {
        }

        public String getQuestion() {
            return question;
        }

        public void setQuestion(
                String question) {

            this.question = question;
        }
    }
}
