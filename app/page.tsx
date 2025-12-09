
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { UploadView } from "@/components/views/UploadView";
// import { PreviewView } from "@/components/views/PreviewView"; // SSR Issue Fix
import { ProcessingView } from "@/components/views/ProcessingView";
import { SuccessView } from "@/components/views/SuccessView";
import { splitPdf, createZip } from "@/lib/pdf-processing";
import { toast } from "sonner";

const PreviewView = dynamic(() => import("@/components/views/PreviewView").then(mod => mod.PreviewView), {
  ssr: false,
  loading: () => <div className="p-10 text-center">Loading Preview...</div>
});

type ViewState = "IDLE" | "PREVIEW" | "PROCESSING" | "COMPLETED";

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>("IDLE");
  const [file, setFile] = useState<File | null>(null);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null); // For Phase 4

  // Phase 2: Handle File Upload -> Go to Preview
  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    setViewState("PREVIEW");
  };

  // Phase 3: Start Processing from Preview
  const handleStartProcessing = async () => {
    if (!file) return;
    setViewState("PROCESSING");

    try {
      // 1. PDF Split
      const splitBlobs = await splitPdf(file);

      // 2. ZIP Creation
      const createdZip = await createZip(splitBlobs, file.name);

      setZipBlob(createdZip);
      setViewState("COMPLETED");

      // Temporary: Log for verification
      console.log(`[Phase 3 Verified] Zip created: ${createdZip.size} bytes`);

    } catch (error) {
      console.error(error);
      toast.error("PDF 처리 중 오류가 발생했습니다.", {
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      });
      setViewState("IDLE");
      setFile(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setZipBlob(null);
    setViewState("IDLE");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            PDF Splitter
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">PDF 페이지 분할</h2>
            <p className="text-muted-foreground">
              브라우저에서 안전하고 간편하게 PDF를 페이지별로 분할하세요.
            </p>
          </div>

          {/* View Switching Area */}
          <div className="min-h-[300px] flex items-center justify-center transition-all duration-300">
            {viewState === "IDLE" && (
              <div className="w-full animate-in fade-in zoom-in-95 duration-300">
                <UploadView onUpload={handleFileUpload} />
              </div>
            )}

            {viewState === "PREVIEW" && file && (
              <div className="w-full">
                <PreviewView
                  file={file}
                  onStart={handleStartProcessing}
                  onCancel={handleReset}
                />
              </div>
            )}

            {viewState === "PROCESSING" && (
              <div className="w-full animate-in fade-in zoom-in-95 duration-300">
                <ProcessingView />
              </div>
            )}

            {viewState === "COMPLETED" && (
              <div className="w-full animate-in fade-in zoom-in-95 duration-300">
                <SuccessView
                  zipBlob={zipBlob}
                  fileName={file?.name || ""}
                  onReset={handleReset}
                />
              </div>
            )}
          </div>

          {/* Dev Helper - Only visible during dev if needed, or just part of the click interaction */}
          <div className="text-center text-xs text-muted-foreground mt-8">
            <p>Phase 1 Verification: Click the upload area to simulate flow.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} PDF Splitter. Client-side processing only.
        </div>
      </footer>
    </div>
  );
}
