import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./AddLoan.css";

function AddLoan() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    loanNumber: "",
    borrowerName: "",
    originalLoanAmount: "",
    currentBalance: "",
    interestRate: "",
    loanTermMonths: "",
    originationDate: "",
    maturityDate: "",
    loanStatus: "ACTIVE",
    dataSource: "MANUAL",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.loanNumber.trim() ||
      !form.borrowerName.trim() ||
      !form.originalLoanAmount ||
      !form.currentBalance ||
      !form.interestRate ||
      !form.loanTermMonths ||
      !form.originationDate ||
      !form.maturityDate
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (
      Number(form.currentBalance) > Number(form.originalLoanAmount)
    ) {
      setError(
        "Current balance cannot be greater than the original loan amount."
      );
      return;
    }

    if (Number(form.interestRate) > 100) {
      setError("Interest rate must be between 0% and 100%.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "http://localhost:8082/api/loans",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            loanNumber: form.loanNumber.trim(),
            borrowerName: form.borrowerName.trim(),
            originalLoanAmount: Number(form.originalLoanAmount),
            currentBalance: Number(form.currentBalance),
            interestRate: Number(form.interestRate),
            loanTermMonths: Number(form.loanTermMonths),
            originationDate: form.originationDate,
            maturityDate: form.maturityDate,
            loanStatus: form.loanStatus,
            dataSource: form.dataSource,
            verificationStatus: "PENDING",
            validationErrorCount: 0,
          }),
        }
      );

      if (response.status === 409) {
        throw new Error(
          "A loan with this loan number already exists."
        );
      }

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          message || "Failed to create loan."
        );
      }

      await response.json();

      setSuccess("Loan created successfully.");

      setTimeout(() => {
        navigate("/loans");
      }, 800);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create loan."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-loan-page">

      <div className="add-loan-header">

        <div>
          <div className="eyebrow">
            LOANGUARD AI
          </div>

          <h1>Add New Loan</h1>

          <p>
            Enter loan information for verification and review.
          </p>
        </div>

        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

      </div>

      <form
        className="add-loan-card"
        onSubmit={handleSubmit}
      >

        {/* SECTION 1 */}

        <div className="form-section">

          <div className="section-title">
            <span>01</span>
            Loan Information
          </div>

          <div className="form-grid">

            <div className="form-group">
              <label htmlFor="loanNumber">
                Loan Number *
              </label>

              <input
                id="loanNumber"
                name="loanNumber"
                value={form.loanNumber}
                onChange={handleChange}
                placeholder="LN-10002"
              />
            </div>

            <div className="form-group">
              <label htmlFor="borrowerName">
                Borrower Name *
              </label>

              <input
                id="borrowerName"
                name="borrowerName"
                value={form.borrowerName}
                onChange={handleChange}
                placeholder="Rahul Sharma"
              />
            </div>

            <div className="form-group">
              <label htmlFor="originalLoanAmount">
                Original Loan Amount *
              </label>

              <input
                id="originalLoanAmount"
                name="originalLoanAmount"
                type="number"
                min="0"
                step="0.01"
                value={form.originalLoanAmount}
                onChange={handleChange}
                placeholder="500000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="currentBalance">
                Current Balance *
              </label>

              <input
                id="currentBalance"
                name="currentBalance"
                type="number"
                min="0"
                step="0.01"
                value={form.currentBalance}
                onChange={handleChange}
                placeholder="425000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="interestRate">
                Interest Rate (%) *
              </label>

              <input
                id="interestRate"
                name="interestRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.interestRate}
                onChange={handleChange}
                placeholder="8.5"
              />
            </div>

            <div className="form-group">
              <label htmlFor="loanTermMonths">
                Loan Term (Months) *
              </label>

              <input
                id="loanTermMonths"
                name="loanTermMonths"
                type="number"
                min="1"
                value={form.loanTermMonths}
                onChange={handleChange}
                placeholder="60"
              />
            </div>

            <div className="form-group">
              <label htmlFor="originationDate">
                Origination Date *
              </label>

              <input
                id="originationDate"
                name="originationDate"
                type="date"
                value={form.originationDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="maturityDate">
                Maturity Date *
              </label>

              <input
                id="maturityDate"
                name="maturityDate"
                type="date"
                value={form.maturityDate}
                onChange={handleChange}
              />
            </div>

          </div>

        </div>

        {/* SECTION 2 */}

        <div className="form-section">

          <div className="section-title">
            <span>02</span>
            Loan Classification
          </div>

          <div className="form-grid">

            <div className="form-group">
              <label htmlFor="loanStatus">
                Loan Status
              </label>

              <select
                id="loanStatus"
                name="loanStatus"
                value={form.loanStatus}
                onChange={handleChange}
              >
                <option value="ACTIVE">
                  ACTIVE
                </option>

                <option value="CLOSED">
                  CLOSED
                </option>

                <option value="DEFAULTED">
                  DEFAULTED
                </option>

                <option value="DELINQUENT">
                  DELINQUENT
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dataSource">
                Data Source
              </label>

              <select
                id="dataSource"
                name="dataSource"
                value={form.dataSource}
                onChange={handleChange}
              >
                <option value="MANUAL">
                  MANUAL
                </option>

                <option value="CSV">
                  CSV
                </option>

                <option value="SYSTEM">
                  SYSTEM
                </option>
              </select>
            </div>

          </div>

        </div>

        {/* INFO */}

        <div className="verification-info">

          <div className="verification-icon">
            ✓
          </div>

          <div>
            <strong>
              Automatic Verification
            </strong>

            <p>
              New loans are created with PENDING
              verification status. A data reviewer can
              verify or reject the record from the loan
              review workspace.
            </p>
          </div>

        </div>

        {/* MESSAGES */}

        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="form-message success">
            ✓ {success}
          </div>
        )}

        {/* ACTIONS */}

        <div className="form-actions">

          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate("/dashboard")}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="save-button"
            disabled={saving}
          >
            {saving
              ? "Creating Loan..."
              : "Create Loan →"}
          </button>

        </div>

      </form>

    </div>
  );
}

export default AddLoan;