package com.loanguard.backend.controller;

import com.loanguard.backend.model.Loan;
import com.loanguard.backend.model.LoanRiskAssessment;
import com.loanguard.backend.repository.LoanRepository;
import com.loanguard.backend.service.LoanRiskService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/risk")
@CrossOrigin(origins = "http://localhost:5173")
public class RiskController {

    private final LoanRepository loanRepository;
    private final LoanRiskService loanRiskService;

    public RiskController(
            LoanRepository loanRepository,
            LoanRiskService loanRiskService) {

        this.loanRepository = loanRepository;
        this.loanRiskService = loanRiskService;
    }

    // =========================================================
    // GET RISK ASSESSMENT
    // =========================================================

    @GetMapping("/loans/{id}")
    public ResponseEntity<?> getLoanRisk(
            @PathVariable Long id) {

        Optional<Loan> optionalLoan =
                loanRepository.findById(id);

        if (optionalLoan.isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            message("Loan not found")
                    );
        }

        Loan loan = optionalLoan.get();

        LoanRiskAssessment assessment =
                loanRiskService.assessRisk(loan);

        return ResponseEntity.ok(assessment);
    }

    // =========================================================
    // HELPER
    // =========================================================

    private Map<String, String> message(
            String text) {

        Map<String, String> response =
                new HashMap<>();

        response.put("message", text);

        return response;
    }
}