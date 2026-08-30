import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { apiFetch } from "../api/api";

import "./LoanRecords.css";

// =========================================================
// TYPES
// =========================================================

interface Loan {
  id: number;
  loanNumber: string;
  borrowerName: string;
  originalLoanAmount: number | null;
  currentBalance: number | null;
  interestRate: number | null;
  loanStatus: string;
  verificationStatus: string;
  validationErrorCount: number | null;
  updatedAt: string | null;
  dataSource: string;
}

interface RiskFactor {
  factor: string;
  severity: string;
  impact: string;
  description: string;
}

interface RiskAnalysis {
  loanId: number;
  loanNumber: string;
  riskScore: number;
  riskLevel: string;
  recommendation: string;
  confidence: number;
  validationPassed: boolean;
  validationErrorCount: number;
  factors?: RiskFactor[];
}

// =========================================================
// COMPONENT
// =========================================================

function LoanRecords() {
  const navigate = useNavigate();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [riskData, setRiskData] =
    useState<Record<number, RiskAnalysis>>({});

  const [loading, setLoading] = useState(true);
  const [riskLoading, setRiskLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] =
    useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState("ALL");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  // =========================================================
  // LOAD LOANS
  // =========================================================

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      console.log("Loading loans from backend...");

      const response = await apiFetch("/loans");

      console.log(
        "Loans API status:",
        response.status
      );

      if (!response.ok) {
        let message = "";

        try {
          const data = await response.json();

          message =
            data?.message ||
            data?.error ||
            "";
        } catch {
          // Ignore JSON parsing errors.
        }

        throw new Error(
          message ||
            `Failed to load loans: ${response.status}`
        );
      }

      const data = await response.json();

      console.log("Loans API response:", data);

      // -----------------------------------------------------
      // SUPPORT MULTIPLE RESPONSE FORMATS
      // -----------------------------------------------------

      let loanData: Loan[] = [];

      if (Array.isArray(data)) {
        loanData = data;
      } else if (
        Array.isArray(data?.content)
      ) {
        loanData = data.content;
      } else if (
        Array.isArray(data?.data)
      ) {
        loanData = data.data;
      } else if (
        Array.isArray(data?.loans)
      ) {
        loanData = data.loans;
      }

      console.log(
        `Loaded ${loanData.length} loan records`
      );

      setLoans(loanData);

      // -----------------------------------------------------
      // NO LOANS
      // -----------------------------------------------------

      if (loanData.length === 0) {
        setRiskData({});
        setError(
          "Backend connected successfully, but no loan records were returned."
        );
        return;
      }

      // -----------------------------------------------------
      // LOAD AI RISK DATA
      // -----------------------------------------------------

      setRiskLoading(true);

      const riskResults = await Promise.all(
        loanData.map(async (loan) => {
          try {
            const riskResponse =
              await apiFetch(
                `/risk/loans/${loan.id}`
              );

            if (!riskResponse.ok) {
              console.warn(
                `Risk API unavailable for loan ${loan.id}: ${riskResponse.status}`
              );

              return null;
            }

            const risk: RiskAnalysis =
              await riskResponse.json();

            return {
              id: loan.id,
              risk,
            };
          } catch (riskError) {
            console.warn(
              `Risk analysis unavailable for loan ${loan.id}`,
              riskError
            );

            return null;
          }
        })
      );

      // -----------------------------------------------------
      // CREATE RISK MAP
      // -----------------------------------------------------

      const riskMap: Record<
        number,
        RiskAnalysis
      > = {};

      riskResults.forEach((result) => {
        if (result) {
          riskMap[result.id] =
            result.risk;
        }
      });

      setRiskData(riskMap);

    } catch (err) {
      console.error(
        "Loan loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load loan records."
      );

      setLoans([]);
      setRiskData({});
    } finally {
      setLoading(false);
      setRiskLoading(false);
    }
  }, []);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // =========================================================
  // DELETE LOAN
  // =========================================================

  const deleteLoan = async (
    loan: Loan
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete loan ${loan.loanNumber}?\n\n` +
        `Borrower: ${loan.borrowerName}\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(loan.id);
      setError("");
      setSuccessMessage("");

      const response = await apiFetch(
        `/loans/${loan.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        let backendMessage = "";

        try {
          const data =
            await response.json();

          backendMessage =
            data?.message ||
            data?.error ||
            "";
        } catch {
          // Ignore.
        }

        throw new Error(
          backendMessage ||
            `Unable to delete loan. Server returned ${response.status}.`
        );
      }

      setLoans((previousLoans) =>
        previousLoans.filter(
          (existingLoan) =>
            existingLoan.id !== loan.id
        )
      );

      setRiskData(
        (previousRiskData) => {
          const updated = {
            ...previousRiskData,
          };

          delete updated[loan.id];

          return updated;
        }
      );

      setSuccessMessage(
        `Loan ${loan.loanNumber} was deleted successfully.`
      );
    } catch (err) {
      console.error(
        "Delete loan error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete loan."
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  // =========================================================
  // FILTERING
  // =========================================================

  const filteredLoans = useMemo(() => {
    const searchText = search
      .toLowerCase()
      .trim();

    return loans.filter((loan) => {
      const matchesSearch =
        !searchText ||
        loan.loanNumber
          ?.toLowerCase()
          .includes(searchText) ||
        loan.borrowerName
          ?.toLowerCase()
          .includes(searchText);

      const status =
        loan.verificationStatus
          ?.toUpperCase();

      let matchesFilter = true;

      switch (activeFilter) {
        case "VERIFIED":
          matchesFilter =
            status === "VERIFIED";
          break;

        case "NEEDS_REVIEW":
          matchesFilter =
            status === "NEEDS_REVIEW";
          break;

        case "PENDING":
          matchesFilter =
            status === "PENDING";
          break;

        case "REJECTED":
          matchesFilter =
            status === "REJECTED";
          break;

        case "ALL":
        default:
          matchesFilter = true;
      }

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [
    loans,
    search,
    activeFilter,
  ]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalLoans = loans.length;

  const verifiedLoans = loans.filter(
    (loan) =>
      loan.verificationStatus
        ?.toUpperCase() ===
      "VERIFIED"
  ).length;

  const reviewLoans = loans.filter(
    (loan) =>
      loan.verificationStatus
        ?.toUpperCase() ===
      "NEEDS_REVIEW"
  ).length;

  const rejectedLoans = loans.filter(
    (loan) =>
      loan.verificationStatus
        ?.toUpperCase() ===
      "REJECTED"
  ).length;

  // =========================================================
  // MONEY FORMAT
  // =========================================================

  const formatMoney = (
    value:
      | number
      | null
      | undefined
  ) => {
    if (
      value === null ||
      value === undefined ||
      Number.isNaN(Number(value))
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
    ).format(Number(value));
  };

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (
    value:
      | string
      | null
      | undefined
  ) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
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
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (
    status?: string
  ) => {
    switch (
      status?.toUpperCase()
    ) {
      case "VERIFIED":
        return "status status-verified";

      case "NEEDS_REVIEW":
        return "status status-exception";

      case "REJECTED":
        return "status status-rejected";

      case "PENDING":
      default:
        return "status status-pending";
    }
  };

  // =========================================================
  // STATUS LABEL
  // =========================================================

  const getStatusLabel = (
    status?: string
  ) => {
    switch (
      status?.toUpperCase()
    ) {
      case "VERIFIED":
        return "VERIFIED";

      case "NEEDS_REVIEW":
        return "NEEDS REVIEW";

      case "REJECTED":
        return "REJECTED";

      case "PENDING":
        return "PENDING";

      default:
        return status || "PENDING";
    }
  };

  // =========================================================
  // RISK CLASS
  // =========================================================

  const getRiskClass = (
    riskLevel?: string
  ) => {
    switch (
      riskLevel?.toUpperCase()
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
  };

  // =========================================================
  // RISK LABEL
  // =========================================================

  const getRiskLabel = (
    riskLevel?: string
  ) => {
    if (!riskLevel) {
      return "—";
    }

    return riskLevel.toUpperCase();
  };

  // =========================================================
  // RECOMMENDATION NORMALIZATION
  // =========================================================

  const normalizeRecommendation = (
    recommendation?: string
  ) => {
    if (!recommendation) {
      return "";
    }

    const value =
      recommendation
        .trim()
        .toUpperCase();

    if (
      value === "APPROVE" ||
      value.includes("LOW RISK")
    ) {
      return "APPROVE";
    }

    if (
      value === "HUMAN_REVIEW" ||
      value.includes("HUMAN REVIEW") ||
      value.includes(
        "ADDITIONAL VERIFICATION"
      )
    ) {
      return "HUMAN_REVIEW";
    }

    if (
      value === "REJECT" ||
      value.includes("REJECT")
    ) {
      return "REJECT";
    }

    return value;
  };

  // =========================================================
  // RECOMMENDATION CLASS
  // =========================================================

  const getRecommendationClass = (
    recommendation?: string
  ) => {
    const normalized =
      normalizeRecommendation(
        recommendation
      );

    switch (normalized) {
      case "APPROVE":
        return "recommendation recommendation-approve";

      case "HUMAN_REVIEW":
        return "recommendation recommendation-review";

      case "REJECT":
        return "recommendation recommendation-reject";

      default:
        return "recommendation recommendation-unknown";
    }
  };

  // =========================================================
  // RECOMMENDATION LABEL
  // =========================================================

  const getRecommendationLabel = (
    recommendation?: string
  ) => {
    const normalized =
      normalizeRecommendation(
        recommendation
      );

    switch (normalized) {
      case "APPROVE":
        return "APPROVE";

      case "HUMAN_REVIEW":
        return "HUMAN REVIEW";

      case "REJECT":
        return "REJECT";

      default:
        return recommendation || "—";
    }
  };

  // =========================================================
  // ACTION LABEL
  // =========================================================

  const getActionLabel = (
    loan: Loan
  ) => {
    if (
      loan.verificationStatus
        ?.toUpperCase() ===
        "NEEDS_REVIEW" ||
      Number(
        loan.validationErrorCount || 0
      ) > 0
    ) {
      return "FIX EXCEPTION";
    }

    return "REVIEW";
  };

  // =========================================================
  // OPEN REVIEWER
  // =========================================================

  const openReviewer = (
    loanId: number
  ) => {
    navigate(
      `/reviewer/${loanId}`
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="loan-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="loan-header">

        <div>
          <div className="eyebrow">
            LOANGUARD AI
          </div>

          <h1>
            Loan Records
          </h1>

          <p>
            Normalized loan data,
            validation status, AI
            risk assessment, and
            verification workflow.
          </p>
        </div>

        <button
          className="upload-button"
          onClick={() =>
            navigate("/upload")
          }
        >
          <span>＋</span>
          Upload Loan Tape
        </button>

      </div>

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {successMessage && (
        <div className="success-banner">
          <strong>
            Success:
          </strong>{" "}
          {successMessage}
        </div>
      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="error-banner">

          <strong>
            Error:
          </strong>{" "}

          {error}

          <button
            onClick={fetchLoans}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "Retry"}
          </button>

        </div>
      )}

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="loan-stats">

        <div className="stat-card">

          <span>
            Total Loans
          </span>

          <strong>
            {loading
              ? "..."
              : totalLoans}
          </strong>

          <small>
            Records ingested
          </small>

        </div>

        <div className="stat-card">

          <span>
            Verified
          </span>

          <strong className="positive">
            {loading
              ? "..."
              : verifiedLoans}
          </strong>

          <small>
            {totalLoans > 0
              ? `${Math.round(
                  (verifiedLoans /
                    totalLoans) *
                    100
                )}% verified`
              : "No records"}
          </small>

        </div>

        <div className="stat-card">

          <span>
            Needs Review
          </span>

          <strong className="warning-text">
            {loading
              ? "..."
              : reviewLoans}
          </strong>

          <small>
            Requires human review
          </small>

        </div>

        <div className="stat-card">

          <span>
            Rejected
          </span>

          <strong className="rejected-number">
            {loading
              ? "..."
              : rejectedLoans}
          </strong>

          <small>
            Validation exceptions
          </small>

        </div>

      </div>

      {/* =====================================================
          RECORDS CARD
      ===================================================== */}

      <div className="records-card">

        {/* ===================================================
            TOOLBAR
        =================================================== */}

        <div className="records-toolbar">

          <div className="search-box">

            <span className="search-icon">
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search loan number or borrower..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          <div className="filters">

            {[
              ["ALL", "ALL"],
              ["VERIFIED", "VERIFIED"],
              [
                "NEEDS_REVIEW",
                "NEEDS REVIEW",
              ],
              ["PENDING", "PENDING"],
              ["REJECTED", "REJECTED"],
            ].map(
              ([value, label]) => (
                <button
                  key={value}
                  className={`filter ${
                    activeFilter ===
                    value
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setActiveFilter(
                      value
                    )
                  }
                >
                  {label}
                </button>
              )
            )}

          </div>

        </div>

        {/* ===================================================
            RISK LOADING
        =================================================== */}

        {riskLoading &&
          !loading && (
            <div className="risk-loading-banner">
              AI risk assessment is
              being calculated for
              the loan records...
            </div>
          )}

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="table-wrapper">

          {loading ? (

            <div className="loading-state">

              <div className="loading-spinner" />

              <p>
                Loading loan records...
              </p>

            </div>

          ) : filteredLoans.length ===
            0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                ⌁
              </div>

              <strong>
                No loan records found
              </strong>

              <p>
                Try changing your
                search or filter, or
                upload a loan tape.
              </p>

              {loans.length ===
                0 && (
                <button
                  onClick={fetchLoans}
                  className="view-button"
                >
                  Reload Records
                </button>
              )}

            </div>

          ) : (

            <table>

              <thead>

                <tr>

                  <th>
                    LOAN ID
                  </th>

                  <th>
                    BORROWER
                  </th>

                  <th>
                    ORIGINAL AMOUNT
                  </th>

                  <th>
                    CURRENT BALANCE
                  </th>

                  <th>
                    RATE
                  </th>

                  <th>
                    STATUS
                  </th>

                  <th>
                    ISSUES
                  </th>

                  <th>
                    AI RISK
                  </th>

                  <th>
                    DECISION
                  </th>

                  <th>
                    UPDATED
                  </th>

                  <th>
                    ACTION
                  </th>

                  <th>
                    DELETE
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredLoans.map(
                  (loan) => {

                    const risk =
                      riskData[
                        loan.id
                      ];

                    const isDeleting =
                      deleteLoading ===
                      loan.id;

                    const issueCount =
                      Number(
                        loan.validationErrorCount ||
                          0
                      );

                    return (
                      <tr
                        key={loan.id}
                      >

                        {/* LOAN ID */}

                        <td>
                          <span className="loan-id">
                            {loan.loanNumber ||
                              `LN-${loan.id}`}
                          </span>
                        </td>

                        {/* BORROWER */}

                        <td>
                          <span className="borrower">
                            {loan.borrowerName ||
                              "Unknown"}
                          </span>
                        </td>

                        {/* ORIGINAL AMOUNT */}

                        <td>
                          {formatMoney(
                            loan.originalLoanAmount
                          )}
                        </td>

                        {/* CURRENT BALANCE */}

                        <td>
                          {formatMoney(
                            loan.currentBalance
                          )}
                        </td>

                        {/* RATE */}

                        <td>
                          {loan.interestRate !==
                            null &&
                          loan.interestRate !==
                            undefined
                            ? `${loan.interestRate}%`
                            : "—"}
                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={getStatusClass(
                              loan.verificationStatus
                            )}
                          >

                            <span className="status-dot" />

                            {getStatusLabel(
                              loan.verificationStatus
                            )}

                          </span>

                        </td>

                        {/* ISSUES */}

                        <td>

                          {issueCount >
                          0 ? (

                            <span className="issue">

                              {issueCount}{" "}

                              issue
                              {issueCount >
                              1
                                ? "s"
                                : ""}

                            </span>

                          ) : (

                            <span className="issue-clean">
                              No issues
                            </span>

                          )}

                        </td>

                        {/* AI RISK */}

                        <td>

                          {risk ? (

                            <span
                              className={getRiskClass(
                                risk.riskLevel
                              )}
                            >

                              <span className="risk-dot" />

                              {getRiskLabel(
                                risk.riskLevel
                              )}

                              <small>
                                {
                                  risk.riskScore
                                }
                                /100
                              </small>

                            </span>

                          ) : (

                            <span className="risk risk-unknown">

                              {riskLoading
                                ? "..."
                                : "—"}

                            </span>

                          )}

                        </td>

                        {/* DECISION */}

                        <td>

                          {risk ? (

                            <span
                              className={getRecommendationClass(
                                risk.recommendation
                              )}
                            >

                              {getRecommendationLabel(
                                risk.recommendation
                              )}

                            </span>

                          ) : (

                            <span className="recommendation recommendation-unknown">

                              {riskLoading
                                ? "..."
                                : "—"}

                            </span>

                          )}

                        </td>

                        {/* UPDATED */}

                        <td>

                          <span className="updated">
                            {formatDate(
                              loan.updatedAt
                            )}
                          </span>

                        </td>

                        {/* ACTION */}

                        <td>

                          <button
                            className="view-button"
                            onClick={() =>
                              openReviewer(
                                loan.id
                              )
                            }
                            disabled={
                              isDeleting
                            }
                          >
                            {getActionLabel(
                              loan
                            )}
                          </button>

                        </td>

                        {/* DELETE */}

                        <td>

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() =>
                              deleteLoan(
                                loan
                              )
                            }
                            disabled={
                              isDeleting
                            }
                          >
                            {isDeleting
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          )}

        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="table-footer">

          <span>

            Showing{" "}

            <strong>
              {filteredLoans.length}
            </strong>{" "}

            of{" "}

            <strong>
              {totalLoans}
            </strong>{" "}

            loans

          </span>

          <span className="normalized">

            ● Normalized & connected
            to verification engine

          </span>

        </div>

      </div>

    </div>
  );
}

export default LoanRecords;