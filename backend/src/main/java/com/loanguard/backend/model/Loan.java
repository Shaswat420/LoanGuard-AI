package com.loanguard.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "loans",
    indexes = {
        @Index(name = "idx_loan_number", columnList = "loan_number"),
        @Index(name = "idx_verification_status", columnList = "verification_status"),
        @Index(name = "idx_loan_status", columnList = "loan_status")
    }
)
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "loan_number", nullable = false, unique = true, length = 100)
    private String loanNumber;

    @Column(name = "borrower_name", length = 255)
    private String borrowerName;

    @Column(name = "original_loan_amount", precision = 15, scale = 2)
    private BigDecimal originalLoanAmount;

    @Column(name = "current_balance", precision = 15, scale = 2)
    private BigDecimal currentBalance;

    @Column(name = "interest_rate", precision = 8, scale = 4)
    private BigDecimal interestRate;

    @Column(name = "loan_term_months")
    private Integer loanTermMonths;

    @Column(name = "origination_date")
    private LocalDate originationDate;

    @Column(name = "maturity_date")
    private LocalDate maturityDate;

    @Column(name = "loan_status", length = 50)
    private String loanStatus;

    @Column(name = "data_source", length = 100)
    private String dataSource;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 30)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "validation_error_count", nullable = false)
    private Integer validationErrorCount = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;

        if (verificationStatus == null) {
            verificationStatus = VerificationStatus.PENDING;
        }

        if (validationErrorCount == null) {
            validationErrorCount = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLoanNumber() {
        return loanNumber;
    }

    public void setLoanNumber(String loanNumber) {
        this.loanNumber = loanNumber;
    }

    public String getBorrowerName() {
        return borrowerName;
    }

    public void setBorrowerName(String borrowerName) {
        this.borrowerName = borrowerName;
    }

    public BigDecimal getOriginalLoanAmount() {
        return originalLoanAmount;
    }

    public void setOriginalLoanAmount(BigDecimal originalLoanAmount) {
        this.originalLoanAmount = originalLoanAmount;
    }

    public BigDecimal getCurrentBalance() {
        return currentBalance;
    }

    public void setCurrentBalance(BigDecimal currentBalance) {
        this.currentBalance = currentBalance;
    }

    public BigDecimal getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(BigDecimal interestRate) {
        this.interestRate = interestRate;
    }

    public Integer getLoanTermMonths() {
        return loanTermMonths;
    }

    public void setLoanTermMonths(Integer loanTermMonths) {
        this.loanTermMonths = loanTermMonths;
    }

    public LocalDate getOriginationDate() {
        return originationDate;
    }

    public void setOriginationDate(LocalDate originationDate) {
        this.originationDate = originationDate;
    }

    public LocalDate getMaturityDate() {
        return maturityDate;
    }

    public void setMaturityDate(LocalDate maturityDate) {
        this.maturityDate = maturityDate;
    }

    public String getLoanStatus() {
        return loanStatus;
    }

    public void setLoanStatus(String loanStatus) {
        this.loanStatus = loanStatus;
    }

    public String getDataSource() {
        return dataSource;
    }

    public void setDataSource(String dataSource) {
        this.dataSource = dataSource;
    }

    public VerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(VerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public Integer getValidationErrorCount() {
        return validationErrorCount;
    }

    public void setValidationErrorCount(Integer validationErrorCount) {
        this.validationErrorCount = validationErrorCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}