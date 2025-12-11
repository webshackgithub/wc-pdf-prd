"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useDropzone } from "react-dropzone";
import { InteractiveRobotSpline } from "@/components/blocks/interactive-3d-robot";
import { ProcessingView } from "@/components/views/ProcessingView";
import { MergePrepView } from "@/components/views/MergePrepView";
import { splitPdf, createZip, mergePdfs } from "@/lib/pdf-processing";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

// Fix DOMMatrix Error: Dynamic import to disable SSR for react-pdf components
const SuccessView = dynamic(() => import("@/components/views/SuccessView").then(mod => mod.SuccessView), {
  ssr: false,
  loading: () => <div className="p-10 text-center">결과 불러오는 중...</div>
});

type ViewState = "IDLE" | "MERGE_PREP" | "PREVIEW" | "PROCESSING" | "COMPLETED";
type Mode = "SPLIT" | "MERGE";


export default function Home() {
  const [viewState, setViewState] = useState<ViewState>("IDLE");
  const [mode, setMode] = useState<Mode>("SPLIT");
  const [file, setFile] = useState<File | null>(null);
  const [mergeFiles, setMergeFiles] = useState<File[]>([]); // 병합용 파일 목록
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [splitBlobs, setSplitBlobs] = useState<Blob[]>([]);


  // 3D Scene URL
  const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

  // Dropzone Callback
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      // Common validation
      const validFiles = acceptedFiles.filter(f => f.type === "application/pdf");
      if (validFiles.length !== acceptedFiles.length) {
        toast.error("PDF 파일만 업로드 가능합니다.");
      }
      if (validFiles.length === 0) return;

      if (mode === "SPLIT") {
        // 분할 모드: 첫 번째 파일만 처리
        const targetFile = validFiles[0];
        if (targetFile.size > 100 * 1024 * 1024) {
          toast.error("파일 크기는 100MB를 초과할 수 없습니다.");
          return;
        }
        setFile(targetFile);
        handleStartProcessing(targetFile);
      } else {
        // 병합 모드: 파일 추가 후 준비 화면으로 이동
        // 파일들을 페이지별로 분리해서 추가
        toast.info("페이지를 추출하고 있습니다...");

        try {
          let newSplitFiles: File[] = [];

          for (const file of validFiles) {
            // 각 파일을 분할
            const blobs = await splitPdf(file);

            // Blob을 File 객체로 변환
            const splitFileObjects = blobs.map((blob, index) => {
              const pageNum = (index + 1).toString().padStart(2, "0");
              const newName = file.name.replace(/\.pdf$/i, `_p${pageNum}.pdf`);
              return new File([blob], newName, { type: "application/pdf" });
            });

            newSplitFiles = [...newSplitFiles, ...splitFileObjects];
          }

          setMergeFiles(prev => [...prev, ...newSplitFiles]);
          setViewState("MERGE_PREP");
          toast.success(`${newSplitFiles.length}개의 페이지가 추가되었습니다.`);

        } catch (error) {
          console.error("Failed to split dropped files:", error);
          toast.error("파일 처리 중 오류가 발생했습니다.");
        }
      }
    }
  }, [mode]);


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: mode === "MERGE", // 병합 모드에서는 다중 선택 허용
    noClick: false, // Allow clicking the robot area to upload
    disabled: viewState !== "IDLE"
  });

  const handleStartProcessing = async (targetFile: File) => {
    if (!targetFile) return;
    setViewState("PROCESSING");

    try {
      // 1. PDF Split & Zip
      const pages = await splitPdf(targetFile);
      const createdZip = await createZip(pages, targetFile.name);

      setSplitBlobs(pages);
      setZipBlob(createdZip);
      setViewState("COMPLETED");

    } catch (error) {
      console.error(error);
      toast.error("PDF 처리 중 오류가 발생했습니다.");
      setViewState("IDLE");
    }
  };

  const handleStartMerge = async () => {
    if (mergeFiles.length < 2) {
      toast.error("최소 2개 이상의 파일이 필요합니다.");
      return;
    }
    setViewState("PROCESSING");

    try {
      const mergedBlob = await mergePdfs(mergeFiles);

      // 병합된 결과를 1개의 결과로 취급 (SuccessView 재사용을 위해 zipBlob에 넣거나 별도 처리)
      // 여기서는 SuccessView가 'zip'과 'pages'를 보여주는 구조이므로, 
      // 병합 모드일 때는 'zipBlob'에 병합된 PDF를 넣고 다운로드하게 유도 (약간의 트릭)
      // 또는 SuccessView를 수정해야 함. 
      // 간단하게: zipBlob 자리에 merged PDF를 넣고 fileName을 .pdf로 설정.

      setZipBlob(mergedBlob);
      setSplitBlobs([]); // 병합 모드에선 개별 페이지 없음
      // 가짜 파일 객체 생성 (화면 표시용)
      const mergedFile = new File([mergedBlob], "merged_document.pdf", { type: "application/pdf" });
      setFile(mergedFile);

      setViewState("COMPLETED");

    } catch (error) {
      console.error(error);
      toast.error("병합 중 오류가 발생했습니다.");
      setViewState("MERGE_PREP");
    }
  };


  const handleReset = () => {
    setFile(null);
    setZipBlob(null);
    setSplitBlobs([]);
    setMergeFiles([]);
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
            <div className="absolute top-[10%] w-full text-center z-10 pointer-events-none px-4 flex flex-col items-center">
              <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg mb-4">
                PDF 분할 & 병합 로봇
              </h1>

              {/* Mode Switcher */}
              <div className="flex bg-white/20 backdrop-blur-md rounded-full p-1 mb-6 pointer-events-auto">
                <button
                  onClick={() => setMode("SPLIT")}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-bold transition-all",
                    mode === "SPLIT" ? "bg-white text-black shadow-lg" : "text-white hover:bg-white/10"
                  )}
                >
                  PDF 분할
                </button>
                <button
                  onClick={() => setMode("MERGE")}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-bold transition-all",
                    mode === "MERGE" ? "bg-white text-black shadow-lg" : "text-white hover:bg-white/10"
                  )}
                >
                  PDF 병합
                </button>
              </div>

              <p className="text-xl text-white/90 drop-shadow-md font-medium">
                {isDragActive
                  ? "여기에 파일을 놓아주세요!"
                  : mode === "SPLIT"
                    ? "PDF를 드래그하여 분할하세요."
                    : "여러 PDF를 드래그하여 하나로 합치세요."
                }
              </p>
            </div>


            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 md:w-72 md:h-72 lg:w-96 lg:h-96 z-20 pointer-events-auto"
            >
              {/* Draggable Area Wrapper */}
              <div
                {...getRootProps()}
                className={cn(
                  "w-full h-full rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center group",
                  isDragActive ? "bg-blue-500/20 ring-4 ring-blue-400 scale-110" : "hover:bg-white/5 hover:ring-2 hover:ring-white/20"
                )}
              >
                <input {...getInputProps()} />
              </div>
            </div>
          </>
        )}

        {/* State: MERGE_PREP */}
        {viewState === "MERGE_PREP" && (
          <div className="w-full relative z-20 px-4 pointer-events-auto">
            <MergePrepView
              files={mergeFiles}
              onFilesChange={setMergeFiles}
              onStart={handleStartMerge}
              onCancel={handleReset}
            />
          </div>
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
              mode={mode}
            />
          </div>
        )}

      </main>
    </div>
  );
}
