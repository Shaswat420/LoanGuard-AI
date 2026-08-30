package com.loanguard.backend.repository;

import com.loanguard.backend.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByLoanIdOrderByCreatedAtAsc(Long loanId);
}
