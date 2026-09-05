"use client";

import { useState, useEffect } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth.context";

export default function BulkEnrichmentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [bulkJobId, setBulkJobId] = useState<string | null>(null);
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("idle");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/api/v1/bulk/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        setUploadStatus("success");
        setBulkJobId(data.data.bulkJobId);
      } else {
        setUploadStatus("error");
      }
    } catch (err) {
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Bulk Enrichment</h1>
        <p className="text-zinc-400 mt-2">
          Upload a CSV file with names, companies, or LinkedIn URLs to enrich hundreds of contacts at once.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg p-12 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors">
          <UploadCloud className="h-10 w-10 text-zinc-400 mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">Select a CSV File</h3>
          <p className="text-sm text-zinc-500 mb-6 text-center max-w-xs">
            Make sure your CSV has headers like "First Name", "Last Name", "Company", or "LinkedIn".
          </p>
          
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            id="csv-upload"
            onChange={handleFileChange}
          />
          <label 
            htmlFor="csv-upload"
            className="cursor-pointer px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors"
          >
            Browse Files
          </label>
        </div>

        {file && (
          <div className="mt-6 flex items-center justify-between bg-zinc-950 p-4 rounded-lg border border-zinc-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-violet-500/10 rounded-md">
                <FileSpreadsheet className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Start Enrichment"
              )}
            </button>
          </div>
        )}

        {uploadStatus === "success" && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start space-x-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-emerald-500">Upload Successful</h4>
              <p className="text-sm text-zinc-400 mt-1">
                Your file is now being processed in the background. You can track progress below.
              </p>
            </div>
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-500">Upload Failed</h4>
              <p className="text-sm text-zinc-400 mt-1">
                There was a problem uploading your file. Please check the format and try again.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress / History Section */}
      {bulkJobId && (
        <JobProgressTracker jobId={bulkJobId} />
      )}
    </div>
  );
}

function JobProgressTracker({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3001/api/v1/bulk/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setJob(data.data);
          
          if (data.data.status === "COMPLETED" || data.data.status === "FAILED") {
            clearInterval(interval);
          }
        }
      } catch (err) {}
    };

    fetchStatus(); // initial
    interval = setInterval(fetchStatus, 2000); // poll every 2s

    return () => clearInterval(interval);
  }, [jobId]);

  if (!job) return null;

  const percent = job.totalRows > 0 ? Math.round((job.processedRows / job.totalRows) * 100) : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-white">Job Status: {job.status}</h3>
          <p className="text-sm text-zinc-400">File: {job.fileName}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-white">{percent}%</span>
        </div>
      </div>

      <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-violet-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percent}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-4 text-sm">
        <span className="text-zinc-400">{job.processedRows} of {job.totalRows} rows processed</span>
        <span className="text-emerald-400">{job.successfulRows} matches found</span>
      </div>
      
      {job.status === "COMPLETED" && (
        <div className="mt-6">
          <a
            href={`http://localhost:3001/api/v1/bulk/${jobId}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors"
          >
            Download Results (CSV)
          </a>
        </div>
      )}
    </div>
  );
}
