import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

/**
 * PDF 파일을 페이지별로 분할합니다.
 * @param file 사용자가 업로드한 PDF 파일 (File 객체)
 * @returns 분할된 PDF Blob 들의 배열
 */
export async function splitPdf(file: File): Promise<Blob[]> {
    const arrayBuffer = await file.arrayBuffer();

    // 원본 문서 로드
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const pageCount = sourcePdf.getPageCount();
    const splitBlobs: Blob[] = [];

    console.log(`[Processing] Total pages to split: ${pageCount}`);

    for (let i = 0; i < pageCount; i++) {
        // 새 PDF 문서 생성
        const newPdf = await PDFDocument.create();

        // 원본 문서의 i번째 페이지를 복사하여 새 문서에 추가 (0-index 기반)
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
        newPdf.addPage(copiedPage);

        // 새 문서를 바이트 배열로 저장
        const pdfBytes = await newPdf.save();

        // Blob 생성 및 배열에 추가
        const splitBlob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
        splitBlobs.push(splitBlob);

        // 진행 상황 로깅 (추후 UI 업데이트 등에 활용 가능)
        if ((i + 1) % 5 === 0 || i + 1 === pageCount) {
            console.log(`[Processing] Processed ${i + 1} / ${pageCount} pages`);
        }
    }

    // 검증: 분할된 페이지 수가 원본 페이지 수와 일치하는지 확인
    if (splitBlobs.length !== pageCount) {
        throw new Error(`Page count mismatch. Expected ${pageCount}, got ${splitBlobs.length}`);
    }

    return splitBlobs;
}

/**
 * PDF 파일의 전체 페이지 수를 반환합니다.
 * @param file 업로드된 PDF 파일
 * @returns 전체 페이지 수
 */
export async function getPageCount(file: File): Promise<number> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return pdfDoc.getPageCount();
}

/**
 * 분할된 PDF 파일들을 하나의 ZIP 파일로 압축합니다.
 * @param pdfBlobs 분할된 PDF Blob 배열
 * @param originalFileName 원본 파일 이름 (확장자 포함 또는 미포함)
 * @returns 생성된 ZIP 파일 (Blob)
 */
export async function createZip(pdfBlobs: Blob[], originalFileName: string): Promise<Blob> {
    const zip = new JSZip();

    // 확장자 제거
    const fileNameBase = originalFileName.replace(/\.pdf$/i, "");

    // ZIP 내 파일 추가
    pdfBlobs.forEach((blob, index) => {
        // 1-based index, page_01, page_02... 형식
        const pageNumber = (index + 1).toString().padStart(2, "0");
        const fileName = `${fileNameBase}_page_${pageNumber}.pdf`;

        zip.file(fileName, blob);
    });

    console.log(`[Zip] Generating ZIP from ${pdfBlobs.length} files...`);

    // ZIP 파일 생성 (비동기)
    const zipBlob = await zip.generateAsync({ type: "blob" });

    console.log(`[Zip] Completed. Size: ${zipBlob.size} bytes`);

    return zipBlob;
}

/**
 * 여러 PDF 파일을 하나로 병합합니다.
 * @param files 병합할 PDF 파일 배열
 * @returns 병합된 PDF Blob
 */
export async function mergePdfs(files: File[]): Promise<Blob> {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    return new Blob([mergedPdfBytes as unknown as BlobPart], { type: "application/pdf" });
}
