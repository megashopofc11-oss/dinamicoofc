import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { Batch, ModelCalibration, Plaque } from '../types';
import { renderPlaqueCanvas, renderPlaqueToBlob } from './renderer';
import { formatSequence } from '../utils/formatters';

export interface ExportProgress {
  current: number;
  total: number;
  percentage: number;
  statusText: string;
}

/**
 * Trigger immediate browser download of a Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * 1. Download Individual High-Resolution PNG (10x10 cm @ 300 DPI)
 */
export async function downloadSinglePlaquePng(
  model: ModelCalibration,
  plaque: Plaque
): Promise<void> {
  const blob = await renderPlaqueToBlob(model, plaque, { width: 1181, height: 1181 });
  const filename = `PLACA-${plaque.formattedNumber || formatSequence(plaque.sequenceNumber)}.png`;
  downloadBlob(blob, filename);
}

/**
 * 2. Download Full Batch ZIP Archive
 */
export async function downloadBatchZip(
  batch: Batch,
  model: ModelCalibration,
  plaques: Plaque[],
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const zip = new JSZip();
  const folderName = `LOTE-${batch.id.substring(0, 8)}-${model.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const folder = zip.folder(folderName) || zip;
  const total = plaques.length;

  for (let i = 0; i < total; i++) {
    const plaque = plaques[i];
    const seqStr = plaque.formattedNumber || formatSequence(plaque.sequenceNumber);
    
    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        percentage: Math.round(((i + 1) / total) * 90),
        statusText: `Renderizando plaquinha ${seqStr} (${i + 1}/${total})...`
      });
    }

    const blob = await renderPlaqueToBlob(model, plaque, { width: 1181, height: 1181 });
    const fileName = `PLACA-${seqStr}.png`;
    folder.file(fileName, blob);
  }

  if (onProgress) {
    onProgress({
      current: total,
      total,
      percentage: 95,
      statusText: 'Compactando arquivo ZIP final...'
    });
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const zipFilename = `${folderName}.zip`;
  downloadBlob(zipBlob, zipFilename);

  if (onProgress) {
    onProgress({
      current: total,
      total,
      percentage: 100,
      statusText: 'Download concluído com sucesso!'
    });
  }
}

/**
 * 3. Download Professional A4 PDF (4 Plaques of 10x10 cm per sheet, 2x2 grid)
 * Page dimensions: A4 portrait is 210 mm x 297 mm
 * Plaque size: exactly 100 mm x 100 mm (10x10 cm)
 * Margin Left/Right: (210 - 200) / 2 = 5 mm
 * Margin Top/Bottom: (297 - 200) / 2 = 48.5 mm
 */
export async function downloadBatchPdfA4(
  batch: Batch,
  model: ModelCalibration,
  plaques: Plaque[],
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  // A4 portrait: 210 x 297 mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const total = plaques.length;
  const plaquesPerPage = 4;
  const totalPages = Math.ceil(total / plaquesPerPage);

  const plaqueSizeMm = 100; // 10 cm = 100 mm
  const marginLeft = 5; // mm -> 5 + 100 + 100 + 5 = 210 mm
  const marginTop = 48.5; // mm -> 48.5 + 100 + 100 + 48.5 = 297 mm

  const positions = [
    { x: marginLeft, y: marginTop },                          // Top-Left (Row 0, Col 0)
    { x: marginLeft + plaqueSizeMm, y: marginTop },           // Top-Right (Row 0, Col 1)
    { x: marginLeft, y: marginTop + plaqueSizeMm },           // Bottom-Left (Row 1, Col 0)
    { x: marginLeft + plaqueSizeMm, y: marginTop + plaqueSizeMm } // Bottom-Right (Row 1, Col 1)
  ];

  for (let i = 0; i < total; i++) {
    const pageIndex = Math.floor(i / plaquesPerPage);
    const posIndex = i % plaquesPerPage;

    if (i > 0 && posIndex === 0) {
      pdf.addPage('a4', 'portrait');
    }

    const plaque = plaques[i];
    const seqStr = plaque.formattedNumber || formatSequence(plaque.sequenceNumber);

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        percentage: Math.round(((i + 1) / total) * 90),
        statusText: `Compondo folha A4 (Página ${pageIndex + 1}/${totalPages} - Placa ${seqStr})...`
      });
    }

    // Render canvas at full 1181x1181 px resolution
    const canvas = await renderPlaqueCanvas(model, plaque, { width: 1181, height: 1181 });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const pos = positions[posIndex];
    pdf.addImage(imgData, 'JPEG', pos.x, pos.y, plaqueSizeMm, plaqueSizeMm);

    // Draw precise fine cutting guidelines (cruzetas de corte / linhas guias)
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.15);
    pdf.rect(pos.x, pos.y, plaqueSizeMm, plaqueSizeMm);
  }

  // Add header & footer meta info on all pages
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);

    // Header
    pdf.text(
      `DINÂMICO PRO | Lote: ${batch.name} | Modelo: ${model.name} | 10 × 10 cm`,
      105,
      20,
      { align: 'center' }
    );

    // Footer
    pdf.text(
      `Página ${p} de ${totalPages} • Imprimir em tamanho real 100% (Sem ajustar à página/Sem bordas) • Corte nas marcas indicadas`,
      105,
      285,
      { align: 'center' }
    );
  }

  if (onProgress) {
    onProgress({
      current: total,
      total,
      percentage: 98,
      statusText: 'Gerando arquivo PDF para impressão...'
    });
  }

  const filename = `IMPRESSAO-A4-LOTE-${batch.id.substring(0, 8)}.pdf`;
  pdf.save(filename);

  if (onProgress) {
    onProgress({
      current: total,
      total,
      percentage: 100,
      statusText: 'PDF A4 baixado com sucesso!'
    });
  }
}
