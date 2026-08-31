import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API = "https://loanguard-ai-2y9l.onrender.com";

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
  createdAt?: string;
  updatedAt?: string;
}

function Dashboard() {
  const navigate = useNavigate();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = useCallback(() => {
    return localStorage.getItem("loanguard_token");
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("loanguard_token");
    localStorage.removeItem("loanguard_user");
    navigate("/", { replace: true });
  }, [navigate]);

  const loadLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setLoans([]);
        setError("Your session has expired. Please sign in again.");
        handleLogout();
        return;
      }

      const response = await fetch(`${API}/api/loans`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("loanguard_token");
        localStorage.removeItem("loanguard_user");
        setLoans([]);
        setError(
          "Your session has expired or you do not have permission to view loan records."
        );
        setTimeout(() => navigate("/", { replace: true }), 1000);
        return;
      }

      if (!response.ok) {
        let errorMessage = `Backend returned ${response.status}`;

        try {
          const errorData = await response.json();
          errorMessage =
            errorData?.message ||
            errorData?.error ||
            errorMessage;
        } catch {
          // Non-JSON backend error.
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      let loanData: Loan[] = [];

      if (Array.isArray(data)) {
        loanData = data;
      } else if (Array.isArray(data?.loans)) {
        loanData = data.loans;
      } else if (Array.isArray(data?.content)) {
        loanData = data.content;
      } else if (Array.isArray(data?.data)) {
        loanData = data.data;
      }

      setLoans(loanData);
    } catch (err) {
      console.error("Dashboard loan loading error:", err);
      setLoans([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load loan records."
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, handleLogout, navigate]);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  const getVerificationStatus = (loan: Loan) =>
    loan.verificationStatus?.toUpperCase() || "PENDING";

  const getLoanStatus = (loan: Loan) =>
    loan.loanStatus?.toUpperCase() || "UNKNOWN";

  const isVerified = (loan: Loan) =>
    getVerificationStatus(loan) === "VERIFIED";

  const isPending = (loan: Loan) =>
    getVerificationStatus(loan) === "PENDING";

  const isNeedsReview = (loan: Loan) => {
    const status = getVerificationStatus(loan);

    return (
      status === "NEEDS_REVIEW" ||
      status === "REVIEW" ||
      Number(loan.validationErrorCount || 0) > 0
    );
  };

  const isRejected = (loan: Loan) =>
    getVerificationStatus(loan) === "REJECTED";

  const totalLoans = loans.length;

  const portfolioValue = useMemo(
    () =>
      loans.reduce(
        (total, loan) =>
          total + Number(loan.originalLoanAmount || 0),
        0
      ),
    [loans]
  );

  const totalCurrentBalance = useMemo(
    () =>
      loans.reduce(
        (total, loan) =>
          total + Number(loan.currentBalance || 0),
        0
      ),
    [loans]
  );

  const verifiedLoans = loans.filter(isVerified).length;
  const pendingLoans = loans.filter(isPending).length;
  const reviewLoans = loans.filter(isNeedsReview).length;
  const rejectedLoans = loans.filter(isRejected).length;

  const totalValidationErrors = useMemo(
    () =>
      loans.reduce(
        (total, loan) =>
          total + Number(loan.validationErrorCount || 0),
        0
      ),
    [loans]
  );

  const verificationPercentage =
    totalLoans === 0
      ? 0
      : Math.round((verifiedLoans / totalLoans) * 100);

  const reviewPercentage =
    totalLoans === 0
      ? 0
      : Math.round((reviewLoans / totalLoans) * 100);

  const pendingPercentage =
    totalLoans === 0
      ? 0
      : Math.round((pendingLoans / totalLoans) * 100);

  const rejectedPercentage =
    totalLoans === 0
      ? 0
      : Math.round((rejectedLoans / totalLoans) * 100);

  const chartMax = Math.max(
    pendingLoans,
    verifiedLoans,
    reviewLoans,
    rejectedLoans,
    1
  );

  const getBarHeight = (value: number) => {
    if (value === 0) return 3;
    return Math.max(6, Math.round((value / chartMax) * 100));
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-IN").format(value || 0);

  const formatPercentage = (value: number) => `${value}%`;

  const formatVerificationStatus = (status: string) => {
    switch (status?.toUpperCase()) {
      case "VERIFIED":
        return "Verified";
      case "NEEDS_REVIEW":
        return "Needs Review";
      case "REVIEW":
        return "Review";
      case "REJECTED":
        return "Rejected";
      case "PENDING":
        return "Pending";
      default:
        return status || "Unknown";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status?.toUpperCase()) {
      case "VERIFIED":
        return "status-verified";
      case "NEEDS_REVIEW":
      case "REVIEW":
        return "status-review";
      case "REJECTED":
        return "status-rejected";
      case "PENDING":
        return "status-pending";
      default:
        return "status-default";
    }
  };

  const openLoan = (loanId: number) => {
    navigate(`/reviewer/${loanId}`);
  };

  const openAnalytics = () => {
    navigate("/analytics");
  };

  // Opens Copilot with a real loan context whenever possible.
  const openCopilot = () => {
    const copilotLoan =
      loans.find(
        (loan) =>
          Number(loan.validationErrorCount || 0) > 0 ||
          getVerificationStatus(loan) !== "VERIFIED"
      ) || loans[0];

    if (copilotLoan) {
      navigate(
        `/copilot?loanId=${encodeURIComponent(copilotLoan.id)}`
      );
    } else {
      navigate("/copilot");
    }
  };

  // Opens Audit Trail with a real loan context whenever possible.
  const openAudit = () => {
    const auditLoan =
      loans.find(
        (loan) => Number(loan.validationErrorCount || 0) > 0
      ) || loans[0];

    if (auditLoan) {
      navigate(
        `/audit?loanId=${encodeURIComponent(auditLoan.id)}`
      );
    } else {
      navigate("/audit");
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">L</div>
          <div className="brand-text">
            <div className="brand-name">LoanGuard</div>
            <div className="brand-ai">AI</div>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="navigation">
          <button
            type="button"
            className="nav-item active"
            onClick={() => navigate("/dashboard")}
          >
            <span className="nav-icon">⌂</span>
            <span>Overview</span>
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => navigate("/loans")}
          >
            <span className="nav-icon">▣</span>
            <span>Loan Records</span>
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => navigate("/exceptions")}
          >
            <span className="nav-icon">!</span>
            <span>Exceptions</span>
            <span className="badge">{totalValidationErrors}</span>
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={openCopilot}
          >
            <span className="nav-icon">✦</span>
            <span>AI Copilot</span>
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={openAudit}
          >
            <span className="nav-icon">✓</span>
            <span>Audit Trail</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="nav-item"
            onClick={() => navigate("/settings")}
          >
            <span className="nav-icon">⚙</span>
            <span>Settings</span>
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={handleLogout}
          >
            <span className="nav-icon">↪</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <div className="eyebrow">OVERVIEW</div>
            <h1>Good evening.</h1>
            <p>
              Here's what's happening across your loan verification workspace.
            </p>
          </div>

          <div className="user-area">
            <button
              type="button"
              className="notification"
              aria-label="Notifications"
              onClick={() => navigate("/exceptions")}
            >
              ♢
            </button>

            <div className="avatar">SG</div>

            <div className="user-details">
              <strong>Demo Reviewer</strong>
              <span>Data Operations</span>
            </div>
          </div>
        </header>

        <section className="dashboard-content">
          {error && (
            <div className="dashboard-alert">
              <div className="alert-icon">!</div>

              <div className="alert-content">
                <strong>Unable to load dashboard</strong>
                <p>{error}</p>
              </div>

              <button
                type="button"
                className="alert-button"
                onClick={loadLoans}
                disabled={loading}
              >
                Try Again
              </button>
            </div>
          )}

          <div className="section-heading">
            <div>
              <div className="section-label">DATA HEALTH</div>
              <h2>Verification overview</h2>
            </div>

            <div className="section-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={openAnalytics}
              >
                View analytics
              </button>

              <button
                type="button"
                className="upload-button"
                onClick={() => navigate("/loans")}
              >
                + Upload loan tape
              </button>
            </div>
          </div>

          <div className="metrics">
            <div className="metric-card">
              <div className="metric-header">
                <span>Total loans</span>
                <div className="metric-icon">▣</div>
              </div>
              <div className="metric-number">
                {loading ? "—" : formatNumber(totalLoans)}
              </div>
              <div className="metric-positive">Portfolio records</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span>Verified records</span>
                <div className="metric-icon">✓</div>
              </div>
              <div className="metric-number">
                {loading ? "—" : formatNumber(verifiedLoans)}
              </div>
              <div className="metric-positive">
                {formatPercentage(verificationPercentage)} verified
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span>Open exceptions</span>
                <div className="metric-icon warning">!</div>
              </div>
              <div className="metric-number">
                {loading ? "—" : formatNumber(reviewLoans)}
              </div>
              <div className="metric-warning">
                {formatNumber(totalValidationErrors)} validation errors
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span>Data quality</span>
                <div className="metric-icon">✦</div>
              </div>
              <div className="metric-number">
                {loading
                  ? "—"
                  : `${Math.max(
                      0,
                      100 -
                        Math.round(
                          (totalValidationErrors /
                            Math.max(totalLoans, 1)) *
                            100
                        )
                    )}%`}
              </div>
              <div className="metric-positive">
                Based on validation results
              </div>
            </div>
          </div>

          <div className="main-grid">
            <div className="card activity-card">
              <div className="card-header">
                <div>
                  <div className="card-label">VERIFICATION ACTIVITY</div>
                  <h3>Portfolio status</h3>
                </div>

                <button
                  type="button"
                  className="period-button"
                  onClick={loadLoans}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Refresh ↻"}
                </button>
              </div>

              <div className="chart">
                <div className="chart-values">
                  <span>{formatNumber(chartMax)}</span>
                  <span>{formatNumber(Math.round(chartMax * 0.75))}</span>
                  <span>{formatNumber(Math.round(chartMax * 0.5))}</span>
                  <span>{formatNumber(Math.round(chartMax * 0.25))}</span>
                  <span>0</span>
                </div>

                <div className="chart-body">
                  <div className="grid-line" />
                  <div className="grid-line" />
                  <div className="grid-line" />
                  <div className="grid-line" />

                  <div className="bars">
                    <div
                      style={{ height: `${getBarHeight(verifiedLoans)}%` }}
                      title={`Verified: ${verifiedLoans}`}
                    />
                    <div
                      style={{ height: `${getBarHeight(reviewLoans)}%` }}
                      title={`Needs review: ${reviewLoans}`}
                    />
                    <div
                      style={{ height: `${getBarHeight(pendingLoans)}%` }}
                      title={`Pending: ${pendingLoans}`}
                    />
                    <div
                      style={{ height: `${getBarHeight(rejectedLoans)}%` }}
                      title={`Rejected: ${rejectedLoans}`}
                    />
                  </div>

                  <div className="chart-labels">
                    <span>Verified</span>
                    <span>Review</span>
                    <span>Pending</span>
                    <span>Rejected</span>
                  </div>
                </div>
              </div>

              <div className="chart-summary">
                <div className="chart-summary-item">
                  <span className="summary-dot verified-dot" />
                  <span>Verified</span>
                  <strong>{formatNumber(verifiedLoans)}</strong>
                </div>

                <div className="chart-summary-item">
                  <span className="summary-dot review-dot" />
                  <span>Review</span>
                  <strong>{formatNumber(reviewLoans)}</strong>
                </div>

                <div className="chart-summary-item">
                  <span className="summary-dot pending-dot" />
                  <span>Pending</span>
                  <strong>{formatNumber(pendingLoans)}</strong>
                </div>

                <div className="chart-summary-item">
                  <span className="summary-dot rejected-dot" />
                  <span>Rejected</span>
                  <strong>{formatNumber(rejectedLoans)}</strong>
                </div>
              </div>
            </div>

            <div className="card exceptions-card">
              <div className="card-header">
                <div>
                  <div className="card-label">REVIEW QUEUE</div>
                  <h3>Attention required</h3>
                </div>

                <button
                  type="button"
                  className="view-button"
                  onClick={() => navigate("/exceptions")}
                >
                  View all
                </button>
              </div>

              <div className="exception-summary">
                <div className="exception-total">
                  <strong>{formatNumber(reviewLoans)}</strong>
                  <span>records need review</span>
                </div>
                <div className="exception-rate">{reviewPercentage}%</div>
              </div>

              <div className="exception-list">
                {loading ? (
                  <div className="empty-state">Loading records...</div>
                ) : reviewLoans === 0 ? (
                  <div className="clean-state">
                    <div className="clean-icon">✓</div>
                    <strong>No open exceptions</strong>
                    <span>All current records are clear.</span>
                  </div>
                ) : (
                  loans
                    .filter(isNeedsReview)
                    .slice(0, 5)
                    .map((loan) => (
                      <button
                        type="button"
                        className="exception-row"
                        key={loan.id}
                        onClick={() => openLoan(loan.id)}
                      >
                        <div className="exception-info">
                          <strong>{loan.loanNumber}</strong>
                          <span>{loan.borrowerName}</span>
                        </div>

                        <div className="exception-right">
                          <span
                            className={`status-pill ${getStatusClass(
                              getVerificationStatus(loan)
                            )}`}
                          >
                            {formatVerificationStatus(
                              getVerificationStatus(loan)
                            )}
                          </span>
                          <span className="exception-arrow">→</span>
                        </div>
                      </button>
                    ))
                )}
              </div>
            </div>
          </div>

          <div className="bottom-grid">
            <div className="card portfolio-card">
              <div className="card-label">PORTFOLIO EXPOSURE</div>
              <h3>Financial overview</h3>

              <div className="financial-grid">
                <div className="financial-item">
                  <span>Original portfolio</span>
                  <strong>{formatCurrency(portfolioValue)}</strong>
                </div>

                <div className="financial-item">
                  <span>Current balance</span>
                  <strong>{formatCurrency(totalCurrentBalance)}</strong>
                </div>
              </div>

              <div className="utilization">
                <div className="utilization-header">
                  <span>Outstanding utilization</span>
                  <strong>
                    {portfolioValue > 0
                      ? Math.round(
                          (totalCurrentBalance / portfolioValue) * 100
                        )
                      : 0}
                    %
                  </strong>
                </div>

                <div className="utilization-track">
                  <div
                    className="utilization-fill"
                    style={{
                      width: `${
                        portfolioValue > 0
                          ? Math.min(
                              100,
                              (totalCurrentBalance / portfolioValue) * 100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="card status-card">
              <div className="card-label">VERIFICATION STATUS</div>
              <h3>Current distribution</h3>

              <div className="status-list">
                <div className="status-list-row">
                  <div>
                    <span className="status-marker verified-marker" />
                    <span>Verified</span>
                  </div>
                  <strong>{verificationPercentage}%</strong>
                </div>

                <div className="status-list-row">
                  <div>
                    <span className="status-marker review-marker" />
                    <span>Review</span>
                  </div>
                  <strong>{reviewPercentage}%</strong>
                </div>

                <div className="status-list-row">
                  <div>
                    <span className="status-marker pending-marker" />
                    <span>Pending</span>
                  </div>
                  <strong>{pendingPercentage}%</strong>
                </div>

                <div className="status-list-row">
                  <div>
                    <span className="status-marker rejected-marker" />
                    <span>Rejected</span>
                  </div>
                  <strong>{rejectedPercentage}%</strong>
                </div>
              </div>
            </div>

            <div className="card quick-card">
              <div className="card-label">QUICK ACTIONS</div>
              <h3>Review workspace</h3>

              <div className="quick-actions">
                <button
                  type="button"
                  onClick={() => navigate("/loans")}
                >
                  <div>
                    <strong>Loan Records</strong>
                    <small>Browse all loan records</small>
                  </div>
                  <b>→</b>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/analytics")}
                >
                  <div>
                    <strong>Analytics</strong>
                    <small>Explore portfolio metrics</small>
                  </div>
                  <b>→</b>
                </button>

                <button
                  type="button"
                  onClick={openAudit}
                >
                  <div>
                    <strong>Audit Trail</strong>
                    <small>Review system activity</small>
                  </div>
                  <b>→</b>
                </button>

                <button
                  type="button"
                  onClick={openCopilot}
                >
                  <div>
                    <strong>AI Copilot</strong>
                    <small>Ask about a loan</small>
                  </div>
                  <b>→</b>
                </button>
              </div>
            </div>
          </div>

          <div className="card recent-card">
            <div className="card-header">
              <div>
                <div className="card-label">RECENT RECORDS</div>
                <h3>Latest loan activity</h3>
              </div>

              <button
                type="button"
                className="view-button"
                onClick={() => navigate("/loans")}
              >
                View all →
              </button>
            </div>

            {loading ? (
              <div className="empty-state">Loading loan records...</div>
            ) : loans.length === 0 ? (
              <div className="empty-state">No loan records found.</div>
            ) : (
              <div className="loan-table-wrapper">
                <table className="loan-table">
                  <thead>
                    <tr>
                      <th>Loan</th>
                      <th>Borrower</th>
                      <th>Balance</th>
                      <th>Loan Status</th>
                      <th>Verification</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loans.slice(0, 8).map((loan) => {
                      const verificationStatus =
                        getVerificationStatus(loan);

                      return (
                        <tr
                          key={loan.id}
                          onClick={() => openLoan(loan.id)}
                        >
                          <td>
                            <strong>{loan.loanNumber}</strong>
                          </td>

                          <td>{loan.borrowerName}</td>

                          <td>
                            {formatCurrency(
                              Number(loan.currentBalance || 0)
                            )}
                          </td>

                          <td>
                            <span className="loan-status">
                              {getLoanStatus(loan)}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status-pill ${getStatusClass(
                                verificationStatus
                              )}`}
                            >
                              {formatVerificationStatus(
                                verificationStatus
                              )}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="row-action"
                              onClick={(event) => {
                                event.stopPropagation();
                                openLoan(loan.id);
                              }}
                            >
                              Open →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
