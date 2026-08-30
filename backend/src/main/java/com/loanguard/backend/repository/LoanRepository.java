package com.loanguard.backend.repository;

import com.loanguard.backend.model.Loan;
import com.loanguard.backend.model.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LoanRepository
        extends JpaRepository<Loan, Long> {

    Optional<Loan> findByLoanNumber(String loanNumber);

    List<Loan> findByVerificationStatus(
            VerificationStatus verificationStatus
    );

    List<Loan> findByValidationErrorCountGreaterThan(
            Integer count
    );
}