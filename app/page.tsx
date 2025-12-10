
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { UploadView } from "@/components/views/UploadView";
// import { PreviewView } from "@/components/views/PreviewView"; // Deprecated
import { ProcessingView } from "@/components/views/ProcessingView";
import { splitPdf, createZip } from "@/lib/pdf-processing";
import { toast } from "sonner";

// Fix DOMMatrix Error: Dynamic import to disable SSR for react-pdf components
const SuccessView = dynamic(() => import("@/components/views/SuccessView").then(mod => mod.SuccessView), {
  ssr: false,
  loading: () => <div className="p-10 text-center">Loading Results...</div>
});

type ViewState = "IDLE" | "PREVIEW" | "PROCESSING" | "COMPLETED";

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>("IDLE");
  const [file, setFile] = useState<File | null>(null);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [splitBlobs, setSplitBlobs] = useState<Blob[]>([]); // New State for individual pages

  // Phase 4: Direct Processing Flow (Upload -> Processing -> Success)
  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    handleStartProcessing(uploadedFile); // Process immediately
  };

  const handleStartProcessing = async (targetFile: File) => {
    // Note: We use targetFile directly because state update 'setFile' might not be reflected yet
    if (!targetFile) return;
    setViewState("PROCESSING");

    try {
      // 1. PDF Split
      const pages = await splitPdf(targetFile);
      setSplitBlobs(pages); // Store split pages

      // 2. ZIP Creation
      const createdZip = await createZip(pages, targetFile.name);

      setZipBlob(createdZip);
      setViewState("COMPLETED");

      // Temporary: Log for verification
      console.log(`[Phase 4 Simplified] Zip created: ${createdZip.size} bytes`);

    } catch (error) {
      console.error(error);
      toast.error("PDF 처리 중 오류가 발생했습니다.", {
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      });
      setViewState("IDLE");
      setFile(null);
      setSplitBlobs([]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setZipBlob(null);
    setSplitBlobs([]);
    setViewState("IDLE");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-6xl space-y-8"> {/* Increased width for 5-col grid */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">PDF 페이지 분할</h2>
            <p className="text-muted-foreground">
              브라우저에서 안전하고 간편하게 PDF를 페이지별로 분할하세요.
            </p>
          </div>

          {/* View Switching Area */}
          <div className="min-h-[300px] flex items-center justify-center transition-all duration-300">
            {viewState === "IDLE" && (
              <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300">
                <UploadView onUpload={handleFileUpload} />
              </div>
            )}

            {/* Preview State Removed */}

            {viewState === "PROCESSING" && (
              <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300">
                <ProcessingView />
              </div>
            )}

            {viewState === "COMPLETED" && (
              <div className="w-full animate-in fade-in zoom-in-95 duration-300">
                <SuccessView
                  zipBlob={zipBlob}
                  file={file}
                  pages={splitBlobs}
                  fileName={file?.name || ""}
                  onReset={handleReset}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
