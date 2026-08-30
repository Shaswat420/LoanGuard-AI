# LoanGuard AI — AI Development Log

## 1. Purpose

This document records how AI-assisted development was used while building LoanGuard AI.

AI was used as a development assistant for:

- Application architecture
- React and TypeScript development
- Spring Boot development
- REST API integration
- Validation workflow design
- AI Copilot implementation
- UI/UX improvements
- Debugging
- Error analysis
- Documentation
- Testing and refinement

AI-generated suggestions were reviewed and tested before being incorporated into the application.

---

# 2. AI Tools Used

The primary AI development assistant used during the project was:

```text
ChatGPT
AI assistance was used throughout development for coding, debugging, architecture discussions, UI improvements, testing guidance, and documentation.
The final application was tested by the developer locally before changes were accepted.
3. AI-Assisted Development Areas
Architecture
AI was used to discuss and refine the overall LoanGuard workflow:
Loan Data
    ↓
Validation
    ↓
Exception
    ↓
AI Analysis
    ↓
Human Review
    ↓
Verification
    ↓
Audit Trail
The developer reviewed the proposed architecture and implemented the final structure in the project.
Frontend Development
AI assistance was used for:
React component development
TypeScript interfaces
React Router configuration
API integration
Navigation
Dashboard UI
Dark theme styling
Exception page styling
Analytics styling
AI Copilot interface
Audit Trail interface
The generated code was compiled using the project's TypeScript/Vite build process.
Backend Development
AI assistance was used for:
Spring Boot REST controller structure
Service-layer organization
Validation workflow
AI review workflow
Risk analysis
Audit logging
JWT authentication integration
API debugging
The final backend implementation was compiled and tested locally.
4. Representative AI Prompts
The following are representative examples of prompts used during development.
Prompt 1 — Architecture
Design an end-to-end architecture for an AI-assisted loan data verification platform with CSV ingestion, validation, exceptions, AI review, human approval, verified records, and an audit trail.
Result / Usage
The resulting architecture was used as a starting point for the LoanGuard workflow.
The final implementation was adapted to the existing Spring Boot and React application.
Prompt 2 — Validation
Create a loan validation workflow that detects data-quality problems and returns structured validation issues containing the rule, field, severity, message, actual value, and expected value.
Result / Usage
This informed the validation response structure used by the application.
Prompt 3 — Exception Workflow
Design an exception workflow for loans that fail validation. The reviewer should be able to inspect the issue, correct the loan data, re-run validation, and continue the review process.
Result / Usage
This became the basis for the application's exception and correction workflow.
Prompt 4 — AI Review
Create an AI-assisted loan review response containing risk score, risk level, severity, explanation, suggested corrections, reviewer note, and recommendation.
Result / Usage
This informed the AIReviewResponse structure and AI review workflow.
Prompt 5 — AI Copilot
Build a loan-specific AI Copilot that accepts questions such as "Can I approve this loan?", "What are the exceptions?", and "Explain the risk?" and returns an answer based on the selected loan, validation status, and risk information.
Result / Usage
This resulted in the dedicated Copilot controller, service, response model, React page, and Copilot API.
Prompt 6 — Human-in-the-Loop
Design the loan approval workflow so that AI can provide a recommendation but cannot automatically make the final approval decision. The authorized reviewer must make the final decision.
Result / Usage
The final workflow separates:
AI Recommendation
        ↓
Human Reviewer
        ↓
Final Decision
Prompt 7 — Audit Trail
Design an audit trail for the loan verification workflow that records important events such as record creation, validation, AI recommendation, and reviewer approval.
Result / Usage
This informed the audit logging structure and audit APIs.
Prompt 8 — Dashboard
Improve the LoanGuard dashboard with a professional dark theme while keeping the existing loan loading and dashboard functionality intact.
Result / Usage
AI-generated CSS and UI suggestions were reviewed and adapted to the existing dashboard.
Prompt 9 — Copilot Debugging
The Copilot API works through curl, but clicking the AI Copilot button from the dashboard does not open the expected Copilot page. Diagnose the React Router and navigation flow.
Result / Usage
The frontend routing and navigation were inspected and corrected.
The final application contains:
/copilot
and:
/ai-copilot
routes.
Prompt 10 — Build Error
TypeScript reports that FormEvent is a type and must be imported using a type-only import when verbatimModuleSyntax is enabled. Fix the React TypeScript import.
Result / Usage
The import was changed to a type-only import:
import type {
  FormEvent,
} from "react";
The frontend build was then tested again.
5. AI-Assisted Code Review Process
AI-generated code was not automatically accepted.
The development process was:
AI Suggestion
     ↓
Developer Review
     ↓
Paste / Implement
     ↓
TypeScript / Java Compilation
     ↓
Runtime Testing
     ↓
API Testing
     ↓
Manual UI Testing
     ↓
Accept or Modify
When generated code produced errors, the error output was provided to the AI for diagnosis and correction.
6. Example of Human Modification
AI-generated navigation logic was reviewed against the existing application state.
Instead of replacing the entire dashboard, the existing loans state was reused.
The final Copilot navigation uses an available loan when possible:
const copilotLoan =
  loans.find(
    (loan) =>
      loan.verificationStatus !== "VERIFIED" ||
      loan.validationErrorCount > 0
  ) || loans[0];
The developer chose this approach because it preserved the existing working dashboard rather than replacing it with a newly generated dashboard.
7. Example of Rejected / Modified AI Output #1
Situation
An AI-generated solution attempted to replace the existing Dashboard implementation with a newly constructed dashboard.
Why it was rejected
The existing Dashboard already contained working:
Loan loading
Statistics
Navigation
Authentication
Dark theme
Dashboard state
Replacing the complete page introduced unnecessary risk.
Final decision
The generated solution was rejected.
Only the required navigation logic was changed.
Lesson
Modify working components incrementally instead of replacing a complete working application unnecessarily.
8. Example of Rejected / Modified AI Output #2
Situation
An early Copilot implementation had a TypeScript import problem.
The build reported:
'FormEvent' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
Why the original output was rejected
The implementation used a normal import for a TypeScript-only type.
Final correction
The import was changed to:
import type {
  FormEvent,
} from "react";
The frontend was rebuilt and the TypeScript error was resolved.
Lesson
AI-generated TypeScript must still be validated against the project's compiler configuration.
9. Testing AI-Related Functionality
The AI Copilot API was tested directly against the running backend.
Example request:
curl -X POST \
  http://localhost:8082/api/copilot/loans/36 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"question":"Can I approve this loan?"}'
The application returned a structured response containing:
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
Example result:
Recommendation:
APPROVE

Risk:
LOW

Risk Score:
25 / 100

Validation:
PASSED
This confirmed that the Copilot backend was reachable and producing loan-specific responses.
10. End-to-End AI Verification Test
A representative loan workflow was tested using:
Loan Number:
LN-2026-004

Borrower:
Neha Kapoor
Initial state:
Original Loan Amount:
600000

Current Balance:
615000
The validation engine detected the inconsistency.
The record was then corrected:
615000
   ↓
590000
Validation returned:
valid:
true

errorCount:
0
The AI review then returned:
Risk Level:
LOW

Risk Score:
25

Recommendation:
APPROVE
The final decision was made by the authorized reviewer.
The loan reached:
verificationStatus:
VERIFIED
The audit trail recorded important workflow events.
11. AI and Human Decision Separation
A core design decision was to keep AI recommendations separate from human decisions.
The workflow is:
Loan Data
    ↓
Validation
    ↓
AI Analysis
    ↓
AI Recommendation
    ↓
Human Reviewer
    ↓
Final Decision
The AI does not silently approve the loan.
The reviewer remains responsible for the final approval or rejection.
12. AI Explainability
The Copilot and AI review features expose information that helps the reviewer understand the recommendation.
The system can provide:
Explanation
Risk level
Risk score
Validation status
Validation error count
Recommendation
Sources used for the analysis
Example:
Sources:

Loan record
Validation engine
Risk engine
This allows the reviewer to understand where the recommendation is coming from.
13. AI-Generated Code Estimate
A significant portion of the implementation was developed with AI assistance.
However, AI-generated code was not treated as final automatically.
The developer:
Integrated generated code into the existing project
Modified generated code
Fixed compilation errors
Tested API behavior
Tested frontend navigation
Tested UI workflows
Verified backend responses
Reviewed the final application manually
Estimated AI-assisted code contribution:
Approximately 60–70%
This is an estimate rather than an automated measurement.
14. Lessons Learned
1. AI is most useful when given project context
Providing the existing source code, API responses, compiler errors, and project structure produced much better results than asking for generic code.
2. Existing working code should be preserved
Replacing entire working components can introduce unnecessary bugs.
Incremental changes were more reliable.
3. Compilation is essential
AI-generated code can appear correct while still failing the project's compiler configuration.
The development workflow therefore included:
Generate
   ↓
Compile
   ↓
Fix
   ↓
Compile Again
4. Runtime testing is different from compilation
A successful build does not guarantee that navigation, APIs, or backend workflows work correctly.
The application was therefore tested through:
Browser interaction
REST API requests
Loan validation
AI review
Reviewer approval
Audit trail
5. AI should assist rather than silently decide
The LoanGuard architecture intentionally separates:
AI Recommendation
from:
Human Decision
This makes the system more appropriate for workflows where decisions require human oversight.
15. Final AI Development Workflow
The overall development approach was:
Requirement
    ↓
AI Discussion
    ↓
Implementation
    ↓
Developer Review
    ↓
Build
    ↓
Runtime Test
    ↓
API Test
    ↓
UI Test
    ↓
Modification
    ↓
Final Implementation
16. Final Reflection
AI significantly accelerated the development of LoanGuard AI by helping with:
Architecture
Backend development
Frontend development
Debugging
UI design
API integration
Testing
Documentation
However, the final application was not accepted based solely on AI output.
The developer remained responsible for:
Selecting implementations
Modifying generated code
Debugging errors
Testing the application
Verifying API behavior
Testing the complete workflow
Making final design decisions
The most important lesson was that AI works best as a development partner when its output is continuously checked against the real application.
17. Conclusion
LoanGuard AI demonstrates a practical use of AI in a financial data verification workflow while maintaining human control over important decisions.
The final workflow is:
Loan Data
    ↓
Validation
    ↓
Exception Detection
    ↓
AI Explanation
    ↓
Correction
    ↓
Re-validation
    ↓
AI Risk Review
    ↓
Human Approval
    ↓
Verified Record
    ↓
Audit Trail
AI was used throughout development, but human review remained central to both the software development process and the loan verification workflow.

