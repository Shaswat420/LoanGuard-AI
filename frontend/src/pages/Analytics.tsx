import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Analytics.css";

const API_URL = "http://localhost:8082/api";

// =========================================================
// TYPES
// =========================================================

type Loan = {
  id: number;
  loanNumber: string;
  borrowerName: string;
  originalLoanAmount: number;
  currentBalance: number | null;
  interestRate: number | null;
  loanTermMonths: number | null;
  loanStatus: string;
  originationDate: string;
  maturityDate: string;
  dataSource: string;
  validationErrorCount: number;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
};

type Summary = {
  totalLoans: number;
  verifiedLoans: number;
  pendingLoans: number;
  needsReviewLoans: number;
  rejectedLoans: number;
  validationExceptions: number;
  verificationRate: number;
};

type RiskFactor = {
  factor: string;
  severity: string;
  impact: string;
  description: string;
};

type RiskAssessment = {
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

type AIReview = {
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

// =========================================================
// COMPONENT
// =========================================================

function Analytics() {
  const navigate = useNavigate();

  // =======================================================
  // STATE
  // =======================================================

  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [riskData, setRiskData] = useState<RiskAssessment[]>(
    []
  );

  const [aiReviews, setAiReviews] = useState<AIReview[]>(
    []
  );

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [riskLoading, setRiskLoading] = useState(false);
  const [message, setMessage] = useState("");

  // =========================================================
  // AUTH
  // =========================================================

  function getToken(): string | null {
    return localStorage.getItem("loanguard_token");
  }

  function logout() {
    localStorage.removeItem("loanguard_token");

    // App.tsx uses "/" for Login.
    navigate("/");
  }

  async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = getToken();

    if (!token) {
      logout();

      throw new Error(
        "Your session has expired. Please sign in again."
      );
    }

    const headers = new Headers(
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
      !headers.has("Content-Type")
    ) {
      headers.set(
        "Content-Type",
        "application/json"
      );
    }

    const response = await fetch(url, {
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
  // BACKEND ERROR
  // =========================================================

  async function getBackendError(
    response: Response,
    fallback: string
  ): Promise<string> {
    try {
      const data = await response.json();

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
  // LOAD SUMMARY
  // =========================================================

  async function loadSummary(): Promise<void> {
    const response =
      await authenticatedFetch(
        `${API_URL}/summary`
      );

    if (!response.ok) {
      throw new Error(
        await getBackendError(
          response,
          "Unable to load dashboard summary."
        )
      );
    }

    const data: Summary =
      await response.json();

    setSummary(data);
  }

  // =========================================================
  // LOAD LOANS
  // =========================================================

  async function fetchLoans(): Promise<Loan[]> {
    const response =
      await authenticatedFetch(
        `${API_URL}/loans`
      );

    if (!response.ok) {
      throw new Error(
        await getBackendError(
          response,
          "Unable to load loan records."
        )
      );
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return data as Loan[];
    }

    if (Array.isArray(data?.content)) {
      return data.content as Loan[];
    }

    return [];
  }

  async function loadLoans(): Promise<Loan[]> {
    const loanList = await fetchLoans();

    setLoans(loanList);

    return loanList;
  }

  // =========================================================
  // LOAD AUDIT DATA
  // =========================================================

  async function loadAuditData(
    loanList: Loan[]
  ): Promise<void> {
    /*
     * Limit the number of individual audit requests.
     * This keeps the analytics page responsive.
     */
    const selectedLoans =
      loanList.slice(0, 25);

    const results: AuditLog[] = [];

    for (const loan of selectedLoans) {
      try {
        const response =
          await authenticatedFetch(
            `${API_URL}/audit/loans/${loan.id}`
          );

        if (!response.ok) {
          continue;
        }

        const data =
          await response.json();

        if (Array.isArray(data)) {
          results.push(
            ...(data as AuditLog[])
          );
        }
      } catch (error) {
        console.warn(
          `Unable to load audit history for loan ${loan.id}`,
          error
        );
      }
    }

    /*
     * Remove duplicate audit events.
     */
    const uniqueLogs = removeDuplicateAuditLogs(
      results
    );

    /*
     * Newest first.
     */
    uniqueLogs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

    setAuditLogs(uniqueLogs);
  }

  // =========================================================
  // REMOVE DUPLICATE AUDIT LOGS
  // =========================================================

  function removeDuplicateAuditLogs(
    logs: AuditLog[]
  ): AuditLog[] {
    const seen = new Set<string>();

    return logs.filter((log) => {
      const key = [
        log.loanId,
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
    });
  }

  // =========================================================
  // LOAD ANALYTICS
  // =========================================================

  async function loadAnalytics(): Promise<void> {
    try {
      setLoading(true);
      setMessage("");

      /*
       * Load summary and loans together.
       */
      const [summaryResult, loanList] =
        await Promise.all([
          loadSummary(),
          loadLoans(),
        ]);

      void summaryResult;

      /*
       * Audit trail depends on the loan list.
       */
      await loadAuditData(loanList);

      /*
       * Clear previous risk analysis when
       * the portfolio is refreshed.
       */
      setRiskData([]);

      /*
       * AI reviews are generated from reviewer
       * sessions, so they are not fabricated here.
       */
      setAiReviews([]);

    } catch (error) {
      console.error(
        "Analytics loading error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    void loadAnalytics();
  }, []);

  // =========================================================
  // RISK ANALYSIS
  // =========================================================

  async function runRiskAnalysis(): Promise<void> {
    if (!loans.length) {
      setMessage(
        "No loan records are available for risk analysis."
      );

      return;
    }

    try {
      setRiskLoading(true);
      setMessage("");

      const results: RiskAssessment[] = [];

      /*
       * Analyze up to 30 loans.
       */
      for (const loan of loans.slice(0, 30)) {
        try {
          const response =
            await authenticatedFetch(
              `${API_URL}/risk/loans/${loan.id}`
            );

          if (!response.ok) {
            console.warn(
              `Risk analysis failed for loan ${loan.id}`
            );

            continue;
          }

          const result: RiskAssessment =
            await response.json();

          results.push(result);
        } catch (error) {
          console.warn(
            `Unable to analyze loan ${loan.id}`,
            error
          );
        }
      }

      setRiskData(results);

      setMessage(
        `Risk analysis completed for ${results.length} loan(s).`
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
  // DERIVED METRICS
  // =========================================================

  const calculatedMetrics = useMemo(() => {
    const total = loans.length;

    const verified =
      loans.filter(
        (loan) =>
          loan.verificationStatus
            ?.toUpperCase() === "VERIFIED"
      ).length;

    const pending =
      loans.filter(
        (loan) =>
          loan.verificationStatus
            ?.toUpperCase() === "PENDING"
      ).length;

    const review =
      loans.filter(
        (loan) =>
          loan.verificationStatus
            ?.toUpperCase() ===
          "NEEDS_REVIEW"
      ).length;

    const rejected =
      loans.filter(
        (loan) =>
          loan.verificationStatus
            ?.toUpperCase() === "REJECTED"
      ).length;

    const totalOriginal =
      loans.reduce(
        (sum, loan) =>
          sum +
          Number(
            loan.originalLoanAmount || 0
          ),
        0
      );

    const totalBalance =
      loans.reduce(
        (sum, loan) =>
          sum +
          Number(
            loan.currentBalance || 0
          ),
        0
      );

    const utilization =
      totalOriginal > 0
        ? (totalBalance /
            totalOriginal) *
          100
        : 0;

    const averageInterest =
      total > 0
        ? loans.reduce(
            (sum, loan) =>
              sum +
              Number(
                loan.interestRate || 0
              ),
            0
          ) / total
        : 0;

    const averageTerm =
      total > 0
        ? loans.reduce(
            (sum, loan) =>
              sum +
              Number(
                loan.loanTermMonths || 0
              ),
            0
          ) / total
        : 0;

    const validationIssues =
      loans.reduce(
        (sum, loan) =>
          sum +
          Number(
            loan.validationErrorCount || 0
          ),
        0
      );

    return {
      total,
      verified,
      pending,
      review,
      rejected,
      totalOriginal,
      totalBalance,
      utilization,
      averageInterest,
      averageTerm,
      validationIssues,
    };
  }, [loans]);

  // =========================================================
  // RISK METRICS
  // =========================================================

  const riskMetrics = useMemo(() => {
    const high =
      riskData.filter(
        (item) =>
          item.riskLevel?.toUpperCase() ===
          "HIGH"
      ).length;

    const medium =
      riskData.filter(
        (item) =>
          item.riskLevel?.toUpperCase() ===
          "MEDIUM"
      ).length;

    const low =
      riskData.filter(
        (item) =>
          item.riskLevel?.toUpperCase() ===
          "LOW"
      ).length;

    const averageScore =
      riskData.length > 0
        ? riskData.reduce(
            (sum, item) =>
              sum +
              Number(item.riskScore || 0),
            0
          ) / riskData.length
        : 0;

    return {
      high,
      medium,
      low,
      averageScore,
    };
  }, [riskData]);

  // =========================================================
  // AUDIT METRICS
  // =========================================================

  const auditMetrics = useMemo(() => {
    const validationRuns =
      auditLogs.filter(
        (log) =>
          log.eventType ===
          "VALIDATION_RUN"
      ).length;

    const approvals =
      auditLogs.filter(
        (log) =>
          log.eventType ===
          "RECORD_APPROVED"
      ).length;

    const rejections =
      auditLogs.filter(
        (log) =>
          log.eventType ===
          "RECORD_REJECTED"
      ).length;

    const aiRecommendations =
      auditLogs.filter(
        (log) =>
          log.eventType ===
          "AI_RECOMMENDATION_GENERATED"
      ).length;

    const updates =
      auditLogs.filter(
        (log) =>
          log.eventType ===
          "RECORD_UPDATED"
      ).length;

    const recordsCreated =
      auditLogs.filter(
        (log) =>
          log.eventType ===
          "RECORD_CREATED"
      ).length;

    return {
      validationRuns,
      approvals,
      rejections,
      aiRecommendations,
      updates,
      recordsCreated,
    };
  }, [auditLogs]);

  // =========================================================
  // FORMAT MONEY
  // =========================================================

  function formatMoney(
    value:
      | number
      | null
      | undefined
  ): string {
    if (
      value === null ||
      value === undefined ||
      Number.isNaN(Number(value))
    ) {
      return "₹0";
    }

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(Number(value));
  }

  // =========================================================
  // FORMAT PERCENTAGE
  // =========================================================

  function formatPercent(
    value: number
  ): string {
    if (
      value === null ||
      value === undefined ||
      Number.isNaN(Number(value))
    ) {
      return "0.0%";
    }

    return `${Number(value).toFixed(1)}%`;
  }

  // =========================================================
  // STATUS CLASS
  // =========================================================

  function statusClass(
    status: string
  ): string {
    switch (
      status
        ?.toUpperCase()
        .replaceAll(" ", "_")
    ) {
      case "VERIFIED":
        return "analytics-status verified";

      case "NEEDS_REVIEW":
        return "analytics-status review";

      case "REJECTED":
        return "analytics-status rejected";

      case "PENDING":
        return "analytics-status pending";

      default:
        return "analytics-status";
    }
  }

  // =========================================================
  // RISK CLASS
  // =========================================================

  function riskClass(
    level: string
  ): string {
    switch (
      level?.toUpperCase()
    ) {
      case "HIGH":
        return "risk-pill high";

      case "MEDIUM":
        return "risk-pill medium";

      case "LOW":
        return "risk-pill low";

      default:
        return "risk-pill";
    }
  }

  // =========================================================
  // RENDER LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="analytics-page">

        <div className="analytics-loading">

          <div className="analytics-spinner" />

          <h2>
            Loading analytics
          </h2>

          <p>
            Preparing portfolio,
            verification and risk
            insights...
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="analytics-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="analytics-header">

        <div>

          <button
            className="analytics-back"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Dashboard
          </button>

          <div className="analytics-eyebrow">
            LOANGUARD INTELLIGENCE
          </div>

          <h1>
            Analytics
          </h1>

          <p>
            Portfolio intelligence,
            verification performance and
            AI-assisted risk insights.
          </p>

        </div>

        <div className="analytics-header-actions">

          <button
            className="analytics-secondary-button"
            onClick={() =>
              void loadAnalytics()
            }
            disabled={loading}
          >
            ↻ Refresh
          </button>

          <button
            className="analytics-primary-button"
            onClick={() =>
              void runRiskAnalysis()
            }
            disabled={
              riskLoading ||
              loans.length === 0
            }
          >
            {riskLoading
              ? "Analyzing..."
              : "Run Risk Analysis"}
          </button>

        </div>

      </header>

      {/* ===================================================
          MESSAGE
      =================================================== */}

      {message && (
        <div className="analytics-message">
          {message}
        </div>
      )}

      <main className="analytics-content">

        {/* =================================================
            TOP METRICS
        ================================================= */}

        <section className="analytics-metrics">

          <div className="analytics-metric-card">

            <div className="analytics-metric-top">

              <span>
                TOTAL LOANS
              </span>

              <div className="analytics-metric-icon">
                ◈
              </div>

            </div>

            <strong>
              {summary?.totalLoans ??
                calculatedMetrics.total}
            </strong>

            <small>
              Records in portfolio
            </small>

          </div>

          <div className="analytics-metric-card">

            <div className="analytics-metric-top">

              <span>
                VERIFIED
              </span>

              <div className="analytics-metric-icon green">
                ✓
              </div>

            </div>

            <strong>
              {summary?.verifiedLoans ??
                calculatedMetrics.verified}
            </strong>

            <small className="green-text">
              {formatPercent(
                summary?.verificationRate ??
                  (
                    calculatedMetrics.total >
                    0
                      ? (
                          calculatedMetrics.verified /
                          calculatedMetrics.total
                        ) *
                        100
                      : 0
                  )
              )}{" "}
              verification rate
            </small>

          </div>

          <div className="analytics-metric-card">

            <div className="analytics-metric-top">

              <span>
                NEEDS REVIEW
              </span>

              <div className="analytics-metric-icon yellow">
                !
              </div>

            </div>

            <strong>
              {summary?.needsReviewLoans ??
                calculatedMetrics.review}
            </strong>

            <small className="yellow-text">
              Human attention required
            </small>

          </div>

          <div className="analytics-metric-card">

            <div className="analytics-metric-top">

              <span>
                VALIDATION EXCEPTIONS
              </span>

              <div className="analytics-metric-icon red">
                !
              </div>

            </div>

            <strong>
              {summary?.validationExceptions ??
                calculatedMetrics.validationIssues}
            </strong>

            <small className="red-text">
              Data-quality issues
            </small>

          </div>

        </section>

        {/* =================================================
            PORTFOLIO OVERVIEW
        ================================================= */}

        <section className="analytics-grid">

          <div className="analytics-card portfolio-overview">

            <div className="analytics-card-header">

              <div>

                <span className="analytics-label">
                  PORTFOLIO OVERVIEW
                </span>

                <h2>
                  Loan Exposure
                </h2>

              </div>

              <span className="analytics-period">
                Current portfolio
              </span>

            </div>

            <div className="exposure-main">

              <div>

                <span>
                  OUTSTANDING BALANCE
                </span>

                <strong>
                  {formatMoney(
                    calculatedMetrics.totalBalance
                  )}
                </strong>

              </div>

              <div className="exposure-original">

                <span>
                  ORIGINAL PRINCIPAL
                </span>

                <strong>
                  {formatMoney(
                    calculatedMetrics.totalOriginal
                  )}
                </strong>

              </div>

            </div>

            <div className="exposure-progress">

              <div className="progress-header">

                <span>
                  Portfolio utilization
                </span>

                <strong>
                  {formatPercent(
                    calculatedMetrics.utilization
                  )}
                </strong>

              </div>

              <div className="progress-track">

                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(
                      Math.max(
                        calculatedMetrics.utilization,
                        0
                      ),
                      100
                    )}%`,
                  }}
                />

              </div>

            </div>

            <div className="portfolio-stats">

              <div>

                <span>
                  AVG. INTEREST
                </span>

                <strong>
                  {calculatedMetrics.averageInterest.toFixed(
                    2
                  )}
                  %
                </strong>

              </div>

              <div>

                <span>
                  AVG. TERM
                </span>

                <strong>
                  {Math.round(
                    calculatedMetrics.averageTerm
                  )}{" "}
                  mo
                </strong>

              </div>

              <div>

                <span>
                  TOTAL RECORDS
                </span>

                <strong>
                  {calculatedMetrics.total}
                </strong>

              </div>

            </div>

          </div>

          {/* =================================================
              VERIFICATION DISTRIBUTION
          ================================================= */}

          <div className="analytics-card">

            <div className="analytics-card-header">

              <div>

                <span className="analytics-label">
                  VERIFICATION
                </span>

                <h2>
                  Record Distribution
                </h2>

              </div>

            </div>

            <div className="distribution">

              <div className="distribution-bar">

                {calculatedMetrics.total >
                  0 && (
                  <>
                    <div
                      className="bar-verified"
                      style={{
                        width: `${
                          (
                            calculatedMetrics.verified /
                            calculatedMetrics.total
                          ) *
                          100
                        }%`,
                      }}
                    />

                    <div
                      className="bar-review"
                      style={{
                        width: `${
                          (
                            calculatedMetrics.review /
                            calculatedMetrics.total
                          ) *
                          100
                        }%`,
                      }}
                    />

                    <div
                      className="bar-pending"
                      style={{
                        width: `${
                          (
                            calculatedMetrics.pending /
                            calculatedMetrics.total
                          ) *
                          100
                        }%`,
                      }}
                    />

                    <div
                      className="bar-rejected"
                      style={{
                        width: `${
                          (
                            calculatedMetrics.rejected /
                            calculatedMetrics.total
                          ) *
                          100
                        }%`,
                      }}
                    />
                  </>
                )}

              </div>

              <div className="distribution-list">

                <div>

                  <span>
                    <i className="dot verified" />
                    Verified
                  </span>

                  <strong>
                    {calculatedMetrics.verified}
                  </strong>

                </div>

                <div>

                  <span>
                    <i className="dot review" />
                    Needs Review
                  </span>

                  <strong>
                    {calculatedMetrics.review}
                  </strong>

                </div>

                <div>

                  <span>
                    <i className="dot pending" />
                    Pending
                  </span>

                  <strong>
                    {calculatedMetrics.pending}
                  </strong>

                </div>

                <div>

                  <span>
                    <i className="dot rejected" />
                    Rejected
                  </span>

                  <strong>
                    {calculatedMetrics.rejected}
                  </strong>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            RISK INTELLIGENCE
        ================================================= */}

        <section className="analytics-card risk-intelligence">

          <div className="analytics-card-header">

            <div>

              <span className="analytics-label">
                AI-ASSISTED RISK INTELLIGENCE
              </span>

              <h2>
                Portfolio Risk Profile
              </h2>

              <p>
                Rule-based risk assessment using
                validation, balance utilization,
                interest rate, maturity and
                verification signals.
              </p>

            </div>

            <div className="risk-average">

              <span>
                AVG. RISK SCORE
              </span>

              <strong>
                {riskData.length
                  ? riskMetrics.averageScore.toFixed(
                      0
                    )
                  : "—"}
              </strong>

              {riskData.length > 0 && (
                <small>
                  / 100
                </small>
              )}

            </div>

          </div>

          <div className="risk-grid">

            <div className="risk-count-card high">

              <span>
                HIGH RISK
              </span>

              <strong>
                {riskMetrics.high}
              </strong>

              <small>
                Immediate attention
              </small>

            </div>

            <div className="risk-count-card medium">

              <span>
                MEDIUM RISK
              </span>

              <strong>
                {riskMetrics.medium}
              </strong>

              <small>
                Additional verification
              </small>

            </div>

            <div className="risk-count-card low">

              <span>
                LOW RISK
              </span>

              <strong>
                {riskMetrics.low}
              </strong>

              <small>
                Appears stable
              </small>

            </div>

          </div>

          {riskData.length === 0 ? (

            <div className="risk-empty">

              <div className="risk-empty-icon">
                ◇
              </div>

              <strong>
                No risk analysis loaded
              </strong>

              <span>
                Run risk analysis to calculate
                portfolio-level risk indicators.
              </span>

              <button
                className="analytics-secondary-button"
                onClick={() =>
                  void runRiskAnalysis()
                }
                disabled={
                  riskLoading ||
                  loans.length === 0
                }
              >
                {riskLoading
                  ? "Analyzing..."
                  : "Analyze Portfolio"}
              </button>

            </div>

          ) : (

            <div className="risk-table-wrapper">

              <table className="risk-table">

                <thead>

                  <tr>

                    <th>
                      LOAN
                    </th>

                    <th>
                      RISK SCORE
                    </th>

                    <th>
                      LEVEL
                    </th>

                    <th>
                      CONFIDENCE
                    </th>

                    <th>
                      RECOMMENDATION
                    </th>

                    <th>
                      ACTION
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {[...riskData]
                    .sort(
                      (a, b) =>
                        b.riskScore -
                        a.riskScore
                    )
                    .slice(0, 10)
                    .map((risk) => (

                      <tr
                        key={
                          risk.loanId
                        }
                      >

                        <td>

                          <strong>
                            {risk.loanNumber}
                          </strong>

                        </td>

                        <td>

                          <div className="score-cell">

                            <strong>
                              {risk.riskScore}
                            </strong>

                            <div className="mini-score">

                              <span
                                style={{
                                  width: `${Math.min(
                                    Math.max(
                                      risk.riskScore,
                                      0
                                    ),
                                    100
                                  )}%`,
                                }}
                              />

                            </div>

                          </div>

                        </td>

                        <td>

                          <span
                            className={riskClass(
                              risk.riskLevel
                            )}
                          >
                            {risk.riskLevel}
                          </span>

                        </td>

                        <td>
                          {risk.confidence}%
                        </td>

                        <td>

                          <span className="recommendation">
                            {(
                              risk.recommendation ||
                              "—"
                            ).replaceAll(
                              "_",
                              " "
                            )}
                          </span>

                        </td>

                        <td>

                          <button
                            className="table-action"
                            onClick={() =>
                              navigate(
                                `/reviewer/${risk.loanId}`
                              )
                            }
                          >
                            Review →
                          </button>

                        </td>

                      </tr>

                    ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* =================================================
            OPERATIONS + AUDIT
        ================================================= */}

        <section className="analytics-grid bottom">

          <div className="analytics-card">

            <div className="analytics-card-header">

              <div>

                <span className="analytics-label">
                  OPERATIONS
                </span>

                <h2>
                  Verification Activity
                </h2>

              </div>

            </div>

            <div className="operation-list">

              <div>

                <div className="operation-icon">
                  ✓
                </div>

                <div>

                  <strong>
                    Approved Records
                  </strong>

                  <span>
                    Successful reviewer
                    approvals
                  </span>

                </div>

                <b>
                  {auditMetrics.approvals}
                </b>

              </div>

              <div>

                <div className="operation-icon">
                  ◇
                </div>

                <div>

                  <strong>
                    AI Recommendations
                  </strong>

                  <span>
                    AI-assisted review events
                  </span>

                </div>

                <b>
                  {
                    auditMetrics.aiRecommendations
                  }
                </b>

              </div>

              <div>

                <div className="operation-icon">
                  !
                </div>

                <div>

                  <strong>
                    Validation Runs
                  </strong>

                  <span>
                    Data-quality checks
                  </span>

                </div>

                <b>
                  {
                    auditMetrics.validationRuns
                  }
                </b>

              </div>

              <div>

                <div className="operation-icon">
                  ↻
                </div>

                <div>

                  <strong>
                    Record Updates
                  </strong>

                  <span>
                    Reviewer modifications
                  </span>

                </div>

                <b>
                  {auditMetrics.updates}
                </b>

              </div>

              <div>

                <div className="operation-icon">
                  ×
                </div>

                <div>

                  <strong>
                    Rejected Records
                  </strong>

                  <span>
                    Reviewer rejection events
                  </span>

                </div>

                <b>
                  {auditMetrics.rejections}
                </b>

              </div>

            </div>

          </div>

          {/* =================================================
              AI REVIEW SUMMARY
          ================================================= */}

          <div className="analytics-card">

            <div className="analytics-card-header">

              <div>

                <span className="analytics-label">
                  AI REVIEW
                </span>

                <h2>
                  Recommendation Summary
                </h2>

              </div>

            </div>

            {aiReviews.length === 0 ? (

              <div className="ai-summary-empty">

                <span>
                  AI recommendations are
                  generated from individual
                  reviewer sessions.
                </span>

                <small>
                  Open a loan in AI Reviewer
                  to generate a fresh
                  recommendation.
                </small>

                <button
                  className="analytics-secondary-button"
                  onClick={() =>
                    navigate("/loans")
                  }
                >
                  Open Loan Records →
                </button>

              </div>

            ) : (

              <div className="ai-summary-list">

                {aiReviews
                  .slice(0, 5)
                  .map((review) => (

                    <div
                      key={`${review.loanId}-${review.generatedAt}`}
                    >

                      <div>

                        <strong>
                          {review.loanNumber}
                        </strong>

                        <span>
                          {review.summary}
                        </span>

                      </div>

                      <span
                        className={
                          review.severity?.toLowerCase()
                        }
                      >
                        {review.severity}
                      </span>

                    </div>

                  ))}

              </div>

            )}

          </div>

        </section>

        {/* =================================================
            AUDIT TRAIL
        ================================================= */}

        <section className="analytics-card">

          <div className="analytics-card-header">

            <div>

              <span className="analytics-label">
                AUDIT TRAIL
              </span>

              <h2>
                Recent System Activity
              </h2>

              <p>
                Immutable reviewer, validation and
                AI recommendation events collected
                from the loan audit history.
              </p>

            </div>

            <span className="analytics-period">
              {auditLogs.length} events
            </span>

          </div>

          {auditLogs.length === 0 ? (

            <div className="ai-summary-empty">

              <span>
                No audit events available.
              </span>

              <small>
                Audit activity will appear here
                after loan validation, updates,
                AI review or verification actions.
              </small>

            </div>

          ) : (

            <div className="analytics-table-wrapper">

              <table className="analytics-table">

                <thead>

                  <tr>

                    <th>
                      TIME
                    </th>

                    <th>
                      LOAN
                    </th>

                    <th>
                      EVENT
                    </th>

                    <th>
                      ACTOR
                    </th>

                    <th>
                      DESCRIPTION
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {auditLogs
                    .slice(0, 15)
                    .map((log) => (

                      <tr
                        key={log.id}
                      >

                        <td>
                          {new Date(
                            log.createdAt
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td>

                          <strong>
                            {log.loanNumber}
                          </strong>

                        </td>

                        <td>

                          <span className="analytics-status">
                            {log.eventType
                              ?.replaceAll(
                                "_",
                                " "
                              )}
                          </span>

                        </td>

                        <td>
                          {log.actor}
                        </td>

                        <td>
                          {log.description}
                        </td>

                      </tr>

                    ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* =================================================
            RECENT LOANS
        ================================================= */}

        <section className="analytics-card recent-loans">

          <div className="analytics-card-header">

            <div>

              <span className="analytics-label">
                PORTFOLIO RECORDS
              </span>

              <h2>
                Recent Loan Records
              </h2>

            </div>

            <button
              className="analytics-secondary-button"
              onClick={() =>
                navigate("/loans")
              }
            >
              View All Loans →
            </button>

          </div>

          <div className="analytics-table-wrapper">

            <table className="analytics-table">

              <thead>

                <tr>

                  <th>
                    LOAN
                  </th>

                  <th>
                    BORROWER
                  </th>

                  <th>
                    ORIGINAL
                  </th>

                  <th>
                    BALANCE
                  </th>

                  <th>
                    INTEREST
                  </th>

                  <th>
                    STATUS
                  </th>

                  <th>
                    ACTION
                  </th>

                </tr>

              </thead>

              <tbody>

                {loans
                  .slice(0, 10)
                  .map((loan) => (

                    <tr
                      key={loan.id}
                      onClick={() =>
                        navigate(
                          `/reviewer/${loan.id}`
                        )
                      }
                    >

                      <td>

                        <strong>
                          {loan.loanNumber}
                        </strong>

                      </td>

                      <td>
                        {loan.borrowerName}
                      </td>

                      <td>
                        {formatMoney(
                          loan.originalLoanAmount
                        )}
                      </td>

                      <td>
                        {formatMoney(
                          loan.currentBalance
                        )}
                      </td>

                      <td>
                        {Number(
                          loan.interestRate || 0
                        ).toFixed(2)}
                        %
                      </td>

                      <td>

                        <span
                          className={statusClass(
                            loan.verificationStatus
                          )}
                        >
                          {(
                            loan.verificationStatus ||
                            "UNKNOWN"
                          ).replaceAll(
                            "_",
                            " "
                          )}
                        </span>

                      </td>

                      <td>

                        <button
                          className="table-action"
                          onClick={(event) => {
                            event.stopPropagation();

                            navigate(
                              `/reviewer/${loan.id}`
                            );
                          }}
                        >
                          Review →
                        </button>

                      </td>

                    </tr>

                  ))}

              </tbody>

            </table>

            {loans.length === 0 && (
              <div className="analytics-no-data">
                No loan records available.
              </div>
            )}

          </div>

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="analytics-footer-note">

          <span>
            LoanGuard Intelligence
          </span>

          <span>
            Analytics are derived from
            configured validation, risk and
            audit rules.
          </span>

        </div>

      </main>

    </div>
  );
}

export default Analytics;