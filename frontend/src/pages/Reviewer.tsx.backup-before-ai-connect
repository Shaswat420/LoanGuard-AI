import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import "./Reviewer.css";

// =========================================================
// API
// =========================================================

const API_URL =
  "http://localhost:8082/api";

// =========================================================
// TYPES
// =========================================================

type Loan = {
  id: number;
  loanNumber: string;
  borrowerName: string;

  originalLoanAmount: number;
  currentBalance: number;
  interestRate: number;

  loanTermMonths: number;

  originationDate: string;
  maturityDate: string;

  loanStatus: string;
  dataSource: string;

  validationErrorCount: number;
  verificationStatus: string;

  createdAt: string;
  updatedAt: string;
};

type ValidationIssue = {
  rule: string;
  field: string;
  severity: string;
  message: string;
  actualValue: string | null;
  expectedValue: string;
};

type ValidationResult = {
  valid: boolean;
  loanId: number;
  loanNumber: string;
  errorCount: number;
  issues: ValidationIssue[];
};

type RiskFactor = {
  factor: string;
  severity: string;
  impact: string;
  description: string;
};

type RiskAnalysis = {
  loanId: number;
  loanNumber: string;

  riskScore: number;
  riskLevel: string;

  recommendation: string;
  confidence: number;

  validationPassed: boolean;
  validationErrorCount: number;

  factors: RiskFactor[];
};

type AIReviewResponse = {
  loanId: number;
  loanNumber: string;

  summary: string;
  severity: string;
  explanation: string;

  suggestedCorrections: string[];

  reviewerNote: string;
  recommendation: string;

  model: string;
  generatedAt: string;
};

type AuditLog = {
  id: number;
  loanId: number;
  loanNumber: string;

  eventType: string;
  description: string;
  actor: string;

  createdAt: string;
  recordHash: string;
};

type EditForm = {
  loanNumber: string;
  borrowerName: string;

  originalLoanAmount: string;
  currentBalance: string;
  interestRate: string;

  loanTermMonths: string;

  originationDate: string;
  maturityDate: string;

  loanStatus: string;
  dataSource: string;
};

// =========================================================
// COMPONENT
// =========================================================

function Reviewer() {
  const { id } =
    useParams<{ id: string }>();

  const navigate =
    useNavigate();

  // =======================================================
  // STATE
  // =======================================================

  const [loan, setLoan] =
    useState<Loan | null>(null);

  const [validation, setValidation] =
    useState<ValidationResult | null>(
      null
    );

  const [riskAnalysis, setRiskAnalysis] =
    useState<RiskAnalysis | null>(
      null
    );

  const [aiReview, setAiReview] =
    useState<AIReviewResponse | null>(
      null
    );

  const [auditLogs, setAuditLogs] =
    useState<AuditLog[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [validating, setValidating] =
    useState(false);

  const [riskLoading, setRiskLoading] =
    useState(false);

  const [aiReviewLoading, setAiReviewLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [auditLoading, setAuditLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [editForm, setEditForm] =
    useState<EditForm>({
      loanNumber: "",
      borrowerName: "",

      originalLoanAmount: "",
      currentBalance: "",
      interestRate: "",

      loanTermMonths: "",

      originationDate: "",
      maturityDate: "",

      loanStatus: "",
      dataSource: "",
    });

  // =========================================================
  // AUTH
  // =========================================================

  function getToken() {
    return localStorage.getItem(
      "loanguard_token"
    );
  }

  function logout() {
    localStorage.removeItem(
      "loanguard_token"
    );

    localStorage.removeItem(
      "loanguard_user"
    );

    window.location.replace("/");
  }

  // =========================================================
  // AUTHENTICATED FETCH
  // =========================================================

  async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token =
      getToken();

    if (!token) {
      logout();

      throw new Error(
        "Your session has expired. Please sign in again."
      );
    }

    const headers =
      new Headers(
        options.headers || {}
      );

    headers.set(
      "Authorization",
      `Bearer ${token}`
    );

    headers.set(
      "Accept",
      "application/json"
    );

    if (
      options.body &&
      !(options.body instanceof FormData) &&
      !headers.has(
        "Content-Type"
      )
    ) {
      headers.set(
        "Content-Type",
        "application/json"
      );
    }

    const response =
      await fetch(url, {
        ...options,
        headers,
      });

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      logout();

      throw new Error(
        "Your session has expired or you do not have permission to access this resource."
      );
    }

    return response;
  }

  // =========================================================
  // GENERIC BACKEND ERROR
  // =========================================================

  async function getBackendError(
    response: Response,
    fallback: string
  ) {
    try {
      const data =
        await response.json();

      return (
        data?.message ||
        data?.error ||
        fallback
      );
    } catch {
      return fallback;
    }
  }

  // =========================================================
  // LOAD PAGE
  // =========================================================

  useEffect(() => {
    if (!id) {
      setMessage(
        "No loan ID was provided."
      );

      setLoading(false);

      return;
    }

    loadLoan();
    loadAuditLogs();
  }, [id]);

  // =========================================================
  // POPULATE EDIT FORM
  // =========================================================

  function populateEditForm(
    data: Loan
  ) {
    setEditForm({
      loanNumber:
        data.loanNumber ?? "",

      borrowerName:
        data.borrowerName ?? "",

      originalLoanAmount:
        data.originalLoanAmount
          ?.toString() ?? "",

      currentBalance:
        data.currentBalance
          ?.toString() ?? "",

      interestRate:
        data.interestRate
          ?.toString() ?? "",

      loanTermMonths:
        data.loanTermMonths
          ?.toString() ?? "",

      originationDate:
        data.originationDate ?? "",

      maturityDate:
        data.maturityDate ?? "",

      loanStatus:
        data.loanStatus ?? "",

      dataSource:
        data.dataSource ?? "",
    });
  }

  // =========================================================
  // LOAD LOAN
  // =========================================================

  async function loadLoan() {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response =
        await authenticatedFetch(
          `${API_URL}/loans/${id}`
        );

      if (!response.ok) {
        throw new Error(
          await getBackendError(
            response,
            `Unable to load loan. Server returned ${response.status}.`
          )
        );
      }

      const data: Loan =
        await response.json();

      setLoan(data);

      populateEditForm(data);

    } catch (error) {
      console.error(
        "Load loan error:",
        error
      );

      setLoan(null);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load loan."
      );

    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // REMOVE DUPLICATE AUDIT LOGS
  // =========================================================

  function removeDuplicateAuditLogs(
    logs: AuditLog[]
  ) {
    const seen =
      new Set<string>();

    const sorted =
      [...logs].sort(
        (a, b) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      );

    return sorted.filter(
      (log) => {
        const key = [
          log.eventType,
          log.description,
          log.actor,
          log.recordHash,
        ].join("|");

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);

        return true;
      }
    );
  }

  // =========================================================
  // LOAD AUDIT
  // =========================================================

  async function loadAuditLogs() {
    if (!id) {
      return;
    }

    try {
      setAuditLoading(true);

      const response =
        await authenticatedFetch(
          `${API_URL}/audit/loans/${id}`
        );

      if (!response.ok) {
        throw new Error(
          "Unable to load audit history."
        );
      }

      const data: AuditLog[] =
        await response.json();

      setAuditLogs(
        removeDuplicateAuditLogs(
          data
        )
      );

    } catch (error) {
      console.error(
        "Audit history error:",
        error
      );

      setAuditLogs([]);

    } finally {
      setAuditLoading(false);
    }
  }

  // =========================================================
  // VALIDATION
  // =========================================================

  async function validateLoan() {
    if (!id) {
      return;
    }

    try {
      setValidating(true);
      setMessage("");

      const response =
        await authenticatedFetch(
          `${API_URL}/loans/${id}/validate`,
          {
            method: "POST",
          }
        );

      if (!response.ok) {
        throw new Error(
          await getBackendError(
            response,
            "Validation failed."
          )
        );
      }

      const result: ValidationResult =
        await response.json();

      setValidation(result);

      // Clear old AI result because the
      // underlying validation state changed.
      setAiReview(null);

      await loadLoan();
      await loadAuditLogs();

      if (result.valid) {
        setMessage(
          "Validation completed successfully. No issues detected."
        );
      } else {
        setMessage(
          `${result.errorCount} validation issue(s) detected.`
        );
      }

    } catch (error) {
      console.error(
        "Validation error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Loan validation failed."
      );

    } finally {
      setValidating(false);
    }
  }

  // =========================================================
  // AI REVIEW
  // =========================================================

  async function runAIReview() {
    if (!id) {
      return;
    }

    try {
      setAiReviewLoading(true);
      setMessage("");

      /*
       * This calls the REAL AI review endpoint:
       *
       * POST /api/ai-review/loans/{id}
       *
       * The backend does not modify the loan.
       * It only generates an AI recommendation.
       */

      const response =
        await authenticatedFetch(
          `${API_URL}/ai-review/loans/${id}`,
          {
            method: "POST",
          }
        );

      if (!response.ok) {
        throw new Error(
          await getBackendError(
            response,
            "AI review failed."
          )
        );
      }

      const result: AIReviewResponse =
        await response.json();

      setAiReview(result);

      await loadAuditLogs();

      setMessage(
        "AI review completed successfully."
      );

    } catch (error) {
      console.error(
        "AI review error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to run AI review."
      );

    } finally {
      setAiReviewLoading(false);
    }
  }

  // =========================================================
  // RISK ANALYSIS
  // =========================================================

  async function analyzeRisk() {
    if (!id) {
      return;
    }

    try {
      setRiskLoading(true);
      setMessage("");

      const response =
        await authenticatedFetch(
          `${API_URL}/risk/loans/${id}`
        );

      if (!response.ok) {
        throw new Error(
          await getBackendError(
            response,
            "Risk analysis failed."
          )
        );
      }

      const result: RiskAnalysis =
        await response.json();

      setRiskAnalysis(result);

      setMessage(
        "Risk analysis completed."
      );

    } catch (error) {
      console.error(
        "Risk analysis error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to run risk analysis."
      );

    } finally {
      setRiskLoading(false);
    }
  }

  // =========================================================
  // EDIT
  // =========================================================

  function startEditing() {
    if (!loan) {
      return;
    }

    populateEditForm(loan);

    setEditing(true);
    setMessage("");

    /*
     * Existing validation and AI results should not
     * be trusted after editing.
     */

    setValidation(null);
    setAiReview(null);
    setRiskAnalysis(null);
  }

  function cancelEditing() {
    if (loan) {
      populateEditForm(loan);
    }

    setEditing(false);
    setMessage("");
  }

  function updateEditField(
    field: keyof EditForm,
    value: string
  ) {
    setEditForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  }

  // =========================================================
  // SAVE EDIT
  // =========================================================

  async function saveChanges() {
    if (!id || !loan) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const payload = {
        loanNumber:
          editForm.loanNumber,

        borrowerName:
          editForm.borrowerName,

        originalLoanAmount:
          editForm.originalLoanAmount === ""
            ? null
            : Number(
                editForm.originalLoanAmount
              ),

        currentBalance:
          editForm.currentBalance === ""
            ? null
            : Number(
                editForm.currentBalance
              ),

        interestRate:
          editForm.interestRate === ""
            ? null
            : Number(
                editForm.interestRate
              ),

        loanTermMonths:
          editForm.loanTermMonths === ""
            ? null
            : Number(
                editForm.loanTermMonths
              ),

        originationDate:
          editForm.originationDate ||
          null,

        maturityDate:
          editForm.maturityDate ||
          null,

        loanStatus:
          editForm.loanStatus,

        dataSource:
          editForm.dataSource,
      };

      const response =
        await authenticatedFetch(
          `${API_URL}/reviewer/loans/${id}`,
          {
            method: "PUT",
            body: JSON.stringify(
              payload
            ),
          }
        );

      if (!response.ok) {
        throw new Error(
          await getBackendError(
            response,
            `Unable to save changes. Server returned ${response.status}.`
          )
        );
      }

      const updatedLoan: Loan =
        await response.json();

      setLoan(updatedLoan);

      populateEditForm(
        updatedLoan
      );

      setEditing(false);

      /*
       * Editing invalidates previous analysis.
       */

      setValidation(null);
      setRiskAnalysis(null);
      setAiReview(null);

      await loadAuditLogs();

      setMessage(
        "Loan changes saved. Revalidation and AI review are required before approval."
      );

    } catch (error) {
      console.error(
        "Save changes error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save loan changes."
      );

    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // APPROVE
  // =========================================================

  async function approveLoan() {
    if (!id || !loan) {
      return;
    }

    /*
     * Require a fresh validation result.
     */

    if (
      !validation ||
      !validation.valid
    ) {
      setMessage(
        "Run validation and resolve all issues before approval."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Approve loan ${loan.loanNumber}?\n\n` +
        "This will mark the record as VERIFIED."
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");

      const response =
        await authenticatedFetch(
          `${API_URL}/reviewer/loans/${id}/approve`,
          {
            method: "POST",
          }
        );

      if (!response.ok) {
        throw new Error(
          await getBackendError(
            response,
            "Unable to approve loan."
          )
        );
      }

      const updatedLoan: Loan =
        await response.json();

      setLoan(updatedLoan);

      populateEditForm(
        updatedLoan
      );

      await loadAuditLogs();

      setMessage(
        "Loan approved successfully and marked as VERIFIED."
      );

    } catch (error) {
      console.error(
        "Approve loan error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to approve loan."
      );

    } finally {
      setActionLoading(false);
    }
  }

  // =========================================================
  // REJECT
  // =========================================================

  async function rejectLoan() {
    if (!id || !loan) {
      return;
    }

    const confirmed =
      window.confirm(
        `Reject loan ${loan.loanNumber}?\n\n` +
        "This will mark the record as REJECTED."
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");

      const response =
        await authenticatedFetch(
          `${API_URL}/reviewer/loans/${id}/reject`,
          {
            method: "POST",
          }
        );

      if (!response.ok) {
        throw new Error(
          await getBackendError(
            response,
            "Unable to reject loan."
          )
        );
      }

      const updatedLoan: Loan =
        await response.json();

      setLoan(updatedLoan);

      populateEditForm(
        updatedLoan
      );

      await loadAuditLogs();

      setMessage(
        "Loan rejected successfully."
      );

    } catch (error) {
      console.error(
        "Reject loan error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to reject loan."
      );

    } finally {
      setActionLoading(false);
    }
  }

  // =========================================================
  // FORMAT MONEY
  // =========================================================

  function formatMoney(
    value:
      | number
      | null
      | undefined
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(value);
  }

  // =========================================================
  // FORMAT DATE
  // =========================================================

  function formatDate(
    value:
      | string
      | null
      | undefined
  ) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  // =========================================================
  // STATUS CLASS
  // =========================================================

  function getStatusClass(
    status?: string
  ) {
    switch (
      status?.toUpperCase()
    ) {
      case "VERIFIED":
        return "status status-verified";

      case "NEEDS_REVIEW":
        return "status status-exception";

      case "REJECTED":
        return "status status-rejected";

      default:
        return "status status-pending";
    }
  }

  // =========================================================
  // RISK CLASS
  // =========================================================

  function getRiskClass(
    level?: string
  ) {
    switch (
      level?.toUpperCase()
    ) {
      case "LOW":
        return "risk risk-low";

      case "MEDIUM":
        return "risk risk-medium";

      case "HIGH":
        return "risk risk-high";

      default:
        return "risk risk-unknown";
    }
  }

  // =========================================================
  // RECOMMENDATION CLASS
  // =========================================================

  function getRecommendationClass(
    recommendation?: string
  ) {
    const value =
      recommendation
        ?.toUpperCase() || "";

    if (
      value.includes(
        "APPROVE"
      ) ||
      value.includes(
        "LOW RISK"
      )
    ) {
      return "recommendation recommendation-approve";
    }

    if (
      value.includes(
        "REJECT"
      )
    ) {
      return "recommendation recommendation-reject";
    }

    if (
      value.includes(
        "HUMAN"
      ) ||
      value.includes(
        "VERIFICATION"
      ) ||
      value.includes(
        "REVIEW"
      )
    ) {
      return "recommendation recommendation-review";
    }

    return "recommendation recommendation-unknown";
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="reviewer-page">

        <div className="loading-state">

          <div className="loading-spinner" />

          <p>
            Loading loan record...
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!loan) {
    return (
      <div className="reviewer-page">

        <div className="reviewer-error">

          <h2>
            Loan not found
          </h2>

          <p>
            {message ||
              "The requested loan does not exist."}
          </p>

          <button
            className="back-button"
            onClick={() =>
              navigate("/loans")
            }
          >
            ← Back to Loan Records
          </button>

        </div>

      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="reviewer-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="reviewer-header">

        <div>

          <button
            className="back-link"
            onClick={() =>
              navigate("/loans")
            }
          >
            ← Loan Records
          </button>

          <div className="reviewer-eyebrow">
            LOAN DATA VERIFICATION COPILOT
          </div>

          <h1>
            AI Reviewer
          </h1>

          <p>
            Review, validate and verify
            loan-level data before it
            becomes part of the trusted
            dataset.
          </p>

        </div>

        <div
          className={getStatusClass(
            loan.verificationStatus
          )}
        >
          <span className="status-dot" />

          {loan.verificationStatus.replaceAll(
            "_",
            " "
          )}

        </div>

      </header>

      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {message && (
        <div className="reviewer-message">
          {message}
        </div>
      )}

      {/* =====================================================
          LOAN IDENTITY
      ===================================================== */}

      <section className="loan-identity">

        <div>

          <span>
            LOAN RECORD
          </span>

          <strong>
            {loan.loanNumber}
          </strong>

        </div>

        <div>

          <span>
            BORROWER
          </span>

          <strong>
            {loan.borrowerName}
          </strong>

        </div>

        <div>

          <span>
            SOURCE
          </span>

          <strong>
            {loan.dataSource}
          </strong>

        </div>

        <div>

          <span>
            LAST UPDATED
          </span>

          <strong>
            {formatDate(
              loan.updatedAt
            )}
          </strong>

        </div>

      </section>

      {/* =====================================================
          EDIT PANEL
      ===================================================== */}

      {editing && (
        <section className="panel edit-panel">

          <div className="panel-heading">

            <div>

              <div className="panel-label">
                RECORD EDITOR
              </div>

              <h2>
                Correct Loan Data
              </h2>

            </div>

          </div>

          <div className="edit-grid">

            <label>
              Loan Number

              <input
                value={
                  editForm.loanNumber
                }
                onChange={(event) =>
                  updateEditField(
                    "loanNumber",
                    event.target.value
                  )
                }
              />

            </label>

            <label>
              Borrower Name

              <input
                value={
                  editForm.borrowerName
                }
                onChange={(event) =>
                  updateEditField(
                    "borrowerName",
                    event.target.value
                  )
                }
              />

            </label>

            <label>
              Original Loan Amount

              <input
                type="number"
                value={
                  editForm.originalLoanAmount
                }
                onChange={(event) =>
                  updateEditField(
                    "originalLoanAmount",
                    event.target.value
                  )
                }
              />

            </label>

            <label>
              Current Balance

              <input
                type="number"
                value={
                  editForm.currentBalance
                }
                onChange={(event) =>
                  updateEditField(
                    "currentBalance",
                    event.target.value
                  )
                }
              />

            </label>

            <label>
              Interest Rate

              <input
                type="number"
                step="0.01"
                value={
                  editForm.interestRate
                }
                onChange={(event) =>
                  updateEditField(
                    "interestRate",
                    event.target.value
                  )
                }
              />

            </label>

            <label>
              Loan Term Months

              <input
                type="number"
                value={
                  editForm.loanTermMonths
                }
                onChange={(event) =>
                  updateEditField(
                    "loanTermMonths",
                    event.target.value
                  )
                }
              />

            </label>

            <label>
              Origination Date

              <input
                type="date"
                value={
                  editForm.originationDate
                }
                onChange={(event) =>
                  updateEditField(
                    "originationDate",
                    event.target.value
                  )
                }
              />

            </label>

            <label>
              Maturity Date

              <input
                type="date"
                value={
                  editForm.maturityDate
                }
                onChange={(event) =>
                  updateEditField(
                    "maturityDate",
                    event.target.value
                  )
                }
              />

            </label>

            <label>
              Loan Status

              <select
                value={
                  editForm.loanStatus
                }
                onChange={(event) =>
                  updateEditField(
                    "loanStatus",
                    event.target.value
                  )
                }
              >
                <option value="ACTIVE">
                  ACTIVE
                </option>

                <option value="CLOSED">
                  CLOSED
                </option>

                <option value="DEFAULT">
                  DEFAULT
                </option>

                <option value="PAID_OFF">
                  PAID_OFF
                </option>

              </select>

            </label>

            <label>
              Data Source

              <input
                value={
                  editForm.dataSource
                }
                onChange={(event) =>
                  updateEditField(
                    "dataSource",
                    event.target.value
                  )
                }
              />

            </label>

          </div>

          <div className="edit-actions">

            <button
              className="secondary-button"
              onClick={
                cancelEditing
              }
              disabled={saving}
            >
              Cancel
            </button>

            <button
              className="primary-button"
              onClick={
                saveChanges
              }
              disabled={saving}
            >
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>

          </div>

        </section>
      )}

      {/* =====================================================
          MAIN GRID
      ===================================================== */}

      <div className="reviewer-grid">

        {/* ===================================================
            LEFT
        =================================================== */}

        <main>

          {/* =================================================
              LOAN OVERVIEW
          ================================================= */}

          <section className="panel">

            <div className="panel-heading">

              <div>

                <div className="panel-label">
                  LOAN DATA
                </div>

                <h2>
                  Record Overview
                </h2>

              </div>

              {!editing && (
                <button
                  className="secondary-button"
                  onClick={
                    startEditing
                  }
                >
                  Edit Record
                </button>
              )}

            </div>

            <div className="loan-details-grid">

              <div className="detail-item">
                <span>
                  Original Amount
                </span>

                <strong>
                  {formatMoney(
                    loan.originalLoanAmount
                  )}
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Current Balance
                </span>

                <strong>
                  {formatMoney(
                    loan.currentBalance
                  )}
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Interest Rate
                </span>

                <strong>
                  {loan.interestRate !==
                  null &&
                  loan.interestRate !==
                  undefined
                    ? `${loan.interestRate}%`
                    : "—"}
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Term
                </span>

                <strong>
                  {loan.loanTermMonths
                    ? `${loan.loanTermMonths} months`
                    : "—"}
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Origination
                </span>

                <strong>
                  {formatDate(
                    loan.originationDate
                  )}
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Maturity
                </span>

                <strong>
                  {formatDate(
                    loan.maturityDate
                  )}
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Loan Status
                </span>

                <strong>
                  {loan.loanStatus}
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  Validation Errors
                </span>

                <strong>
                  {loan.validationErrorCount ??
                    0}
                </strong>
              </div>

            </div>

          </section>

          {/* =================================================
              AI REVIEW
          ================================================= */}

          <section className="panel ai-panel">

            <div className="panel-heading">

              <div>

                <div className="panel-label">
                  AI ASSISTED REVIEW
                </div>

                <h2>
                  Verification Analysis
                </h2>

              </div>

              <div className="ai-badge">
                AI
              </div>

            </div>

            {!aiReview ? (

              <div className="ai-empty">

                <div className="ai-icon">
                  ✦
                </div>

                <h3>
                  Run AI review
                </h3>

                <p>
                  The AI review engine will
                  inspect the loan validation
                  state, explain detected
                  exceptions and provide a
                  recommendation for the
                  reviewer.
                </p>

                <button
                  className="primary-button"
                  onClick={
                    runAIReview
                  }
                  disabled={
                    aiReviewLoading
                  }
                >
                  {aiReviewLoading
                    ? "AI Reviewing..."
                    : "Run AI Review"}
                </button>

              </div>

            ) : (

              <div className="analysis-result">

                {/* SUMMARY */}

                <div
                  className={
                    "analysis-summary " +
                    (
                      aiReview.severity
                        ?.toUpperCase() ===
                      "HIGH"
                        ? "invalid"
                        : "valid"
                    )
                  }
                >

                  <div className="analysis-icon">
                    {
                      aiReview.severity
                        ?.toUpperCase() ===
                      "HIGH"
                        ? "!"
                        : "✓"
                    }
                  </div>

                  <div>

                    <strong>
                      {aiReview.summary}
                    </strong>

                    <p>
                      {aiReview.explanation}
                    </p>

                  </div>

                </div>

                {/* AI META */}

                <div className="ai-review-meta">

                  <div>

                    <span>
                      SEVERITY
                    </span>

                    <strong>
                      {aiReview.severity}
                    </strong>

                  </div>

                  <div>

                    <span>
                      RECOMMENDATION
                    </span>

                    <strong
                      className={
                        getRecommendationClass(
                          aiReview.recommendation
                        )
                      }
                    >
                      {aiReview.recommendation.replaceAll(
                        "_",
                        " "
                      )}
                    </strong>

                  </div>

                  <div>

                    <span>
                      MODEL
                    </span>

                    <strong>
                      {aiReview.model}
                    </strong>

                  </div>

                </div>

                {/* EXPLANATION */}

                <div className="analysis-section">

                  <div className="section-title">
                    AI EXPLANATION
                  </div>

                  <div className="ai-explanation">

                    <p>
                      {aiReview.explanation}
                    </p>

                  </div>

                </div>

                {/* CORRECTIONS */}

                {aiReview
                  .suggestedCorrections
                  ?.length > 0 && (

                  <div className="analysis-section">

                    <div className="section-title">
                      SUGGESTED CORRECTIONS
                    </div>

                    <div className="issues-list">

                      {aiReview
                        .suggestedCorrections
                        .map(
                          (
                            correction,
                            index
                          ) => (

                            <div
                              className="issue-row"
                              key={index}
                            >

                              <span className="issue-number">
                                {index + 1}
                              </span>

                              <div className="issue-content">

                                <strong>
                                  {correction}
                                </strong>

                              </div>

                            </div>

                          )
                        )}

                    </div>

                  </div>

                )}

                {/* REVIEWER NOTE */}

                <div className="analysis-section">

                  <div className="section-title">
                    REVIEWER NOTE
                  </div>

                  <div className="ai-explanation">

                    <p>
                      {aiReview.reviewerNote}
                    </p>

                  </div>

                </div>

                {/* AI METADATA */}

                <div className="ai-review-footer">

                  <span>
                    AI-generated recommendation
                  </span>

                  <span>
                    Generated{" "}
                    {new Date(
                      aiReview.generatedAt
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </span>

                </div>

                <button
                  className="secondary-button"
                  onClick={
                    runAIReview
                  }
                  disabled={
                    aiReviewLoading
                  }
                >
                  {aiReviewLoading
                    ? "Running..."
                    : "Run AI Review Again"}
                </button>

              </div>

            )}

          </section>

          {/* =================================================
              VALIDATION
          ================================================= */}

          <section className="panel">

            <div className="panel-heading">

              <div>

                <div className="panel-label">
                  VALIDATION ENGINE
                </div>

                <h2>
                  Data Quality Checks
                </h2>

              </div>

              <button
                className="secondary-button"
                onClick={
                  validateLoan
                }
                disabled={
                  validating
                }
              >
                {validating
                  ? "Validating..."
                  : "Run Validation"}
              </button>

            </div>

            {!validation ? (

              <div className="ai-empty">

                <h3>
                  Validation has not been run
                </h3>

                <p>
                  Run validation to check
                  required fields, balances,
                  dates, rates and lifecycle
                  consistency.
                </p>

              </div>

            ) : (

              <div>

                <div
                  className={
                    validation.valid
                      ? "analysis-summary valid"
                      : "analysis-summary invalid"
                  }
                >

                  <div className="analysis-icon">
                    {validation.valid
                      ? "✓"
                      : "!"}
                  </div>

                  <div>

                    <strong>
                      {validation.valid
                        ? "Validation passed"
                        : `${validation.errorCount} issue(s) detected`}
                    </strong>

                    <p>
                      {validation.valid
                        ? "All configured validation checks passed."
                        : "Resolve the detected issues before approving the record."}
                    </p>

                  </div>

                </div>

                {validation.issues.length >
                0 && (

                  <div className="analysis-section">

                    <div className="section-title">
                      DETECTED ISSUES
                    </div>

                    <div className="issues-list">

                      {validation.issues.map(
                        (
                          issue,
                          index
                        ) => (

                          <div
                            className="issue-row"
                            key={`${issue.rule}-${index}`}
                          >

                            <span className="issue-number">
                              {index + 1}
                            </span>

                            <div className="issue-content">

                              <strong>
                                {issue.message}
                              </strong>

                              <small>
                                Rule:{" "}
                                {issue.rule}
                              </small>

                              <small>
                                Field:{" "}
                                {issue.field}
                              </small>

                              <small>
                                Severity:{" "}
                                {issue.severity}
                              </small>

                              {issue.actualValue !==
                                null && (

                                <small>
                                  Actual:{" "}
                                  {issue.actualValue}
                                </small>

                              )}

                              <small>
                                Expected:{" "}
                                {issue.expectedValue}
                              </small>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                )}

              </div>

            )}

          </section>

          {/* =================================================
              RISK
          ================================================= */}

          <section className="panel risk-panel">

            <div className="panel-heading">

              <div>

                <div className="panel-label">
                  AI RISK ENGINE
                </div>

                <h2>
                  Risk Assessment
                </h2>

              </div>

              <button
                className="secondary-button"
                onClick={
                  analyzeRisk
                }
                disabled={
                  riskLoading
                }
              >
                {riskLoading
                  ? "Analyzing..."
                  : "Run Risk Analysis"}
              </button>

            </div>

            {!riskAnalysis ? (

              <div className="ai-empty">

                <div className="ai-icon risk-icon">
                  ◈
                </div>

                <h3>
                  Run risk analysis
                </h3>

                <p>
                  The risk engine evaluates
                  balance utilization,
                  interest rate, maturity,
                  loan status and validation
                  signals.
                </p>

              </div>

            ) : (

              <div className="risk-result">

                <div className="risk-overview">

                  <div
                    className={
                      "risk-score-box " +
                      (
                        riskAnalysis.riskLevel
                          ?.toLowerCase() ===
                        "high"
                          ? "risk-high"
                          : riskAnalysis.riskLevel
                              ?.toLowerCase() ===
                            "medium"
                            ? "risk-medium"
                            : "risk-low"
                      )
                    }
                  >

                    <span className="risk-score">
                      {riskAnalysis.riskScore}
                    </span>

                    <span className="risk-score-label">
                      / 100
                    </span>

                  </div>

                  <div className="risk-summary">

                    <span className="risk-label">
                      RISK LEVEL
                    </span>

                    <strong
                      className={getRiskClass(
                        riskAnalysis.riskLevel
                      )}
                    >
                      {riskAnalysis.riskLevel}
                    </strong>

                    <span className="risk-confidence">
                      Confidence:{" "}
                      {riskAnalysis.confidence}%
                    </span>

                  </div>

                </div>

                <div className="risk-recommendation">

                  <span>
                    RECOMMENDATION
                  </span>

                  <strong>
                    {riskAnalysis.recommendation}
                  </strong>

                </div>

                {riskAnalysis
                  .factors
                  ?.length > 0 && (

                  <div className="risk-factors">

                    <div className="section-title">
                      RISK FACTORS
                    </div>

                    {riskAnalysis.factors.map(
                      (
                        factor,
                        index
                      ) => (

                        <div
                          className="risk-factor"
                          key={`${factor.factor}-${index}`}
                        >

                          <div className="risk-factor-top">

                            <strong>
                              {factor.factor}
                            </strong>

                            <div className="risk-factor-tags">

                              <span
                                className={`risk-severity risk-${factor.severity?.toLowerCase()}`}
                              >
                                {factor.severity}
                              </span>

                              <span
                                className={`risk-impact risk-${factor.severity?.toLowerCase()}`}
                              >
                                {factor.impact}
                              </span>

                            </div>

                          </div>

                          <p>
                            {factor.description}
                          </p>

                        </div>

                      )
                    )}

                  </div>

                )}

                <div className="risk-validation">

                  <span className="validation-check">
                    {riskAnalysis.validationPassed
                      ? "✓"
                      : "!"}
                  </span>

                  <span>
                    {riskAnalysis.validationPassed
                      ? "Validation passed"
                      : `${riskAnalysis.validationErrorCount} validation error(s) recorded.`}
                  </span>

                </div>

              </div>

            )}

          </section>

        </main>

        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <aside>

          {/* =================================================
              DECISION PANEL
          ================================================= */}

          <section className="panel decision-panel">

            <div className="panel-heading">

              <div>

                <div className="panel-label">
                  HUMAN DECISION
                </div>

                <h2>
                  Verification
                </h2>

              </div>

            </div>

            <div className="decision-status">

              <span>
                CURRENT STATUS
              </span>

              <strong
                className={getStatusClass(
                  loan.verificationStatus
                )}
              >
                {loan.verificationStatus.replaceAll(
                  "_",
                  " "
                )}
              </strong>

            </div>

            {aiReview && (

              <div className="decision-ai">

                <span>
                  AI RECOMMENDATION
                </span>

                <strong>
                  {aiReview.recommendation.replaceAll(
                    "_",
                    " "
                  )}
                </strong>

                <small>
                  AI output is advisory.
                  Final decision remains
                  with the reviewer.
                </small>

              </div>

            )}

            <div className="decision-actions">

              <button
                className="approve-button"
                onClick={
                  approveLoan
                }
                disabled={
                  actionLoading ||
                  editing ||
                  !validation?.valid
                }
              >
                {actionLoading
                  ? "Processing..."
                  : "✓ Approve Loan"}
              </button>

              <button
                className="reject-button"
                onClick={
                  rejectLoan
                }
                disabled={
                  actionLoading ||
                  editing
                }
              >
                {actionLoading
                  ? "Processing..."
                  : "✕ Reject Loan"}
              </button>

            </div>

            {!validation?.valid && (

              <p className="decision-warning">
                Validation must pass before
                the loan can be approved.
              </p>

            )}

          </section>

          {/* =================================================
              AUDIT TRAIL
          ================================================= */}

          <section className="panel audit-panel">

            <div className="panel-heading">

              <div>

                <div className="panel-label">
                  TRACEABILITY
                </div>

                <h2>
                  Audit Trail
                </h2>

              </div>

              <button
                className="secondary-button"
                onClick={
                  loadAuditLogs
                }
                disabled={
                  auditLoading
                }
              >
                {auditLoading
                  ? "Loading..."
                  : "Refresh"}
              </button>

            </div>

            {auditLogs.length ===
            0 ? (

              <div className="audit-empty">

                <p>
                  No audit events found.
                </p>

              </div>

            ) : (

              <div className="audit-list">

                {auditLogs.map(
                  (log) => (

                    <div
                      className="audit-item"
                      key={log.id}
                    >

                      <div className="audit-dot" />

                      <div className="audit-content">

                        <strong>
                          {log.eventType.replaceAll(
                            "_",
                            " "
                          )}
                        </strong>

                        <p>
                          {log.description}
                        </p>

                        <small>
                          {log.actor}
                          {" • "}
                          {new Date(
                            log.createdAt
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </small>

                        {log.recordHash && (

                          <code>
                            SHA-256:{" "}
                            {log.recordHash}
                          </code>

                        )}

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        </aside>

      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="reviewer-footer">

        <span>
          ● Record lineage preserved
        </span>

        <span>
          ● AI recommendation logged
        </span>

        <span>
          ● Human decision required
        </span>

      </div>

    </div>
  );
}

export default Reviewer;