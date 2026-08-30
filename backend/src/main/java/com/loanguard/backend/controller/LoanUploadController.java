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
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/loans")
@CrossOrigin(origins = "http://localhost:5173")
public class LoanUploadController {

    private final LoanRepository loanRepository;
    private final LoanValidationService validationService;
    private final AuditLogService auditLogService;

    public LoanUploadController(
            LoanRepository loanRepository,
            LoanValidationService validationService,
            AuditLogService auditLogService) {

        this.loanRepository = loanRepository;
        this.validationService = validationService;
        this.auditLogService = auditLogService;
    }

    // =========================================================
    // UPLOAD LOAN TAPE
    // =========================================================

    @PostMapping("/upload")
    public ResponseEntity<?> uploadLoanTape(
            @RequestParam("file") MultipartFile file) {

        // -----------------------------------------------------
        // BASIC FILE VALIDATION
        // -----------------------------------------------------

        if (file == null || file.isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "Please upload a CSV file."
                    ));
        }

        String originalFilename =
                file.getOriginalFilename();

        if (originalFilename == null ||
                !originalFilename
                        .toLowerCase(Locale.ROOT)
                        .endsWith(".csv")) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "Only CSV files are supported."
                    ));
        }

        // -----------------------------------------------------
        // RESULT COLLECTIONS
        // -----------------------------------------------------

        List<Map<String, Object>> importedLoans =
                new ArrayList<>();

        List<Map<String, Object>> errors =
                new ArrayList<>();

        int totalRows = 0;

        try (
                BufferedReader reader =
                        new BufferedReader(
                                new InputStreamReader(
                                        file.getInputStream(),
                                        StandardCharsets.UTF_8
                                )
                        )
        ) {

            // -------------------------------------------------
            // READ HEADER
            // -------------------------------------------------

            String headerLine =
                    reader.readLine();

            if (headerLine == null ||
                    headerLine.isBlank()) {

                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "message",
                                "CSV file is empty."
                        ));
            }

            List<String> headers =
                    parseCsvLine(headerLine);

            if (headers.isEmpty()) {

                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "message",
                                "CSV header could not be read."
                        ));
            }

            // -------------------------------------------------
            // NORMALIZE HEADERS
            // -------------------------------------------------

            List<String> normalizedHeaders =
                    new ArrayList<>();

            for (String header : headers) {

                normalizedHeaders.add(
                        normalizeColumn(header)
                );
            }

            // -------------------------------------------------
            // READ EACH ROW
            // -------------------------------------------------

            int rowNumber = 1;

            String line;

            while ((line = reader.readLine()) != null) {

                rowNumber++;

                if (line.isBlank()) {
                    continue;
                }

                totalRows++;

                try {

                    // -----------------------------------------
                    // PARSE CSV ROW
                    // -----------------------------------------

                    List<String> values =
                            parseCsvLine(line);

                    Map<String, String> row =
                            new HashMap<>();

                    for (
                            int i = 0;
                            i < normalizedHeaders.size();
                            i++
                    ) {

                        String key =
                                normalizedHeaders.get(i);

                        String value =
                                i < values.size()
                                        ? values.get(i).trim()
                                        : "";

                        row.put(key, value);
                    }

                    // -----------------------------------------
                    // CREATE LOAN
                    // -----------------------------------------

                    Loan loan =
                            createLoanFromRow(row);

                    // -----------------------------------------
                    // DUPLICATE CHECK
                    // -----------------------------------------

                    String loanNumber =
                            loan.getLoanNumber();

                    if (loanNumber != null &&
                            !loanNumber.isBlank() &&
                            loanRepository
                                    .findByLoanNumber(
                                            loanNumber
                                    )
                                    .isPresent()) {

                        throw new IllegalArgumentException(
                                "Loan number already exists: "
                                        + loanNumber
                        );
                    }

                    // -----------------------------------------
                    // RUN VALIDATION
                    // -----------------------------------------

                    ValidationResult validation =
                            validationService.validate(loan);

                    // -----------------------------------------
                    // STORE VALIDATION RESULT
                    // -----------------------------------------

                    loan.setValidationErrorCount(
                            validation.getErrorCount()
                    );

                    /*
                     * Imported records begin in PENDING state.
                     *
                     * The reviewer can later approve,
                     * reject, or mark the record for review.
                     *
                     * If validation has issues, we use
                     * NEEDS_REVIEW because the record already
                     * contains known data-quality problems.
                     */

                    if (validation.isValid()) {

                        loan.setVerificationStatus(
                                VerificationStatus.PENDING
                        );

                    } else {

                        loan.setVerificationStatus(
                                VerificationStatus.NEEDS_REVIEW
                        );
                    }

                    // -----------------------------------------
                    // SAVE LOAN
                    // -----------------------------------------

                    Loan savedLoan =
                            loanRepository.save(loan);

                    // -----------------------------------------
                    // AUDIT LOG
                    // -----------------------------------------

                    String auditMessage;

                    if (validation.isValid()) {

                        auditMessage =
                                "Loan record imported from CSV. "
                                        + "Initial validation passed.";

                    } else {

                        auditMessage =
                                "Loan record imported from CSV "
                                        + "with "
                                        + validation.getErrorCount()
                                        + " validation issue(s). "
                                        + "Record requires review.";
                    }

                    auditLogService.log(
                            savedLoan,
                            "RECORD_CREATED",
                            auditMessage,
                            "SYSTEM"
                    );

                    // -----------------------------------------
                    // BUILD SUCCESS RESPONSE
                    // -----------------------------------------

                    Map<String, Object> result =
                            new LinkedHashMap<>();

                    result.put(
                            "row",
                            rowNumber
                    );

                    result.put(
                            "loanId",
                            savedLoan.getId()
                    );

                    result.put(
                            "loanNumber",
                            savedLoan.getLoanNumber()
                    );

                    result.put(
                            "borrowerName",
                            savedLoan.getBorrowerName()
                    );

                    result.put(
                            "verificationStatus",
                            savedLoan.getVerificationStatus()
                    );

                    result.put(
                            "validationErrorCount",
                            savedLoan
                                    .getValidationErrorCount()
                    );

                    result.put(
                            "validationPassed",
                            validation.isValid()
                    );

                    result.put(
                            "issues",
                            validation.getIssues()
                    );

                    importedLoans.add(result);

                } catch (Exception e) {

                    // -----------------------------------------
                    // FAILED ROW
                    // -----------------------------------------

                    Map<String, Object> error =
                            new LinkedHashMap<>();

                    error.put(
                            "row",
                            rowNumber
                    );

                    error.put(
                            "error",
                            getSafeErrorMessage(e)
                    );

                    errors.add(error);
                }
            }

            // -------------------------------------------------
            // BUILD FINAL RESPONSE
            // -------------------------------------------------

            Map<String, Object> response =
                    new LinkedHashMap<>();

            response.put(
                    "fileName",
                    originalFilename
            );

            response.put(
                    "totalRows",
                    totalRows
            );

            response.put(
                    "importedRows",
                    importedLoans.size()
            );

            response.put(
                    "failedRows",
                    errors.size()
            );

            response.put(
                    "loans",
                    importedLoans
            );

            response.put(
                    "errors",
                    errors
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(
                            Map.of(
                                    "message",
                                    "Failed to process CSV file.",
                                    "error",
                                    getSafeErrorMessage(e)
                            )
                    );
        }
    }

    // =========================================================
    // CREATE LOAN FROM CSV ROW
    // =========================================================

    private Loan createLoanFromRow(
            Map<String, String> row) {

        Loan loan = new Loan();

        // -----------------------------------------------------
        // LOAN NUMBER
        // -----------------------------------------------------

        loan.setLoanNumber(
                getValue(
                        row,
                        "loannumber",
                        "loanid",
                        "loannumberid",
                        "loan_number"
                )
        );

        // -----------------------------------------------------
        // BORROWER NAME
        // -----------------------------------------------------

        loan.setBorrowerName(
                getValue(
                        row,
                        "borrowername",
                        "borrower",
                        "borrower_name",
                        "customername",
                        "customer"
                )
        );

        // -----------------------------------------------------
        // ORIGINAL LOAN AMOUNT
        // -----------------------------------------------------

        loan.setOriginalLoanAmount(
                parseDecimal(
                        getValue(
                                row,
                                "originalloanamount",
                                "originalamount",
                                "original_loan_amount",
                                "principal",
                                "loanamount",
                                "loan_amount"
                        )
                )
        );

        // -----------------------------------------------------
        // CURRENT BALANCE
        // -----------------------------------------------------

        loan.setCurrentBalance(
                parseDecimal(
                        getValue(
                                row,
                                "currentbalance",
                                "balance",
                                "current_balance",
                                "outstandingbalance",
                                "outstanding_balance"
                        )
                )
        );

        // -----------------------------------------------------
        // INTEREST RATE
        // -----------------------------------------------------

        loan.setInterestRate(
                parseDecimal(
                        getValue(
                                row,
                                "interestrate",
                                "rate",
                                "interest_rate",
                                "interest"
                        )
                )
        );

        // -----------------------------------------------------
        // LOAN TERM
        // -----------------------------------------------------

        loan.setLoanTermMonths(
                parseInteger(
                        getValue(
                                row,
                                "loantermmonths",
                                "term",
                                "loan_term_months",
                                "loanterm",
                                "termmonths"
                        )
                )
        );

        // -----------------------------------------------------
        // ORIGINATION DATE
        // -----------------------------------------------------

        loan.setOriginationDate(
                parseDate(
                        getValue(
                                row,
                                "originationdate",
                                "origination_date",
                                "startdate",
                                "start_date"
                        )
                )
        );

        // -----------------------------------------------------
        // MATURITY DATE
        // -----------------------------------------------------

        loan.setMaturityDate(
                parseDate(
                        getValue(
                                row,
                                "maturitydate",
                                "maturity_date",
                                "enddate",
                                "end_date"
                        )
                )
        );

        // -----------------------------------------------------
        // LOAN STATUS
        // -----------------------------------------------------

        loan.setLoanStatus(
                getValue(
                        row,
                        "loanstatus",
                        "status",
                        "loan_status"
                )
        );

        // -----------------------------------------------------
        // DATA SOURCE
        // -----------------------------------------------------

        loan.setDataSource("CSV");

        return loan;
    }

    // =========================================================
    // NORMALIZE COLUMN NAME
    // =========================================================

    private String normalizeColumn(
            String column) {

        if (column == null) {
            return "";
        }

        return column
                .trim()
                .toLowerCase(Locale.ROOT)
                .replace("\uFEFF", "")
                .replace(" ", "")
                .replace("-", "")
                .replace("_", "");
    }

    // =========================================================
    // GET VALUE
    // =========================================================

    private String getValue(
            Map<String, String> row,
            String... possibleNames) {

        for (String name : possibleNames) {

            String normalizedName =
                    normalizeColumn(name);

            String value =
                    row.get(normalizedName);

            if (value != null &&
                    !value.isBlank()) {

                return value.trim();
            }
        }

        return null;
    }

    // =========================================================
    // PARSE DECIMAL
    // =========================================================

    private BigDecimal parseDecimal(
            String value) {

        if (value == null ||
                value.isBlank()) {

            return null;
        }

        String cleaned =
                value
                        .replace("$", "")
                        .replace("₹", "")
                        .replace("%", "")
                        .replace(",", "")
                        .trim();

        if (cleaned.isBlank()) {
            return null;
        }

        return new BigDecimal(cleaned);
    }

    // =========================================================
    // PARSE INTEGER
    // =========================================================

    private Integer parseInteger(
            String value) {

        if (value == null ||
                value.isBlank()) {

            return null;
        }

        String cleaned =
                value
                        .replace(",", "")
                        .trim();

        return Integer.parseInt(cleaned);
    }

    // =========================================================
    // PARSE DATE
    // =========================================================

    private LocalDate parseDate(
            String value) {

        if (value == null ||
                value.isBlank()) {

            return null;
        }

        String cleaned =
                value.trim();

        /*
         * Current expected format:
         *
         * yyyy-MM-dd
         *
         * Example:
         * 2025-01-15
         */

        return LocalDate.parse(cleaned);
    }

    // =========================================================
    // SIMPLE CSV PARSER
    // =========================================================

    private List<String> parseCsvLine(
            String line) {

        List<String> values =
                new ArrayList<>();

        StringBuilder current =
                new StringBuilder();

        boolean insideQuotes = false;

        for (int i = 0; i < line.length(); i++) {

            char character =
                    line.charAt(i);

            if (character == '"') {

                /*
                 * Handle escaped quote:
                 *
                 * ""
                 */

                if (insideQuotes &&
                        i + 1 < line.length() &&
                        line.charAt(i + 1) == '"') {

                    current.append('"');
                    i++;

                } else {

                    insideQuotes =
                            !insideQuotes;
                }

            } else if (
                    character == ',' &&
                    !insideQuotes) {

                values.add(
                        current.toString()
                );

                current.setLength(0);

            } else {

                current.append(character);
            }
        }

        values.add(
                current.toString()
        );

        return values;
    }

    // =========================================================
    // SAFE ERROR MESSAGE
    // =========================================================

    private String getSafeErrorMessage(
            Exception exception) {

        String message =
                exception.getMessage();

        if (message == null ||
                message.isBlank()) {

            return exception
                    .getClass()
                    .getSimpleName();
        }

        return message;
    }
}