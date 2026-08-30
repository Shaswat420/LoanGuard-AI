# LoanGuard AI

## AI-Powered Loan Data Verification & Review Platform

LoanGuard AI is a full-stack loan data verification platform that helps financial teams transform loan records into validated, reviewable, traceable, and trusted records.

The system combines automated loan validation, exception detection, AI-assisted review, risk analysis, human approval, verification, and audit tracking into a single workflow.

---

## Overview

Loan data can arrive from CSV files and operational systems with missing values, inconsistent financial information, or validation issues.

LoanGuard AI provides an end-to-end workflow:

```text
Loan Data / CSV
       |
       v
Data Ingestion
       |
       v
Loan Records
       |
       v
Validation Engine
       |
       +-------------------------+
       |                         |
       v                         v
   Valid Loan              Validation Exception
       |                         |
       |                         v
       |                    AI Copilot
       |                         |
       |                         v
       |                    AI Review
       |                         |
       |                         v
       |                   Human Reviewer
       |                         |
       +------------+------------+
                    |
                    v
              Re-validation
                    |
                    v
             Reviewer Decision
                    |
             +------+------+
             |             |
             v             v
          VERIFIED      REJECTED
             |
             v
         Audit Trail
The core principle of LoanGuard AI is:
AI assists the reviewer; it does not silently replace the reviewer.
Key Features
1. Loan Data Ingestion
LoanGuard AI supports importing loan records from CSV loan tapes.
The ingestion workflow includes:
CSV upload
Loan record creation
Data-source tracking
Initial validation
Error detection
Review status assignment
2. Loan Management
Users can view and manage loan records containing information such as:
Loan ID
Loan number
Borrower name
Original loan amount
Current balance
Interest rate
Loan term
Origination date
Maturity date
Loan status
Data source
Verification status
Validation error count
3. Validation Engine
The validation engine checks loan records against configured business rules.
One example rule is:
Current Balance <= Original Loan Amount
For example:
Original Loan Amount = 600000
Current Balance      = 615000
The system detects:
BALANCE_EXCEEDS_ORIGINAL
with:
Severity: HIGH
and blocks approval until the issue is resolved.
After correction:
Current Balance = 590000
the loan can pass validation.
Example successful validation response:
{
  "valid": true,
  "loanNumber": "LN-2026-004",
  "issues": [],
  "loanId": 36,
  "errorCount": 0
}
4. Exception Management
Loans that fail validation are placed into the exception workflow.
The Exceptions page provides information such as:
Loan number
Borrower
Verification status
Validation error count
Validation rule
Field causing the problem
Actual value
Expected value
Severity
Error message
Example:
Loan:
LN-2026-004

Borrower:
Neha Kapoor

Rule:
BALANCE_EXCEEDS_ORIGINAL

Field:
currentBalance

Actual:
615000

Expected:
<= 600000

Severity:
HIGH
Reviewers can open the affected loan and perform the required correction/review workflow.
5. AI Review
LoanGuard AI includes an AI-assisted loan review engine.
The AI review evaluates:
Validation status
Validation issues
Risk level
Risk score
Severity
Recommended action
Suggested corrections
Reviewer guidance
Example response:
{
  "loanId": 36,
  "loanNumber": "LN-2026-004",
  "severity": "LOW",
  "recommendation": "APPROVE",
  "model": "LoanGuard-Rules-v1"
}
The AI recommendation is separate from the final reviewer decision.
6. AI Copilot
LoanGuard AI provides an interactive loan-focused AI Copilot.
The Copilot can answer questions related to the selected loan, including:
Can I approve this loan?

What are the exceptions?

Explain the risk.

Why is this loan pending?

What should I fix before approval?

Summarize this loan.
Example Copilot request:
POST /api/copilot/loans/{id}
Request:
{
  "question": "Can I approve this loan?"
}
Example response:
{
  "loanId": 36,
  "loanNumber": "LN-2026-004",
  "intent": "APPROVAL_READINESS",
  "answer": "The loan has passed all configured validation checks and is eligible for reviewer approval.",
  "recommendation": "APPROVE",
  "severity": "LOW",
  "riskScore": 25,
  "riskLevel": "LOW",
  "validationPassed": true,
  "validationErrorCount": 0,
  "sources": [
    "Loan record",
    "Validation engine",
    "Risk engine"
  ]
}
The Copilot is designed to support reviewers with contextual analysis rather than automatically approving loans.
7. Risk Analysis
LoanGuard AI includes a risk analysis layer.
Risk assessments include:
Risk score
Risk level
Risk classification
Review recommendation
Example:
Risk Level:
LOW

Risk Score:
25 / 100

Recommendation:
APPROVE
Risk information is presented alongside validation and review information.
8. Human-in-the-Loop Approval
LoanGuard AI maintains a separation between:
AI Recommendation
and:
Human Reviewer Decision
The workflow is:
Validation
    |
    v
AI Analysis
    |
    v
AI Recommendation
    |
    v
Human Reviewer
    |
    +---- Approve
    |
    +---- Reject
    |
    +---- Correct
          |
          v
      Re-validation
A loan containing validation issues cannot be approved.
Example:
Validation Error
      |
      v
Approval Blocked
After correction:
Validation Passed
      |
      v
Reviewer Approval Allowed
9. Verified Records
A loan becomes verified after successful validation and authorized reviewer approval.
Example:
{
  "loanNumber": "LN-2026-004",
  "borrowerName": "Neha Kapoor",
  "originalLoanAmount": 600000,
  "currentBalance": 590000,
  "validationErrorCount": 0,
  "verificationStatus": "VERIFIED"
}
The verified state represents a loan that has successfully passed the configured verification workflow.
10. Audit Trail
LoanGuard AI maintains an audit history for loan activity.
Audit events include information such as:
Event type
Actor
Timestamp
Loan ID
Loan number
Description
Record hash
Examples of events include:
RECORD_CREATED
VALIDATION_RUN
AI_RECOMMENDATION_GENERATED
RECORD_APPROVED
Example workflow:
RECORD_CREATED
       |
       v
VALIDATION_RUN
       |
       v
AI_RECOMMENDATION_GENERATED
       |
       v
VALIDATION_RUN
       |
       v
RECORD_APPROVED
This provides traceability throughout the loan verification lifecycle.
11. Record Hashing
Audit events include record hashes to help track the state of loan records during the verification lifecycle.
Example:
recordHash:
bd126b0a33b208e7...
Hashes are associated with audit events and can be used for traceability.
12. Dashboard
The LoanGuard AI dashboard provides an overview of the loan verification environment.
The dashboard provides navigation to:
Overview
Loan Records
Exceptions
AI Copilot
Audit Trail
Analytics
Upload Loan Tape
Reviewer workflow
The application uses a dark-themed interface designed for financial-data review.
13. Analytics
The Analytics section provides portfolio and verification insights.
It provides visibility into areas such as:
Loan portfolio
Verification status
Validation issues
Risk information
Loan exposure
Data quality
The Analytics page is intended to provide an operational overview of the current loan dataset.
14. Authentication & Security
LoanGuard AI uses Spring Security and JWT-based authentication.
Protected API requests use:
Authorization: Bearer <JWT_TOKEN>
The authentication system includes:
Login
JWT token generation
JWT authentication
Protected backend endpoints
Authenticated frontend API requests
Technology Stack
Frontend
React
TypeScript
Vite
React Router
CSS
Backend
Java 24
Spring Boot 4.1.1
Spring Web MVC
Spring Data JPA
Spring Security
Spring Validation
Authentication
JWT
JJWT 0.12.6
Database
PostgreSQL
Project Architecture
                    +----------------------+
                    |      React UI        |
                    |     TypeScript       |
                    +----------+-----------+
                               |
                               | REST API
                               v
                    +----------------------+
                    |   Spring Boot API    |
                    +----------+-----------+
                               |
             +-----------------+------------------+
             |                 |                  |
             v                 v                  v
      Validation          AI / Risk          Reviewer
        Engine             Engine             Workflow
             |                 |                  |
             +-----------------+------------------+
                               |
                               v
                    +----------------------+
                    |      JPA Layer       |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |     PostgreSQL        |
                    +----------------------+
                               |
                               v
                    +----------------------+
                    |     Audit Trail      |
                    +----------------------+
Backend Structure
backend/
└── src/
    └── main/
        └── java/
            └── com/
                └── loanguard/
                    └── backend/
                        ├── config/
                        ├── controller/
                        ├── dto/
                        ├── model/
                        ├── repository/
                        ├── security/
                        └── service/
Controllers
AuthController
LoanController
LoanUploadController
VerificationController
ReviewerController
AIReviewController
CopilotController
RiskController
AuditController
Services
AuthService
LoanValidationService
LoanRiskService
LoanRiskScoringService
AIReviewService
CopilotService
AuditLogService
Frontend Structure
frontend/
└── src/
    ├── api/
    ├── assets/
    └── pages/
        ├── Login
        ├── Dashboard
        ├── LoanDashboard
        ├── LoanRecords
        ├── AddLoan
        ├── UploadLoanTape
        ├── Exceptions
        ├── Reviewer
        ├── Copilot
        ├── Analytics
        └── Audit
Important API Endpoints
Authentication
POST /api/auth/login
Loans
GET /api/loans
GET /api/loans/{id}
Validation
POST /api/loans/{id}/validate
Exceptions
GET /api/exceptions
Verified Loans
GET /api/verified-loans
GET /api/verified-loans/{id}
AI Review
POST /api/ai-review/loans/{id}
AI Copilot
POST /api/copilot/loans/{id}
Reviewer
GET /api/reviewer/loans/{id}
POST /api/reviewer/loans/{id}/approve
Risk
GET /api/risk/loans/{id}
Audit
GET /api/audit/loans/{id}
GET /api/audit/loans/{id}/hash
Getting Started
Prerequisites
Make sure the following are installed:
Java 24
Node.js
npm
PostgreSQL
Git
Backend Setup
Navigate to:
cd ~/LoanGuard-AI/backend
Run the backend using Maven Wrapper:
./mvnw spring-boot:run
The backend runs on:
http://localhost:8082
Frontend Setup
Navigate to:
cd ~/LoanGuard-AI/frontend
Install dependencies:
npm install
Start the development server:
npm run dev
Vite will display the frontend URL in the terminal.
Production Build
To create the frontend production build:
cd ~/LoanGuard-AI/frontend
npm run build
To build the backend:
cd ~/LoanGuard-AI/backend
./mvnw clean package
Test Credentials
For local demonstration:
Email:
admin@loanguard.com

Password:
Admin@123
These credentials are intended for local/demo use.
Do not use demo credentials or hard-coded secrets in a production deployment.
Example End-to-End Workflow
A complete LoanGuard AI verification workflow can be demonstrated using a loan that contains a validation issue.
Example:
LN-2026-004
Neha Kapoor
Initial state:
Original Loan Amount:
600000

Current Balance:
615000
The validation engine detects:
BALANCE_EXCEEDS_ORIGINAL
The loan requires review.
The reviewer can use AI Copilot to ask:
Why did this loan fail?
or:
What should I fix before approval?
The value can then be corrected:
615000
   ↓
590000
Validation is run again:
valid = true
errorCount = 0
AI review can then provide:
Recommendation:
APPROVE

Risk:
LOW

Risk Score:
25 / 100
The authorized reviewer makes the final decision.
After approval:
verificationStatus = VERIFIED
The Audit Trail records the important events throughout the process.
Core Design Principles
Validation First
Loan records should pass validation before approval.
AI-Assisted
AI provides analysis, explanations, risk information, and recommendations.
Human Controlled
Final approval remains with an authorized reviewer.
Traceable
Important workflow events are recorded in the audit trail.
Explainable
Validation failures and AI recommendations should be understandable to reviewers.
Verified
Only successfully reviewed records can reach the verified state.
Demo Flow
The recommended demonstration sequence is:
1. Login
      |
2. Upload Loan Tape
      |
3. View Imported Loans
      |
4. Run / View Validation
      |
5. Open Exception
      |
6. Ask AI Copilot
      |
7. Correct Loan Data
      |
8. Re-run Validation
      |
9. Run AI Review
      |
10. Reviewer Approval
      |
11. VERIFIED
      |
12. Open Audit Trail
      |
13. View Analytics
Project Structure
LoanGuard-AI/
│
├── backend/
│   ├── pom.xml
│   ├── mvnw
│   └── src/
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│
├── .gitignore
└── start-backend.sh
Project Status
Current implementation includes:
 Authentication
 JWT security
 Loan management
 CSV loan ingestion
 Loan validation
 Exception management
 Risk analysis
 AI review
 AI Copilot
 Human reviewer workflow
 Loan correction and re-validation
 Verified loan records
 Audit trail
 Record hashing
 Dashboard
 Analytics
 Dark-themed interface
Final Workflow
                LOANGUARD AI
                     |
                     v
              Loan Data Intake
                     |
                     v
                Validation
                     |
          +----------+----------+
          |                     |
          v                     v
       PASSED                FAILED
          |                     |
          |                     v
          |                 Exception
          |                     |
          |                     v
          |                AI Copilot
          |                     |
          |                     v
          |                 Correction
          |                     |
          |                     v
          |                Re-validation
          |                     |
          +----------+----------+
                     |
                     v
                AI Review
                     |
                     v
             Human Reviewer
                     |
              +------+------+
              |             |
              v             v
           APPROVE        REJECT
              |
              v
           VERIFIED
              |
              v
          AUDIT TRAIL
LoanGuard AI
Turn uncertain loan data into trusted, reviewable, and traceable records.