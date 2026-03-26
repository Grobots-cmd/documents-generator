import { v2 as cloudinary } from "cloudinary";

type DocType = "CONGRATULATIONS" | "QUIZ_PRORATE" | "ATTENDANCE" | "LATE_STAY" | "EVENT_WRITEUP_EN" | "EVENT_WRITEUP_HI";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const folderMap: Record<DocType, string> = {
  CONGRATULATIONS: "robotics-club/congratulations",
  QUIZ_PRORATE: "robotics-club/quiz-prorate",
  ATTENDANCE: "robotics-club/attendance",
  LATE_STAY: "robotics-club/late-stay",
  EVENT_WRITEUP_EN: "robotics-club/event-writeup",
  EVENT_WRITEUP_HI: "robotics-club/event-writeup",
};

export interface UploadMetadata {
  generatedById: string;
  generatedByName: string;
  documentType: DocType;
  eventName: string;
  memberIds: string[];
  templateVersion: number;
}

export async function uploadPdfToCloudinary(
  pdfBuffer: Buffer,
  fileName: string,
  docType: DocType,
  metadata: UploadMetadata
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderMap[docType],
        public_id: fileName.replace(".pdf", ""),
        resource_type: "raw",
        format: "pdf",
        tags: [
          `type:${metadata.documentType}`,
          `event:${metadata.eventName.replace(/\s+/g, "_")}`,
          `by:${metadata.generatedById}`,
        ],
        context: {
          generated_by: metadata.generatedById,
          generated_by_name: metadata.generatedByName,
          document_type: metadata.documentType,
          event_name: metadata.eventName,
          member_ids: metadata.memberIds.join(","),
          generation_timestamp: new Date().toISOString(),
          template_version: `v${metadata.templateVersion}`,
        },
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      }
    );

    uploadStream.end(pdfBuffer);
  });
}

/**
 * Generate a signed URL with 24-hour expiry for secure access.
 */
export function getSignedUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: "raw",
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  });
}

export { cloudinary };
