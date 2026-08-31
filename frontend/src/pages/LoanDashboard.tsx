import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

interface Loan {
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
  verificationStatus: string;
  validationErrorCount: number;
}

interface Stats {
  total: number;
  pending: number;
  verified: number;
  needsReview: number;
  rejected: number;
}

const API = "https://loanguard-ai-2y9l.onrender.com/api";

function LoanDashboard() {
  const navigate = useNavigate();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * ============================================================
   * LOAD LOANS
   * ============================================================
   */

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API}/loans`);

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid loan data received from backend");
      }

      setLoans(data);
    } catch (err) {
      console.error("Loan dashboard error:", err);

      setLoans([]);

      setError(
        "Unable to connect to LoanGuard backend. Make sure Spring Boot is running on port 8082."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /*
   * ============================================================
   * HELPERS
   * ============================================================
   */

  const normalizeStatus = (status?: string) => {
    return String(status || "")
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_");
  };

  const formatStatus = (status?: string) => {
    return String(status || "UNKNOWN")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  const openReviewer = (loanId: number) => {
    navigate(`/reviewer/${loanId}`);
  };

  /*
   * ============================================================
   * CALCULATED STATS
   * ============================================================
   */

  const stats: Stats = useMemo(() => {
    let pending = 0;
    let verified = 0;
    let needsReview = 0;
    let rejected = 0;

    loans.forEach((loan) => {
      const status = normalizeStatus(
        loan.verificationStatus
      );

      const errorCount = Number(
        loan.validationErrorCount || 0
      );

      if (status === "VERIFIED") {
        verified++;
      } else if (status === "PENDING") {
        pending++;
      } else if (
        status === "NEEDS_REVIEW" ||
        status === "REVIEW"
      ) {
        needsReview++;
      } else if (status === "REJECTED") {
        rejected++;
      } else if (errorCount > 0) {
        needsReview++;
      } else {
        pending++;
      }
    });

    return {
      total: loans.length,
      pending,
      verified,
      needsReview,
      rejected,
    };
  }, [loans]);

  /*
   * ============================================================
   * PORTFOLIO CALCULATIONS
   * ============================================================
   */

  const totalLoanValue = useMemo(() => {
    return loans.reduce(
      (sum, loan) =>
        sum + Number(loan.originalLoanAmount || 0),
      0
    );
  }, [loans]);

  const currentBalance = useMemo(() => {
    return loans.reduce(
      (sum, loan) =>
        sum + Number(loan.currentBalance || 0),
      0
    );
  }, [loans]);

  const totalValidationErrors = useMemo(() => {
    return loans.reduce(
      (sum, loan) =>
        sum + Number(loan.validationErrorCount || 0),
      0
    );
  }, [loans]);

  const activeLoans = useMemo(() => {
    return loans.filter(
      (loan) =>
        normalizeStatus(loan.loanStatus) === "ACTIVE"
    ).length;
  }, [loans]);

  const verificationPercentage =
    stats.total > 0
      ? Math.round(
          (stats.verified / stats.total) * 100
        )
      : 0;

  /*
   * ============================================================
   * ATTENTION LOANS
   * ============================================================
   */

  const needsAttention = useMemo(() => {
    return loans.filter((loan) => {
      const status = normalizeStatus(
        loan.verificationStatus
      );

      const errors = Number(
        loan.validationErrorCount || 0
      );

      return (
        status === "NEEDS_REVIEW" ||
        status === "REVIEW" ||
        status === "REJECTED" ||
        errors > 0
      );
    });
  }, [loans]);

  /*
   * ============================================================
   * LOADING SCREEN
   * ============================================================
   */

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>

          <h2>Loading LoanGuard...</h2>

          <p>
            Connecting to the verification engine
          </p>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * ERROR SCREEN
   * ============================================================
   */

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-error">
          <div className="error-icon">!</div>

          <h2>Backend connection failed</h2>

          <p>{error}</p>

          <button
            className="upload-button"
            onClick={loadDashboard}
          >
            Retry connection
          </button>

          <button
            className="view-button"
            onClick={() => navigate("/")}
            style={{ marginTop: "15px" }}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * MAIN DASHBOARD
   * ============================================================
   */

  return (
    <div className="dashboard">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sidebar">

        {/* BRAND */}

        <div className="brand">

          <div className="brand-logo">
            L
          </div>

          <div>
            <div className="brand-name">
              LoanGuard
            </div>

            <div className="brand-ai">
              AI
            </div>
          </div>

        </div>

        <div className="sidebar-label">
          WORKSPACE
        </div>

        <nav className="navigation">

          {/* OVERVIEW */}

          <button
            className="nav-item"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span>⌂</span>
            <span>Overview</span>
          </button>

          {/* LOAN RECORDS */}

          <button
            className="nav-item"
            onClick={() =>
              navigate("/loans")
            }
          >
            <span>▣</span>

            <span>Loan Records</span>

            {stats.total > 0 && (
              <span className="badge">
                {stats.total}
              </span>
            )}
          </button>

          {/* EXCEPTIONS */}

          <button
            className="nav-item active"
            onClick={() =>
              navigate("/loan-dashboard")
            }
          >
            <span>!</span>

            <span>Exceptions</span>

            {stats.needsReview > 0 && (
              <span className="badge">
                {stats.needsReview}
              </span>
            )}
          </button>

          {/* AI COPILOT */}

          <button
            className="nav-item"
            onClick={() =>
              navigate("/loan-dashboard")
            }
          >
            <span>✦</span>
            <span>AI Copilot</span>
          </button>

          {/* AUDIT TRAIL */}

          <button
            className="nav-item"
            onClick={() =>
              navigate("/loans")
            }
          >
            <span>✓</span>
            <span>Audit Trail</span>
          </button>

        </nav>

        <div className="sidebar-bottom">

          {/* SETTINGS */}

          <button
            className="nav-item"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span>⚙</span>
            <span>Settings</span>
          </button>

          {/* SIGN OUT */}

          <button
            className="nav-item"
            onClick={() =>
              navigate("/")
            }
          >
            <span>↪</span>
            <span>Sign out</span>
          </button>

        </div>

      </aside>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="dashboard-main">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <div className="eyebrow">
              LOAN VERIFICATION WORKSPACE
            </div>

            <h1>
              Loan verification workspace
            </h1>

            <p>
              Monitor loan data quality, verification
              status, and exceptions in real time.
            </p>

          </div>

          <div className="user-area">

            <button
              className="notification"
              onClick={loadDashboard}
              title="Refresh dashboard"
            >
              ↻
            </button>

            <div className="avatar">
              SP
            </div>

            <div className="user-details">

              <strong>
                Shashwat Pandey
              </strong>

              <span>
                Data Operations
              </span>

            </div>

          </div>

        </header>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <section className="dashboard-content">

          {/* SECTION HEADER */}

          <div className="section-heading">

            <div>

              <div className="section-label">
                DATA HEALTH
              </div>

              <h2>
                Verification overview
              </h2>

            </div>

            <button
              className="upload-button"
              onClick={() =>
                navigate("/upload")
              }
            >
              + Upload loan tape
            </button>

          </div>

          {/* ==================================================
              METRICS
          ================================================== */}

          <div className="metrics">

            {/* TOTAL */}

            <div className="metric-card">

              <div className="metric-header">

                <span>
                  TOTAL LOANS
                </span>

                <div className="metric-icon">
                  ▣
                </div>

              </div>

              <div className="metric-number">
                {stats.total.toLocaleString("en-IN")}
              </div>

              <div className="metric-positive">
                Live database records
              </div>

            </div>

            {/* PORTFOLIO */}

            <div className="metric-card">

              <div className="metric-header">

                <span>
                  PORTFOLIO VALUE
                </span>

                <div className="metric-icon">
                  ₹
                </div>

              </div>

              <div className="metric-number">
                {formatCurrency(totalLoanValue)}
              </div>

              <div className="metric-positive">
                Original loan value
              </div>

            </div>

            {/* VERIFIED */}

            <div className="metric-card">

              <div className="metric-header">

                <span>
                  VERIFIED RECORDS
                </span>

                <div className="metric-icon">
                  ✓
                </div>

              </div>

              <div className="metric-number">
                {stats.verified.toLocaleString(
                  "en-IN"
                )}
              </div>

              <div className="metric-positive">
                {verificationPercentage}% verified
              </div>

            </div>

            {/* NEEDS ATTENTION */}

            <div className="metric-card">

              <div className="metric-header">

                <span>
                  NEEDS ATTENTION
                </span>

                <div className="metric-icon warning">
                  !
                </div>

              </div>

              <div className="metric-number">
                {(
                  stats.pending +
                  stats.needsReview +
                  stats.rejected
                ).toLocaleString("en-IN")}
              </div>

              <div className="metric-warning">
                Pending / review / rejected
              </div>

            </div>

          </div>

          {/* ==================================================
              MAIN GRID
          ================================================== */}

          <div className="main-grid">

            {/* VERIFICATION STATUS */}

            <div className="card activity-card">

              <div className="card-header">

                <div>

                  <div className="card-label">
                    VERIFICATION STATUS
                  </div>

                  <h3>
                    Loan portfolio health
                  </h3>

                </div>

                <button
                  className="view-button"
                  onClick={() =>
                    navigate("/loans")
                  }
                >
                  View records →
                </button>

              </div>

              <div className="status-overview">

                {/* PENDING */}

                <div className="status-row">

                  <div className="status-name">

                    <span className="status-dot pending-dot"></span>

                    Pending

                  </div>

                  <strong>
                    {stats.pending}
                  </strong>

                </div>

                <div className="status-progress">

                  <div
                    style={{
                      width: `${
                        stats.total
                          ? Math.min(
                              (stats.pending /
                                stats.total) *
                                100,
                              100
                            )
                          : 0
                      }%`,
                    }}
                  />

                </div>

                {/* VERIFIED */}

                <div className="status-row">

                  <div className="status-name">

                    <span className="status-dot verified-dot"></span>

                    Verified

                  </div>

                  <strong>
                    {stats.verified}
                  </strong>

                </div>

                <div className="status-progress">

                  <div
                    style={{
                      width: `${
                        stats.total
                          ? Math.min(
                              (stats.verified /
                                stats.total) *
                                100,
                              100
                            )
                          : 0
                      }%`,
                    }}
                  />

                </div>

                {/* REVIEW */}

                <div className="status-row">

                  <div className="status-name">

                    <span className="status-dot review-dot"></span>

                    Needs Review

                  </div>

                  <strong>
                    {stats.needsReview}
                  </strong>

                </div>

                <div className="status-progress">

                  <div
                    style={{
                      width: `${
                        stats.total
                          ? Math.min(
                              (stats.needsReview /
                                stats.total) *
                                100,
                              100
                            )
                          : 0
                      }%`,
                    }}
                  />

                </div>

                {/* REJECTED */}

                <div className="status-row">

                  <div className="status-name">

                    <span className="status-dot rejected-dot"></span>

                    Rejected

                  </div>

                  <strong>
                    {stats.rejected}
                  </strong>

                </div>

                <div className="status-progress">

                  <div
                    style={{
                      width: `${
                        stats.total
                          ? Math.min(
                              (stats.rejected /
                                stats.total) *
                                100,
                              100
                            )
                          : 0
                      }%`,
                    }}
                  />

                </div>

              </div>

            </div>

            {/* PORTFOLIO */}

            <div className="card exceptions-card">

              <div className="card-header">

                <div>

                  <div className="card-label">
                    PORTFOLIO
                  </div>

                  <h3>
                    Financial exposure
                  </h3>

                </div>

              </div>

              <div className="portfolio-value">
                {formatCurrency(currentBalance)}
              </div>

              <p className="portfolio-label">
                Current outstanding balance
              </p>

              <div className="portfolio-stat">

                <span>
                  Original loan value
                </span>

                <strong>
                  {formatCurrency(
                    totalLoanValue
                  )}
                </strong>

              </div>

              <div className="portfolio-stat">

                <span>
                  Active loans
                </span>

                <strong>
                  {activeLoans}
                </strong>

              </div>

              <div className="portfolio-stat">

                <span>
                  Data errors
                </span>

                <strong>
                  {totalValidationErrors}
                </strong>

              </div>

            </div>

          </div>

          {/* ==================================================
              RECENT LOANS
          ================================================== */}

          <div className="card records-card">

            <div className="card-header">

              <div>

                <div className="card-label">
                  RECENT LOANS
                </div>

                <h3>
                  Loan records
                </h3>

              </div>

              <button
                className="view-button"
                onClick={() =>
                  navigate("/loans")
                }
              >
                View all →
              </button>

            </div>

            {loans.length === 0 ? (

              <div className="empty-state">

                <div>▣</div>

                <h3>
                  No loans found
                </h3>

                <p>
                  Upload a loan tape to begin
                  verification.
                </p>

                <button
                  className="upload-button"
                  onClick={() =>
                    navigate("/upload")
                  }
                >
                  Upload loan tape
                </button>

              </div>

            ) : (

              <div className="loan-table-wrapper">

                <table className="loan-table">

                  <thead>

                    <tr>

                      <th>
                        Loan
                      </th>

                      <th>
                        Borrower
                      </th>

                      <th>
                        Balance
                      </th>

                      <th>
                        Interest
                      </th>

                      <th>
                        Loan Status
                      </th>

                      <th>
                        Verification
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {loans
                      .slice(0, 6)
                      .map((loan) => (

                        <tr
                          key={loan.id}
                          onClick={() =>
                            openReviewer(
                              loan.id
                            )
                          }
                          style={{
                            cursor: "pointer",
                          }}
                        >

                          <td>

                            <strong>
                              {loan.loanNumber ||
                                `LOAN-${loan.id}`}
                            </strong>

                          </td>

                          <td>
                            {loan.borrowerName ||
                              "Unknown borrower"}
                          </td>

                          <td>
                            {formatCurrency(
                              Number(
                                loan.currentBalance ||
                                  0
                              )
                            )}
                          </td>

                          <td>
                            {Number(
                              loan.interestRate || 0
                            ).toFixed(2)}
                            %
                          </td>

                          <td>

                            <span className="status-badge">
                              {formatStatus(
                                loan.loanStatus
                              )}
                            </span>

                          </td>

                          <td>

                            <span
                              className={`verification-badge ${
                                normalizeStatus(
                                  loan.verificationStatus
                                ) ===
                                "VERIFIED"
                                  ? "verified"
                                  : normalizeStatus(
                                      loan.verificationStatus
                                    ) ===
                                    "REJECTED"
                                  ? "rejected"
                                  : normalizeStatus(
                                      loan.verificationStatus
                                    ) ===
                                      "NEEDS_REVIEW" ||
                                    normalizeStatus(
                                      loan.verificationStatus
                                    ) ===
                                      "REVIEW"
                                  ? "review"
                                  : "pending"
                              }`}
                            >
                              {formatStatus(
                                loan.verificationStatus
                              )}
                            </span>

                          </td>

                        </tr>

                      ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

          {/* ==================================================
              ATTENTION
          ================================================== */}

          <div className="card attention-card">

            <div className="card-header">

              <div>

                <div className="card-label">
                  NEEDS ATTENTION
                </div>

                <h3>
                  Verification exceptions
                </h3>

              </div>

              <button
                className="view-button"
                onClick={() =>
                  navigate("/loans")
                }
              >
                Review →
              </button>

            </div>

            {needsAttention.length === 0 ? (

              <div className="all-good">

                <span>
                  ✓
                </span>

                <div>

                  <strong>
                    No critical exceptions
                  </strong>

                  <p>
                    All current loan records are
                    passing verification checks.
                  </p>

                </div>

              </div>

            ) : (

              <div className="exception-list">

                {needsAttention
                  .slice(0, 5)
                  .map((loan) => {

                    const status =
                      normalizeStatus(
                        loan.verificationStatus
                      );

                    const errorCount =
                      Number(
                        loan.validationErrorCount ||
                          0
                      );

                    return (
                      <div
                        className="exception"
                        key={loan.id}
                        onClick={() =>
                          openReviewer(
                            loan.id
                          )
                        }
                        style={{
                          cursor: "pointer",
                        }}
                      >

                        <div className="exception-icon high">
                          !
                        </div>

                        <div className="exception-content">

                          <strong>

                            {errorCount > 0
                              ? `${errorCount} validation error${
                                  errorCount === 1
                                    ? ""
                                    : "s"
                                }`
                              : `${formatStatus(
                                  status
                                )} verification`}

                          </strong>

                          <span>

                            {loan.loanNumber ||
                              `LOAN-${loan.id}`}

                            {" • "}

                            {loan.borrowerName ||
                              "Unknown borrower"}

                          </span>

                        </div>

                        <span className="exception-arrow">
                          →
                        </span>

                      </div>
                    );
                  })}

              </div>

            )}

          </div>

          {/* ==================================================
              AI COPILOT
          ================================================== */}

          <div className="card copilot-card">

            <div className="copilot-icon">
              ✦
            </div>

            <div className="copilot-content">

              <div className="card-label">
                AI COPILOT
              </div>

              <h3>
                Automated loan verification
              </h3>

              <p>
                LoanGuard analyzes loan records,
                identifies data quality issues,
                and helps reviewers prioritize
                records requiring attention.
              </p>

            </div>

            <button
              className="copilot-button"
              onClick={() =>
                navigate("/loans")
              }
            >
              Open verification workspace →
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default LoanDashboard;