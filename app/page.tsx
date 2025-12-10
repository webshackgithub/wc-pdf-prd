"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useDropzone } from "react-dropzone";
import { InteractiveRobotSpline } from "@/components/blocks/interactive-3d-robot";
import { ProcessingView } from "@/components/views/ProcessingView";
import { splitPdf, createZip } from "@/lib/pdf-processing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Fix DOMMatrix Error: Dynamic import to disable SSR for react-pdf components
const SuccessView = dynamic(() => import("@/components/views/SuccessView").then(mod => mod.SuccessView), {
  ssr: false,
  loading: () => <div className="p-10 text-center">결과 불러오는 중...</div>
});

type ViewState = "IDLE" | "PREVIEW" | "PROCESSING" | "COMPLETED";

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>("IDLE");
  const [file, setFile] = useState<File | null>(null);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [splitBlobs, setSplitBlobs] = useState<Blob[]>([]);

  // 3D Scene URL
  const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

  // Dropzone Callback
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      // Reuse validation logic from UploadView or implement simple validation here
      if (uploadedFile.type !== "application/pdf") {
        toast.error("PDF 파일만 업로드 가능합니다.");
        return;
      }
      if (uploadedFile.size > 100 * 1024 * 1024) { // 100MB
        toast.error("파일 크기는 100MB를 초과할 수 없습니다.");
        return;
      }

      setFile(uploadedFile);
      handleStartProcessing(uploadedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    noClick: false, // Allow clicking the robot area to upload
    disabled: viewState !== "IDLE"
  });

  const handleStartProcessing = async (targetFile: File) => {
    if (!targetFile) return;
    setViewState("PROCESSING");

    try {
      // 1. PDF Split
      const pages = await splitPdf(targetFile);
      setSplitBlobs(pages);

      // 2. ZIP Creation
      const createdZip = await createZip(pages, targetFile.name);

      setZipBlob(createdZip);
      setViewState("COMPLETED");

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
    <div className="flex flex-col min-h-screen bg-black overflow-hidden relative">

      {/* 1. Full Screen 3D Robot Background */}
      <div className="absolute inset-0 z-0">
        <InteractiveRobotSpline
          scene={ROBOT_SCENE_URL}
          className="w-full h-full block"
        />
      </div>

      <main className="flex-1 w-full h-full flex flex-col items-center justify-center relative z-10 pointer-events-none">

        {/* State: IDLE - Head Dropzone */}
        {viewState === "IDLE" && (
          <>
            {/* Overlay Text / Instructions */}
            <div className="absolute top-10 w-full text-center z-10 pointer-events-none">
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-4">
                PDF 분할 로봇
              </h1>
              <p className="text-xl text-white/90 drop-shadow-md font-medium">
                {isDragActive
                  ? "여기에 PDF를 놓아주세요!"
                  : "PDF를 로봇 위로 드래그하거나 클릭하여 업로드하세요."
                }
              </p>
            </div>

            <div
              className="absolute top-[18%] left-1/2 -translate-x-1/2 w-64 h-64 z-20 pointer-events-auto"
            >
              {/* Draggable Area Wrapper targeting Robot Head */}
              <div
                {...getRootProps()}
                className={cn(
                  "w-full h-full rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center group",
                  isDragActive ? "bg-blue-500/20 ring-4 ring-blue-400 scale-110" : "hover:bg-white/10 hover:ring-2 hover:ring-white/30"
                )}
              >
                <input {...getInputProps()} />
              </div>
            </div>
          </>
        )}

        {/* State: PROCESSING */}
        {viewState === "PROCESSING" && (
          <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300 pointer-events-auto bg-black/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
            <ProcessingView />
          </div>
        )}

        {/* State: COMPLETED */}
        {viewState === "COMPLETED" && (
          <div className="w-full animate-in fade-in zoom-in-95 duration-300 pointer-events-auto">
            <SuccessView
              zipBlob={zipBlob}
              file={file}
              pages={splitBlobs}
              fileName={file?.name || ""}
              onReset={handleReset}
            />
          </div>
        )}

      </main>
    </div>
  );
}
