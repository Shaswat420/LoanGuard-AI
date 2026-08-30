package com.loanguard.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "audit_logs",
    indexes = {
        @Index(name = "idx_audit_loan_id", columnList = "loan_id"),
        @Index(name = "idx_audit_event_type", columnList = "event_type"),
        @Index(name = "idx_audit_created_at", columnList = "created_at")
    }
)
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "loan_id", nullable = false)
    private Long loanId;

    @Column(name = "loan_number", length = 100)
    private String loanNumber;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "actor", length = 100)
    private String actor;

    @Column(name = "record_hash", length = 128)
    private String recordHash;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getLoanId() {
        return loanId;
    }

    public void setLoanId(Long loanId) {
        this.loanId = loanId;
    }

    public String getLoanNumber() {
        return loanNumber;
    }

    public void setLoanNumber(String loanNumber) {
        this.loanNumber = loanNumber;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getActor() {
        return actor;
    }

    public void setActor(String actor) {
        this.actor = actor;
    }

    public String getRecordHash() {
        return recordHash;
    }

    public void setRecordHash(String recordHash) {
        this.recordHash = recordHash;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
