import { Router } from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import { HttpErrors } from "../middleware/error.middleware";
import { BulkJobModel } from "@linkedon/database";
import { enrichmentQueue } from "../queues/enrichment.queue";

export const bulkRouter = Router();
bulkRouter.use(authenticate);

// Configure multer for file uploads (storing temporarily in memory/tmp)
const upload = multer({ dest: "/tmp/linkedon-uploads/" });

// POST /bulk/upload
bulkRouter.post("/upload", upload.single("file"), async (req: AuthenticatedRequest, res) => {
  if (!req.file) {
    throw HttpErrors.badRequest("No file uploaded");
  }

  const workspaceId = req.workspaceId;
  const userId = req.user!._id;

  // 1. Create a BulkJob record in DB
  const bulkJob = await BulkJobModel.create({
    workspaceId,
    userId,
    fileName: req.file.originalname,
    status: "PROCESSING",
  });

  const results: any[] = [];
  
  // 2. Parse CSV
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      // 3. Update total rows
      bulkJob.totalRows = results.length;
      await bulkJob.save();

      // 4. Dispatch jobs to BullMQ
      const jobs = results.map((row, index) => {
        // Basic mapping logic for CSV columns -> Enrichment params
        const email = row.email || row.Email || row.EMAIL;
        const firstName = row.first_name || row.firstName || row["First Name"];
        const lastName = row.last_name || row.lastName || row["Last Name"];
        const companyName = row.company || row.companyName || row["Company"];
        const linkedinUrl = row.linkedin || row.linkedinUrl || row["LinkedIn"];

        return {
          name: `bulk-enrich-${bulkJob._id}-${index}`,
          data: {
            workspaceId,
            userId,
            bulkJobId: bulkJob._id.toString(),
            input: {
              email,
              firstName,
              lastName,
              companyName,
              linkedinUrl,
            },
            saveContact: true,
          }
        };
      });

      // Add jobs in bulk
      await enrichmentQueue.addBulk(jobs);

      // Clean up the temp file
      fs.unlink(req.file!.path, (err) => {
        if (err) console.error("Failed to delete temp file:", err);
      });
    });

  res.json({
    success: true,
    data: {
      bulkJobId: bulkJob._id,
      message: "CSV uploaded and processing started.",
    }
  });
});

// GET /bulk/:jobId
bulkRouter.get("/:jobId", async (req: AuthenticatedRequest, res) => {
  const job = await BulkJobModel.findOne({
    _id: req.params.jobId,
    workspaceId: req.workspaceId,
  });

  if (!job) {
    throw HttpErrors.notFound("Bulk job not found");
  }

  res.json({
    success: true,
    data: job,
  });
});

// GET /bulk/:jobId/download
bulkRouter.get("/:jobId/download", async (req: AuthenticatedRequest, res) => {
  const job = await BulkJobModel.findOne({
    _id: req.params.jobId,
    workspaceId: req.workspaceId,
  });

  if (!job) {
    throw HttpErrors.notFound("Bulk job not found");
  }

  // Set CSV headers
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=enriched-${job.fileName}`);
  
  // Minimal CSV generation for MVP
  // In a real app, we'd query the ContactModel or EnrichmentModel
  res.write("email,first_name,last_name,company\n");
  res.write("test@example.com,John,Doe,Acme\n"); // Placeholder data
  res.end();
});
