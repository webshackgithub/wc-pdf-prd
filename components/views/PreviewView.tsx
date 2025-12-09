"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, RotateCcw } from "lucide-react";

// React-PDF Worker 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PreviewViewProps {
    file: File;
    onStart: () => void;
    onCancel: () => void;
}

export function PreviewView({ file, onStart, onCancel }: PreviewViewProps) {
    const [numPages, setNumPages] = useState<number>(0);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    return (
        <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center gap-2">
                <h3 className="text-xl font-semibold">총 {numPages > 0 ? numPages : "?"}개의 페이지가 감지되었습니다</h3>
                <p className="text-muted-foreground text-sm">페이지 목록을 확인하고 분할을 시작하세요.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[500px] overflow-y-auto p-4 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
                <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="contents" // Grid 레이아웃 유지를 위해 contents 사용
                    loading={<div className="col-span-full text-center py-10">PDF 로딩 중...</div>}
                >
                    {Array.from(new Array(numPages), (el, index) => (
                        <Card key={`page_${index + 1}`} className="overflow-hidden">
                            <CardContent className="p-0 relative aspect-[1/1.414]">
                                <Page
                                    pageNumber={index + 1}
                                    width={200}
                                    className="w-full h-full object-contain"
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                                <div className="absolute bottom-0 right-0 bg-black/50 text-white text-xs px-2 py-1 rounded-tl">
                                    {index + 1}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </Document>
            </div>

            <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={onCancel} className="w-32 gap-2">
                    <RotateCcw className="w-4 h-4" />
                    취소
                </Button>
                <Button onClick={onStart} className="w-32 gap-2" size="lg">
                    <Play className="w-4 h-4" />
                    분할 시작
                </Button>
            </div>
        </div>
    );
}
