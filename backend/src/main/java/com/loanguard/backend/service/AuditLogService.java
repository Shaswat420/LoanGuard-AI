package com.loanguard.backend.service;

import com.loanguard.backend.model.AuditLog;
import com.loanguard.backend.model.Loan;
import com.loanguard.backend.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(
            AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public AuditLog log(
            Loan loan,
            String eventType,
            String description,
            String actor) {

        AuditLog log = new AuditLog();

        log.setLoanId(loan.getId());
        log.setLoanNumber(loan.getLoanNumber());
        log.setEventType(eventType);
        log.setDescription(description);
        log.setActor(actor);
        log.setRecordHash(generateHash(loan));

        return auditLogRepository.save(log);
    }

    public List<AuditLog> getLoanAudit(Long loanId) {
        return auditLogRepository
                .findByLoanIdOrderByCreatedAtAsc(loanId);
    }

    public String generateHash(Loan loan) {

        String canonicalData =
                safe(loan.getLoanNumber()) + "|" +
                safe(loan.getBorrowerName()) + "|" +
                safe(loan.getOriginalLoanAmount()) + "|" +
                safe(loan.getCurrentBalance()) + "|" +
                safe(loan.getInterestRate()) + "|" +
                safe(loan.getLoanTermMonths()) + "|" +
                safe(loan.getOriginationDate()) + "|" +
                safe(loan.getMaturityDate()) + "|" +
                safe(loan.getLoanStatus()) + "|" +
                safe(loan.getDataSource()) + "|" +
                safe(loan.getVerificationStatus());

        try {
            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash =
                    digest.digest(
                            canonicalData.getBytes(
                                    StandardCharsets.UTF_8
                            )
                    );

            StringBuilder hex = new StringBuilder();

            for (byte b : hash) {
                hex.append(
                        String.format("%02x", b)
                );
            }

            return hex.toString();

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Unable to generate record hash",
                    e
            );
        }
    }

    private String safe(Object value) {
        return value == null ? "" : value.toString();
    }
}
