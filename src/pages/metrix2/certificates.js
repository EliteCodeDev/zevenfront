import { useEffect, useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const Certificados = ({ certificates }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        console.log("Certificates recibido:", certificates);

        if (!certificates) {
          throw new Error("No se proporcionaron datos de certificados");
        }

        const isRetiro = certificates.tipoChallenge === "retirado";
        const pdfBasePath = isRetiro ? "/pdf/Retiro.pdf" : "/pdf/Certificado2.pdf";

        console.log("Intentando cargar PDF desde:", pdfBasePath);
        const existingPdfBytes = await fetch(pdfBasePath).then(res => {
          if (!res.ok) throw new Error(`No se pudo cargar el PDF: ${res.status}`);
          return res.arrayBuffer();
        });

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const { width, height } = firstPage.getSize();

        // Determinar si estamos en un dispositivo móvil
        const isMobile = window.innerWidth < 768;
        
        // Ajustar tamaños y posiciones según el dispositivo
        const nameFontSize = isMobile ? 60 : 90;
        const dateFontSize = isMobile ? 30 : 45;
        const qrSize = isMobile ? 150 : 220;
        const qrBackgroundSize = isMobile ? 180 : 250;
        
        // Calcular posiciones ajustadas que mantengan las proporciones
        // independientemente del tamaño de pantalla
        let nameX, nameY, dateX, dateY, qrX, qrY, qrBgX, qrBgY, montoX, montoY, montoSize;
        
        if (isRetiro) {
          // Posiciones para certificado de retiro
          nameX = width / 2 - (isMobile ? 300 : 420);
          nameY = height / 2 - (isMobile ? 100 : 140);
          dateX = width / 2 - (isMobile ? 300 : 420);
          dateY = height / 2 - (isMobile ? 500 : 540);
          qrBgX = width / 2 + (isMobile ? 700 : 865);
          qrBgY = height / 2 - (isMobile ? 400 : 455);
          qrX = qrBgX + 15;
          qrY = qrBgY + 15;
          montoX = width / 2 - (isMobile ? 150 : 190);
          montoY = height / 2 - (isMobile ? 280 : 320);
          montoSize = isMobile ? 70 : 100;
        } else {
          // Posiciones para certificado normal
          nameX = width / 2 - (isMobile ? 350 : 460);
          nameY = height / 2 - (isMobile ? 100 : 130);
          dateX = width / 2 - (isMobile ? 350 : 450);
          dateY = height / 2 - (isMobile ? 500 : 530);
          qrBgX = width / 2 + (isMobile ? 700 : 865);
          qrBgY = height / 2 - (isMobile ? 400 : 455);
          qrX = qrBgX + 15;
          qrY = qrBgY + 15;
        }

        // Usar directamente la imagen QR en base64
        const qrImageBytes = await fetch(certificates.qrLink).then(res => res.arrayBuffer());
        const qrImage = await pdfDoc.embedPng(qrImageBytes);

        if (isRetiro) {
          firstPage.drawText(`${certificates.firstName} ${certificates.lastName}`, {
            x: nameX,
            y: nameY,
            size: nameFontSize,
            font,
            color: rgb(0.8, 0.8, 0.8),
          });

          firstPage.drawText(`${certificates.fechaFinChallenge}`, {
            x: dateX,
            y: dateY,
            size: dateFontSize,
            font,
            color: rgb(0.8, 0.8, 0.8),
          });

          // Dibujar fondo ámbar detrás del QR
          firstPage.drawRectangle({
            x: qrBgX,
            y: qrBgY,
            width: qrBackgroundSize,
            height: qrBackgroundSize,
            color: rgb(1, 0.8, 0),  // Color ámbar
            borderWidth: 0,
          });
          
          firstPage.drawImage(qrImage, {
            x: qrX,
            y: qrY,
            width: qrSize,
            height: qrSize,
          });

          firstPage.drawText(`$ ${certificates.monto}`, {
            x: montoX,
            y: montoY,
            size: montoSize,
            font,
            color: rgb(0.8, 0.8, 0.8),
          });
        } else {
          firstPage.drawText(`${certificates.firstName} ${certificates.lastName}`, {
            x: nameX,
            y: nameY,
            size: nameFontSize,
            font,
            color: rgb(0.8, 0.8, 0.8),
          });

          firstPage.drawText(`${certificates.fechaFinChallenge}`, {
            x: dateX,
            y: dateY,
            size: dateFontSize,
            font,
            color: rgb(0.8, 0.8, 0.8),
          });

          // Dibujar fondo ámbar detrás del QR
          firstPage.drawRectangle({
            x: qrBgX,
            y: qrBgY,
            width: qrBackgroundSize,
            height: qrBackgroundSize,
            color: rgb(1, 0.8, 0),  // Color ámbar
            borderWidth: 0,
          });
          
          firstPage.drawImage(qrImage, {
            x: qrX,
            y: qrY,
            width: qrSize,
            height: qrSize,
          });
        }

        const modifiedPdfBytes = await pdfDoc.save();
        const pdfBlob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar el PDF:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    loadPdf();
    
    // Limpieza de URL al desmontar
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [certificates]);

  // Función para descargar el PDF
  const handleDownload = () => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Certificado_${certificates?.firstName || ''}_${certificates?.lastName || ''}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Funciones para el zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 20, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 20, 60));
  };

  // Si está cargando, mostramos un spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center w-full h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {pdfUrl ? (
        <div className="flex flex-col w-full">
          {/* Contenedor responsivo para el PDF */}
          <div 
            className="w-full overflow-auto bg-white dark:bg-zinc-900 rounded-lg shadow-lg"
            style={{ 
              maxHeight: 'calc(100vh - 200px)',
              minHeight: '300px'
            }}
          >
            <div 
              style={{ 
                transform: `scale(${zoom/100})`, 
                transformOrigin: 'top center',
                width: `${100/(zoom/100)}%`,
                margin: '0 auto'
              }}
            >
              <iframe
                src={pdfUrl}
                width="100%"
                className="border rounded-lg h-[500px] md:h-[600px] lg:h-[750px]"
                title="Certificado PDF"
              ></iframe>
            </div>
          </div>
          
          
        </div>
      ) : error ? (
        <div className="w-full p-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg">
          <p className="text-lg text-red-600 dark:text-red-400 flex items-center">
            <span className="mr-2">⚠️</span> 
            Error: {error}
          </p>
        </div>
      ) : (
        <div className="w-full p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg">
          <p className="text-lg text-amber-600 dark:text-amber-400 flex items-center">
            <span className="mr-2">⚠️</span>
            No hay certificados disponibles
          </p>
        </div>
      )}
    </div>
  );
};

export default Certificados;