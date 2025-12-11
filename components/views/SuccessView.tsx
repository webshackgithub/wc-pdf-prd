"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, RotateCcw, FileDown, CheckSquare, Square, PackageCheck, Loader2 } from "lucide-react";
import { saveAs } from "file-saver";
import { createZip } from "@/lib/pdf-processing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// React-PDF Worker 설정 (PreviewView와 동일)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SuccessViewProps {
    zipBlob: Blob | null;
    file: File | null; // 원본 파일 추가
    pages: Blob[]; // 개별 페이지 Blob 배열
    fileName: string;
    onReset: () => void;
    mode?: "SPLIT" | "MERGE";
}

export function SuccessView({ zipBlob, file, pages, fileName, onReset, mode = "SPLIT" }: SuccessViewProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [hoveredPage, setHoveredPage] = useState<number | null>(null);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isLandscape, setIsLandscape] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    async function onDocumentLoadSuccess(pdf: any) {
        setNumPages(pdf.numPages);
        try {
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1 });
            setIsLandscape(viewport.width > viewport.height);
        } catch (error) {
            console.error("Failed to detect page orientation:", error);
        }
    }

    // Toggle Page Selection
    const toggleSelection = (index: number) => {
        const newSelected = new Set(selectedIndices);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedIndices(newSelected);
    };

    const handleDownloadZip = async () => {
        if (!zipBlob) return;
        setIsDownloading(true);
        // 짧은 지연을 주어 로딩 상태를 보여줌 (UX)
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            if (mode === "MERGE") {
                const downloadName = fileName || "merged.pdf"; // 병합 모드는 PDF 다운로드
                saveAs(zipBlob, downloadName);
            } else {
                const downloadName = fileName ? fileName.replace(/\.pdf$/i, ".zip") : "split-pages.zip";
                saveAs(zipBlob, downloadName);
            }
        } catch (error) {
            console.error(error);
            toast.error("다운로드 실패");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadSelected = async () => {
        if (selectedIndices.size === 0) {
            toast.error("선택된 페이지가 없습니다.");
            return;
        }

        setIsDownloading(true);
        try {
            // Get Blobs for selected indices
            const selectedBlobs = Array.from(selectedIndices)
                .sort((a, b) => a - b) // Ensure order
                .map(index => pages[index]);

            // Create a new ZIP with only selected pages
            // We use a modified name for the selected zip
            const nameBase = fileName ? fileName.replace(/\.pdf$/i, "") : "doc";
            const selectedZipBlob = await createZip(selectedBlobs, `${nameBase}_selected.pdf`);

            saveAs(selectedZipBlob, `${nameBase}_selected(${selectedIndices.size}).zip`);
            toast.success(`${selectedIndices.size}개의 페이지가 다운로드되었습니다.`);
        } catch (error) {
            console.error(error);
            toast.error("다운로드 중 오류가 발생했습니다.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadPage = (e: React.MouseEvent, index: number) => {
        e.stopPropagation(); // Prevent card toggling
        if (!pages || !pages[index]) return;
        const pageBlob = pages[index];
        const pageNum = (index + 1).toString().padStart(2, "0");
        const downloadName = fileName
            ? fileName.replace(/\.pdf$/i, `_p${pageNum}.pdf`)
            : `page_${pageNum}.pdf`;

        saveAs(pageBlob, downloadName);
    };

    return (
        <div className="w-full space-y-6">
            <Card className="w-full max-w-6xl mx-auto">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <CardTitle className="text-xl">변환 완료!</CardTitle>
                    <p className="text-muted-foreground">
                        총 {numPages > 0 ? numPages : "?"}개의 페이지로 분할되었습니다.
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            className="w-full sm:w-48 gap-2"
                            size="lg"
                            onClick={handleDownloadZip}
                            disabled={!zipBlob || isDownloading}
                        >
                            {isDownloading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {isDownloading ? "다운로드 중..." : (mode === "MERGE" ? "병합된 PDF 다운로드" : "전체 ZIP 다운로드")}
                        </Button>
                        {mode === "SPLIT" && (
                            <Button
                                className="w-full sm:w-48 gap-2"
                                size="lg"
                                variant="secondary"
                                onClick={handleDownloadSelected}
                                disabled={selectedIndices.size === 0 || isDownloading}
                            >
                                {isDownloading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <PackageCheck className="w-4 h-4" />
                                )}
                                {isDownloading ? "처리 중..." : `선택 다운로드 (${selectedIndices.size})`}
                            </Button>
                        )}
                        <Button variant="outline" className="w-full sm:w-48 gap-2" onClick={onReset}>
                            <RotateCcw className="w-4 h-4" />
                            처음으로
                        </Button>
                    </div>

                    {/* Thumbnail Grid */}
                    {file && (
                        <div className="mt-8">
                            <div className="flex justify-between items-center mb-4 px-1">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    페이지 목록 (클릭하여 선택, 마우스 오버하여 개별 다운로드)
                                </h4>
                                {selectedIndices.size > 0 && (
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedIndices(new Set())} className="text-muted-foreground hover:text-red-500 h-8">
                                        선택 해제
                                    </Button>
                                )}
                            </div>

                            <div className={cn(
                                "grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto p-4 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50",
                                isLandscape ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-4 lg:grid-cols-5"
                            )}>
                                <Document
                                    file={file}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    className="contents"
                                    loading={<div className="col-span-full text-center py-10">썸네일 로딩 중...</div>}
                                >
                                    {Array.from(new Array(numPages), (el, index) => {
                                        const isSelected = selectedIndices.has(index);
                                        return (
                                            <Card
                                                key={`page_${index + 1}`}
                                                className={cn(
                                                    "overflow-hidden border-2 shadow-sm transition-all duration-200 group relative cursor-pointer",
                                                    "hover:shadow-xl hover:border-primary/50",
                                                    isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                                                )}
                                                onClick={() => toggleSelection(index)}
                                                onMouseEnter={() => setHoveredPage(index)}
                                                onMouseLeave={() => setHoveredPage(null)}
                                            >
                                                <CardContent className={cn(
                                                    "p-0 relative flex items-center justify-center bg-gray-100 dark:bg-gray-800",
                                                    isLandscape ? "aspect-[1.414/1]" : "aspect-[1/1.414]"
                                                )}>
                                                    <Page
                                                        pageNumber={index + 1}
                                                        width={isLandscape ? 300 : 180}
                                                        className="shadow-sm max-w-full max-h-full h-auto w-auto"
                                                        renderTextLayer={false}
                                                        renderAnnotationLayer={false}
                                                    />

                                                    {/* Selection Indicator (Top-Left) */}
                                                    <div className="absolute top-2 left-2 z-10">
                                                        {isSelected ? (
                                                            <div className="bg-primary text-primary-foreground rounded-sm p-0.5 shadow-md">
                                                                <CheckSquare className="w-5 h-5" />
                                                            </div>
                                                        ) : (
                                                            <div className="bg-white/80 text-gray-400 rounded-sm p-0.5 shadow-sm hover:text-gray-600 transition-colors">
                                                                <Square className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Page Number Badge (Bottom-Right now to avoid overlap or Top-Right) */}
                                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded shadow-sm pointer-events-none">
                                                        #{index + 1}
                                                    </div>

                                                    {/* Hover Overlay with Download Button (Only in SPLIT mode or if pages exist) */}
                                                    {mode === "SPLIT" && (
                                                        <div className={cn(
                                                            "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                                                            hoveredPage === index ? "opacity-100" : "opacity-0",
                                                            // Prevent toggle when clicking the button area by stopping propagation on the button itself
                                                        )}>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                className="gap-2 shadow-lg hover:scale-105 transition-transform"
                                                                onClick={(e) => handleDownloadPage(e, index)}
                                                            >
                                                                <FileDown className="w-4 h-4" />
                                                                다운로드
                                                            </Button>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </Document>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
