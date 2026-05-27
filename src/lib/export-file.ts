/**
 * Export conversation as PNG image using html2canvas.
 * Export conversation as PDF using jspdf + html2canvas.
 */
export async function exportAsPNG(element: HTMLElement): Promise<Blob | null> {
  try {
    // Dynamically load html2canvas
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    if (!document.querySelector(`script[src="${script.src}"]`)) {
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('html2canvas load failed'));
        document.head.appendChild(script);
      });
    }

    const html2canvas = (window as unknown as Record<string, unknown>).html2canvas as (
      el: HTMLElement, opts?: { scale?: number; backgroundColor?: string }
    ) => Promise<HTMLCanvasElement>;

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#0a0f1e',
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  } catch {
    return null;
  }
}

export async function exportAsPDF(element: HTMLElement): Promise<Blob | null> {
  try {
    // Load html2canvas if not loaded
    let html2canvas = (window as unknown as Record<string, unknown>).html2canvas as (
      el: HTMLElement, opts?: { scale?: number; backgroundColor?: string }
    ) => Promise<HTMLCanvasElement>;
    if (!html2canvas) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      if (!document.querySelector(`script[src="${s.src}"]`)) {
        await new Promise<void>((resolve, reject) => {
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('html2canvas load failed'));
          document.head.appendChild(s);
        });
      }
      html2canvas = (window as unknown as Record<string, unknown>).html2canvas as typeof html2canvas;
    }

    // Load jspdf
    const jsScript = document.createElement('script');
    jsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js';
    if (!document.querySelector(`script[src="${jsScript.src}"]`)) {
      await new Promise<void>((resolve, reject) => {
        jsScript.onload = () => resolve();
        jsScript.onerror = () => reject(new Error('jspdf load failed'));
        document.head.appendChild(jsScript);
      });
    }

    const { jsPDF } = (window as unknown as Record<string, { jsPDF: new (orientation?: string, unit?: string, format?: string) => { addImage: (data: string, fmt: string, x: number, y: number, w: number, h: number) => void; addPage: () => void; save: (name: string) => void; output: (type: string) => Blob } }>).jspdf;

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#0a0f1e',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297; // A4 height

    while (heightLeft > 0) {
      position = -(297 * (1 + (imgHeight - heightLeft) / imgHeight));
      pdf.addPage!();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    const blob = pdf.output!('blob');
    return blob;
  } catch {
    return null;
  }
}
