es. Create ARCHITECTURE.md and paste this complete file.
# LoanGuard AI — Architecture

## 1. System Overview

LoanGuard AI is a full-stack loan data verification and review platform.

The system accepts loan records through the application, validates the records using configurable business rules, identifies exceptions, provides AI-assisted analysis, calculates risk information, allows an authorized human reviewer to make the final decision, and records important workflow events in an audit trail.

The architecture follows a layered approach:

```text
+-------------------------------------------------------+
|                    React Frontend                     |
|                   TypeScript + Vite                   |
+---------------------------+---------------------------+
                            |
                            | REST / JSON
                            v
+-------------------------------------------------------+
|                Spring Boot REST API                   |
|                    Java 24                            |
+---------------------------+---------------------------+
                            |
          +-----------------+------------------+
          |                 |                  |
          v                 v                  v
+----------------+ +----------------+ +----------------+
| Validation     | | AI / Risk      | | Reviewer /    |
| Engine         | | Services       | | Verification  |
+----------------+ +----------------+ +----------------+
          |                 |                  |
          +-----------------+------------------+
                            |
                            v
+-------------------------------------------------------+
|                 Spring Data JPA                       |
+---------------------------+---------------------------+
                            |
                            v
+-------------------------------------------------------+
|                    PostgreSQL                         |
+-------------------------------------------------------+

                            |
                            v
+-------------------------------------------------------+
|                    Audit Trail                        |
|            Events + Actor + Timestamp + Hash          |
+-------------------------------------------------------+
2. Technology Stack
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
3. Frontend Architecture
The frontend is implemented using React and TypeScript.
The application uses React Router to provide navigation between the main workflows.
React Application
       |
       +-- Login
       |
       +-- Dashboard
       |
       +-- Loan Dashboard
       |
       +-- Loan Records
       |
       +-- Add Loan
       |
       +-- Upload Loan Tape
       |
       +-- Exceptions
       |
       +-- Reviewer
       |
       +-- AI Copilot
       |
       +-- Analytics
       |
       +-- Audit Trail
The frontend communicates with the backend through REST APIs.
Authentication tokens are sent with protected requests using:
Authorization: Bearer <JWT_TOKEN>
4. Frontend Pages
The current frontend contains the following major pages:
frontend/src/pages/

Login.tsx
Dashboard.tsx
LoanDashboard.tsx
LoanRecords.tsx
AddLoan.tsx
UploadLoanTape.tsx
Exceptions.tsx
Reviewer.tsx
Copilot.tsx
Analytics.tsx
Audit.tsx
Each page has a corresponding CSS file for presentation and UI styling.
5. Backend Architecture
The backend follows a layered Spring Boot architecture.
Controller
    |
    v
Service
    |
    v
Repository
    |
    v
PostgreSQL
Controllers expose REST APIs.
Services contain application and business logic.
Repositories provide database access through Spring Data JPA.
Models represent persisted domain entities and response structures.
6. Backend Package Structure
backend/src/main/java/com/loanguard/backend/

├── config/
├── controller/
├── dto/
├── model/
├── repository/
├── security/
└── service/
7. Controllers
The application contains the following controllers:
AuthController
LoanController
LoanUploadController
VerificationController
ReviewerController
AIReviewController
CopilotController
RiskController
AuditController
Responsibilities
AuthController
Handles authentication and login.
LoanController
Provides loan record APIs.
LoanUploadController
Handles loan data/CSV upload functionality.
VerificationController
Provides exception, verification, and verification-summary APIs.
ReviewerController
Handles reviewer-specific loan workflows and approval actions.
AIReviewController
Provides AI-assisted loan review functionality.
CopilotController
Provides the interactive loan-specific AI Copilot API.
RiskController
Provides loan risk information.
AuditController
Provides audit history and record-hash information.
8. Service Layer
The service layer contains the main application logic.
AuthService
LoanValidationService
LoanRiskService
LoanRiskScoringService
AIReviewService
CopilotService
AuditLogService
The service layer keeps business logic separate from HTTP controllers.
9. Authentication and Security
LoanGuard AI uses Spring Security with JWT authentication.
The authentication workflow is:
User
 |
 | Login credentials
 v
AuthController
 |
 v
AuthService
 |
 v
JWT Token
 |
 v
Frontend
 |
 | Bearer Token
 v
Protected API
 |
 v
JwtAuthenticationFilter
 |
 v
Authorized Request
Protected API endpoints require a valid authentication token.
The security layer contains:
SecurityConfig
JwtAuthenticationFilter
JwtService
10. Loan Data Model
A loan record contains information including:
id
loanNumber
borrowerName
originalLoanAmount
currentBalance
interestRate
loanTermMonths
loanStatus
originationDate
maturityDate
dataSource
validationErrorCount
verificationStatus
createdAt
updatedAt
The loan model represents the primary business record processed by the platform.
11. Data Ingestion Flow
Loan data can be uploaded through the loan tape upload workflow.
The ingestion process is:
CSV File
   |
   v
Upload API
   |
   v
Loan Upload Processing
   |
   v
Loan Records
   |
   v
Validation
   |
   +-------------------+
   |                   |
   v                   v
Valid               Exception
The source of the imported record is retained through the dataSource field.
12. Validation Architecture
The validation engine is implemented through:
LoanValidationService
The validation service evaluates loan records against configured business rules.
A validation result contains information such as:
valid
loanId
loanNumber
issues
errorCount
Each validation issue can contain:
rule
field
severity
message
actualValue
expectedValue
13. Example Validation Rule
One example of a financial consistency rule is:
Current Balance <= Original Loan Amount
Example invalid record:
Original Loan Amount = 600000
Current Balance      = 615000
The validation engine identifies the inconsistency and produces a validation issue.
After correction:
Current Balance = 590000
the same record can pass the validation rule.
14. Exception Workflow
Validation failures are exposed through the exception workflow.
Loan
 |
 v
Validation
 |
 +---- PASSED ----------------------+
 |                                  |
 |                                  v
 |                              Continue
 |
 +---- FAILED
        |
        v
     Exception
        |
        v
   Human Review
        |
        +---- Correct
        |       |
        |       v
        |   Re-validation
        |
        +---- Review / Decision
Exceptions contain the information necessary for a reviewer to understand why the loan requires attention.
15. AI Review Architecture
The AI review workflow is implemented through:
AIReviewController
        |
        v
AIReviewService
        |
        +---- Loan data
        |
        +---- Validation results
        |
        +---- Risk information
        |
        v
AI Review Response
The AI review can provide:
Summary
Severity
Explanation
Suggested Corrections
Reviewer Note
Recommendation
Risk Classification
Risk Score
The AI recommendation is not the final approval decision.
16. AI Copilot Architecture
The AI Copilot provides a conversational interface for loan-specific questions.
User
 |
 | Question
 v
React Copilot
 |
 | POST /api/copilot/loans/{id}
 v
CopilotController
 |
 v
CopilotService
 |
 +---- Loan data
 |
 +---- Validation information
 |
 +---- Risk information
 |
 v
CopilotResponse
 |
 v
React UI
The request format is:
{
  "question": "Can I approve this loan?"
}
The response contains structured information including:
loanId
loanNumber
intent
answer
recommendation
severity
riskScore
riskLevel
validationPassed
validationErrorCount
sources
17. AI Copilot Human Oversight
The Copilot is designed as an assistance layer.
AI
 |
 +---- Explain
 |
 +---- Analyze
 |
 +---- Summarize
 |
 +---- Recommend
 |
 +---- Suggest
 |
 v
Human Reviewer
 |
 +---- Approve
 +---- Reject
 +---- Correct
The AI does not silently modify loan records or automatically make the final reviewer decision.
The authorized reviewer remains responsible for the final decision.
18. Risk Architecture
Risk functionality is separated into risk services:
LoanRiskService
LoanRiskScoringService
The risk workflow is:
Loan
 |
 v
Risk Analysis
 |
 v
Risk Score
 |
 v
Risk Level
 |
 v
Review Recommendation
Example:
Risk Score: 25 / 100
Risk Level: LOW
Recommendation: APPROVE
Risk information is considered together with validation results.
19. Reviewer Workflow
The reviewer workflow is responsible for the final human decision.
Loan
 |
 v
Validation
 |
 v
AI Review
 |
 v
Reviewer
 |
 +----------+-----------+
 |          |           |
 v          v           v
Approve    Reject     Correct
                        |
                        v
                   Re-validation
Approval is blocked when the loan contains unresolved validation issues.
After successful validation, an authorized reviewer can approve the loan.
20. Verification Workflow
The verification lifecycle is:
IMPORTED
    |
    v
VALIDATION
    |
    +---- FAILED ---> NEEDS_REVIEW
    |
    v
VALID
    |
    v
AI REVIEW
    |
    v
HUMAN REVIEW
    |
    v
APPROVED
    |
    v
VERIFIED
The verification status is stored with the loan record.
21. Audit Architecture
Audit functionality is implemented through:
AuditController
AuditLogService
AuditLogRepository
AuditLog model
The audit workflow is:
Application Action
       |
       v
AuditLogService
       |
       v
Audit Event
       |
       v
PostgreSQL
Audit records contain information such as:
id
loanId
loanNumber
actor
eventType
description
createdAt
recordHash
22. Audit Events
Representative events include:
RECORD_CREATED
VALIDATION_RUN
AI_RECOMMENDATION_GENERATED
RECORD_APPROVED
The audit trail allows users to reconstruct important actions performed during the loan verification lifecycle.
23. Record Hashing
Audit records contain a recordHash.
The hash is associated with the state represented by the audit event.
The audit API also provides a dedicated endpoint for retrieving hash information.
GET /api/audit/loans/{id}/hash
This supports record traceability and integrity verification.
24. Database Architecture
LoanGuard AI uses PostgreSQL as its persistence layer.
Spring Data JPA provides the persistence abstraction.
Application
    |
    v
Spring Data JPA
    |
    v
PostgreSQL
The project includes repositories for:
LoanRepository
AuditLogRepository
UserRepository
25. Main Domain Models
The backend contains domain models including:
Loan
User
AuditLog
LoanRiskAssessment
AIReviewResponse
CopilotResponse
VerificationStatus
UserRole
These models represent the application's core domain and response structures.
26. API Architecture
The frontend communicates with the backend using REST APIs.
Major API groups include:
/api/auth
/api/loans
/api/exceptions
/api/verified-loans
/api/ai-review
/api/copilot
/api/reviewer
/api/risk
/api/audit
27. End-to-End Architecture
The complete business flow is:
                   +-------------+
                   |   CSV/Data  |
                   +------+------+
                          |
                          v
                  +---------------+
                  |   Ingestion   |
                  +-------+-------+
                          |
                          v
                  +---------------+
                  | Loan Database  |
                  +-------+-------+
                          |
                          v
                  +---------------+
                  |  Validation   |
                  +-------+-------+
                          |
                +---------+---------+
                |                   |
              PASS                FAIL
                |                   |
                v                   v
           AI Review            Exception
                |                   |
                |                   v
                |               Copilot
                |                   |
                |                   v
                |               Correction
                |                   |
                |                   v
                |              Re-validation
                |                   |
                +---------+---------+
                          |
                          v
                  +---------------+
                  | Human Reviewer|
                  +-------+-------+
                          |
                    +-----+-----+
                    |           |
                 APPROVE      REJECT
                    |
                    v
                VERIFIED
                    |
                    v
              Audit Trail
28. Frontend-to-Backend Request Flow
For a typical protected operation:
React Component
      |
      v
API Request
      |
      v
JWT Authentication
      |
      v
Spring Controller
      |
      v
Service Layer
      |
      v
Repository
      |
      v
PostgreSQL
      |
      v
Response
      |
      v
React Component
29. Example: Complete Verification Scenario
Example loan:
Loan Number:
LN-2026-004

Borrower:
Neha Kapoor

Original Loan Amount:
600000

Current Balance:
615000
Validation detects the inconsistency:
Current Balance > Original Loan Amount
The loan enters the exception workflow.
The reviewer can use Copilot to ask:
Why did this loan fail?
After correcting the record:
Current Balance:
590000
validation returns:
valid = true
errorCount = 0
AI review can then return:
Risk Level:
LOW

Risk Score:
25

Recommendation:
APPROVE
The authorized reviewer makes the final approval.
The loan then reaches:
VERIFIED
The important actions remain available through the audit trail.
30. Security Boundaries
Security is applied at the API layer.
Frontend
   |
   | JWT
   v
Spring Security
   |
   +---- Authenticated
   |
   v
Controllers
   |
   v
Services
The backend is responsible for protecting application APIs rather than trusting the frontend alone.
31. Design Principles
Separation of Responsibilities
Controllers handle HTTP requests.
Services handle business logic.
Repositories handle persistence.
Human-in-the-Loop
AI recommendations are separated from human approval decisions.
Validation Before Approval
Loan records with unresolved validation issues cannot proceed directly to approval.
Traceability
Important workflow events are recorded in the audit trail.
Explainability
Validation issues and AI recommendations are exposed to reviewers.
Data Integrity
Record hashes are associated with audit events to support traceability.
32. Running Architecture
For local development:
Frontend
http://localhost:<Vite-Port>
        |
        v
Backend
http://localhost:8082
        |
        v
PostgreSQL
The frontend communicates with the backend through REST APIs.
33. Repository Structure
LoanGuard-AI/
│
├── README.md
├── ARCHITECTURE.md
├── .gitignore
├── start-backend.sh
│
├── backend/
│   ├── pom.xml
│   ├── mvnw
│   └── src/
│       └── main/
│           └── java/
│               └── com/
│                   └── loanguard/
│                       └── backend/
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── api/
        ├── assets/
        └── pages/
34. Architecture Summary
LoanGuard AI combines:
React
   +
Spring Boot
   +
PostgreSQL
   +
JWT Security
   +
Validation Engine
   +
Exception Workflow
   +
Risk Analysis
   +
AI Review
   +
AI Copilot
   +
Human Review
   +
Verification
   +
Audit Trail
The resulting system provides an end-to-end process for converting loan data into trusted and traceable records while maintaining human control over important decisions.
Final Architecture Flow
             LOANGUARD AI
                  |
                  v
            LOAN DATA
                  |
                  v
             VALIDATION
                  |
        +---------+---------+
        |                   |
        v                   v
      VALID              EXCEPTION
        |                   |
        |                   v
        |               AI COPILOT
        |                   |
        |                   v
        |               CORRECTION
        |                   |
        |                   v
        |              RE-VALIDATION
        |                   |
        +---------+---------+
                  |
                  v
              AI REVIEW
                  |
                  v
           HUMAN REVIEWER
                  |
            +-----+-----+
            |           |
            v           v
         APPROVE      REJECT
            |
            v
         VERIFIED
            |
            v
        AUDIT TRAIL
LoanGuard AI — AI-assisted loan verification with validation, human review, verification, and traceability.

