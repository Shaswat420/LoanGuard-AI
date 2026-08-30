import { useRef, useState } from "react";
import type {
  ChangeEvent,
  FormEvent,
} from "react";

import { useNavigate } from "react-router-dom";

import "./UploadLoanTape.css";

// =========================================================
// API
// =========================================================

const API_URL = "http://localhost:8082/api";

// =========================================================
// TYPES
// =========================================================

interface UploadResponse {
  message?: string;
  success?: boolean;
  count?: number;
  totalRows?: number;
  importedRows?: number;
  failedRows?: number;
  fileName?: string;
  loans?: unknown[];
  errors?: unknown[];
}

// =========================================================
// COMPONENT
// =========================================================

function UploadLoanTape() {
  const navigate = useNavigate();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [isUploading, setIsUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // =========================================================
  // GET TOKEN
  // =========================================================

  const getToken = (): string | null => {
    return localStorage.getItem(
      "loanguard_token"
    );
  };

  // =========================================================
  // FILE CHANGE
  // =========================================================

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setError("");
    setSuccessMessage("");

    const file =
      event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // =====================================================
    // ONLY CSV
    // Backend currently accepts CSV only.
    // =====================================================

    if (
      !file.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setSelectedFile(null);

      setError(
        "Only CSV files are supported."
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    // =====================================================
    // MAX FILE SIZE
    // =====================================================

    const maxFileSize =
      20 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setSelectedFile(null);

      setError(
        "File is too large. Maximum file size is 20 MB."
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setSelectedFile(file);
  };

  // =========================================================
  // OPEN FILE PICKER
  // =========================================================

  const openFilePicker = () => {
    if (isUploading) {
      return;
    }

    fileInputRef.current?.click();
  };

  // =========================================================
  // REMOVE FILE
  // =========================================================

  const removeFile = () => {
    if (isUploading) {
      return;
    }

    setSelectedFile(null);
    setError("");
    setSuccessMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =========================================================
  // FILE SIZE
  // =========================================================

  const formatFileSize = (
    bytes: number
  ): string => {
    if (bytes === 0) {
      return "0 Bytes";
    }

    const units = [
      "Bytes",
      "KB",
      "MB",
      "GB",
    ];

    const index = Math.floor(
      Math.log(bytes) /
        Math.log(1024)
    );

    const size =
      bytes /
      Math.pow(1024, index);

    return `${size.toFixed(
      index === 0 ? 0 : 2
    )} ${units[index]}`;
  };

  // =========================================================
  // READ BACKEND ERROR
  // =========================================================

  const getBackendError = async (
    response: Response
  ): Promise<string> => {
    try {
      const contentType =
        response.headers.get(
          "content-type"
        );

      if (
        contentType?.includes(
          "application/json"
        )
      ) {
        const data =
          await response.json();

        if (
          data &&
          typeof data === "object"
        ) {
          const body =
            data as Record<
              string,
              unknown
            >;

          if (
            typeof body.message ===
            "string"
          ) {
            return body.message;
          }

          if (
            typeof body.error ===
            "string"
          ) {
            return body.error;
          }
        }
      } else {
        const text =
          await response.text();

        if (text.trim()) {
          return text;
        }
      }
    } catch {
      // Ignore response parsing errors.
    }

    return `Upload failed with status ${response.status}.`;
  };

  // =========================================================
  // UPLOAD
  // =========================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    // =====================================================
    // CHECK FILE
    // =====================================================

    if (!selectedFile) {
      setError(
        "Please select a CSV loan tape first."
      );

      return;
    }

    // =====================================================
    // CHECK TOKEN
    // =====================================================

    const token = getToken();

    if (!token) {
      setError(
        "Your session has expired. Please sign in again."
      );

      localStorage.removeItem(
        "loanguard_user"
      );

      navigate("/", {
        replace: true,
      });

      return;
    }

    try {
      setIsUploading(true);

      // ===================================================
      // FORM DATA
      // ===================================================

      const formData =
        new FormData();

      /*
       * IMPORTANT:
       *
       * Backend:
       *
       * @RequestParam("file")
       *
       * Therefore the key MUST be "file".
       */

      formData.append(
        "file",
        selectedFile
      );

      // ===================================================
      // SEND REQUEST
      // ===================================================

      const response =
        await fetch(
          `${API_URL}/loans/upload`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,

              Accept:
                "application/json",
            },

            body: formData,
          }
        );

      // ===================================================
      // UNAUTHORIZED
      // ===================================================

      if (response.status === 401) {
        localStorage.removeItem(
          "loanguard_token"
        );

        localStorage.removeItem(
          "loanguard_user"
        );

        setError(
          "Your session has expired. Please sign in again."
        );

        setTimeout(() => {
          navigate("/", {
            replace: true,
          });
        }, 1000);

        return;
      }

      // ===================================================
      // FORBIDDEN
      // ===================================================

      if (response.status === 403) {
        setError(
          "You do not have permission to upload loan tapes."
        );

        return;
      }

      // ===================================================
      // OTHER ERROR
      // ===================================================

      if (!response.ok) {
        const backendError =
          await getBackendError(
            response
          );

        throw new Error(
          backendError
        );
      }

      // ===================================================
      // READ SUCCESS RESPONSE
      // ===================================================

      let data:
        | UploadResponse
        | null = null;

      try {
        data =
          (await response.json()) as UploadResponse;
      } catch {
        data = null;
      }

      // ===================================================
      // BACKEND RESPONSE
      // ===================================================

      const importedRows =
        data?.importedRows;

      const failedRows =
        data?.failedRows;

      if (
        importedRows !== undefined
      ) {
        if (
          failedRows !== undefined &&
          failedRows > 0
        ) {
          setSuccessMessage(
            `Upload completed. ${importedRows} loan record(s) imported and ${failedRows} row(s) failed validation.`
          );
        } else {
          setSuccessMessage(
            `Upload successful. ${importedRows} loan record(s) imported.`
          );
        }
      } else {
        setSuccessMessage(
          data?.message ||
            "Loan tape uploaded successfully."
        );
      }

      // ===================================================
      // CLEAR FILE
      // ===================================================

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // ===================================================
      // GO TO LOAN RECORDS
      // ===================================================

      setTimeout(() => {
        navigate("/loans");
      }, 1200);

    } catch (err) {
      console.error(
        "Loan tape upload error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload loan tape."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="upload-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="upload-header">

        <div>

          <div className="eyebrow">
            LOANGUARD AI
          </div>

          <h1>
            Upload Loan Tape
          </h1>

          <p>
            Import normalized loan data
            into the verification
            workspace.
          </p>

        </div>

        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate("/loans")
          }
          disabled={isUploading}
        >
          ← Back to Loan Records
        </button>

      </div>

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <div className="upload-card">

        {/* ===================================================
            CARD HEADER
        =================================================== */}

        <div className="upload-card-header">

          <div>

            <div className="upload-eyebrow">
              LOAN DATA INGESTION
            </div>

            <h2>
              Import loan records
            </h2>

            <p>
              Upload a CSV loan tape.
              The backend will validate
              and normalize the records
              automatically.
            </p>

          </div>

        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="upload-error">

            <span className="upload-error-icon">
              !
            </span>

            <div>

              <strong>
                Upload failed
              </strong>

              <p>
                {error}
              </p>

            </div>

          </div>
        )}

        {/* ===================================================
            SUCCESS
        =================================================== */}

        {successMessage && (
          <div className="upload-success">

            <span className="upload-success-icon">
              ✓
            </span>

            <div>

              <strong>
                Upload successful
              </strong>

              <p>
                {successMessage}
              </p>

            </div>

          </div>
        )}

        {/* ===================================================
            FORM
        =================================================== */}

        <form
          onSubmit={handleSubmit}
          className="upload-form"
        >

          {/* =================================================
              HIDDEN FILE INPUT
          ================================================= */}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={
              handleFileChange
            }
            disabled={isUploading}
            style={{
              display: "none",
            }}
          />

          {/* =================================================
              FILE PICKER
          ================================================= */}

          <button
            type="button"
            className="upload-dropzone"
            onClick={openFilePicker}
            disabled={isUploading}
          >

            <div className="upload-icon">
              ↑
            </div>

            <div className="upload-drop-content">

              <strong>
                {selectedFile
                  ? "Change loan tape"
                  : "Choose a loan tape"}
              </strong>

              <span>
                CSV files only
              </span>

            </div>

            <span className="upload-select-text">
              Browse files
            </span>

          </button>

          {/* =================================================
              SELECTED FILE
          ================================================= */}

          {selectedFile && (
            <div className="selected-file">

              <div className="selected-file-icon">
                CSV
              </div>

              <div className="selected-file-info">

                <strong>
                  {selectedFile.name}
                </strong>

                <span>
                  {formatFileSize(
                    selectedFile.size
                  )}
                </span>

              </div>

              <button
                type="button"
                className="remove-file-button"
                onClick={removeFile}
                disabled={isUploading}
                aria-label="Remove selected file"
              >
                ×
              </button>

            </div>
          )}

          {/* =================================================
              INFORMATION
          ================================================= */}

          <div className="upload-info">

            <div className="upload-info-item">

              <span>
                ✓
              </span>

              <div>

                <strong>
                  Automatic validation
                </strong>

                <p>
                  Each loan record is
                  validated by the
                  backend before it is
                  stored.
                </p>

              </div>

            </div>

            <div className="upload-info-item">

              <span>
                ✓
              </span>

              <div>

                <strong>
                  AI risk assessment
                </strong>

                <p>
                  Imported loans can be
                  analyzed by the LoanGuard
                  risk engine.
                </p>

              </div>

            </div>

            <div className="upload-info-item">

              <span>
                ✓
              </span>

              <div>

                <strong>
                  Audit tracked
                </strong>

                <p>
                  Loan verification activity
                  is tracked through the
                  backend workflow.
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="upload-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() =>
                navigate("/loans")
              }
              disabled={isUploading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="submit-upload-button"
              disabled={
                isUploading ||
                !selectedFile
              }
            >

              {isUploading ? (
                <>
                  <span className="button-spinner" />
                  Uploading...
                </>
              ) : (
                <>
                  Upload Loan Tape
                  <span>
                    →
                  </span>
                </>
              )}

            </button>

          </div>

        </form>

      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="upload-footer">

        <span>
          Supported format: CSV
        </span>

        <span>
          Maximum file size: 20 MB
        </span>

      </div>

    </div>
  );
}

export default UploadLoanTape;