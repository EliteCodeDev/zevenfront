"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useStrapiData } from "src/services/strapiService";
import { useSession } from "next-auth/react";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";

export default function RuletaSorteo({
  customOptions,
  width = 200,
  height = 200,
  centerImage = null, // Imagen central
  documentId,
  onClose, // Para el botón de "Salir" o "Cerrar"
}) {
  const { data: session } = useSession();
  const { data, error, loading } = useStrapiData("rewards");
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [startAngle, setStartAngle] = useState(0);
  const canvasRef = useRef(null);
  const [centerImageLoaded, setCenterImageLoaded] = useState(false);
  const centerImageRef = useRef(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [codigoCopiad, setCodigoCopiad] = useState(false);

  const animationRef = useRef(null);
  const celebrationRef = useRef(null);
  const currentAngleRef = useRef(startAngle);
  const winningIndexRef = useRef(null);
  const codigoRef = useRef(null);

  // Paleta metálica
  const primaryColor = "var(--app-primary)"; // Ajusta según tu theme
  const secondaryColor = "var(--app-secondary)";
  const metalLight = "#93c5fd";
  const metalMid = "#3b82f6";
  const metalDark = "#1e40af";
  const chromeDark = "#0f172a";
  const chromeLight = "#94a3b8";

  // Opciones de la ruleta
  let opciones = [];
  if (customOptions?.length > 0) {
    opciones = customOptions;
  } else if (data) {
    opciones = data.map((item) => ({
      name: String(item.nombre),
      documentId: item.documentId,
    }));
  }

  // Constante: El puntero está en la parte inferior (90 grados / π/2 rad)
  const angleOffset = Math.PI / 2;

  // Easing
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  // Normaliza ángulos
  const normalizeAngle = (angle) =>
    ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  // Calcula el ángulo final para que el sector ganador quede bajo el puntero
  const calculateFinalAngle = (currentAngle, winningIndex) => {
    const numOptions = opciones.length;
    const arcSize = (2 * Math.PI) / numOptions;
    // Centro del sector ganador
    const sectorCenter = winningIndex * arcSize + arcSize / 2;
    const normalizedCurrent = normalizeAngle(currentAngle);
    let delta = normalizeAngle(angleOffset - sectorCenter - normalizedCurrent);
    // Vueltas extras para el efecto de giro
    const extraSpins = 5 * 2 * Math.PI;
    return currentAngle + extraSpins + delta;
  };

  // Copiar código al portapapeles
  const copiarCodigoAlPortapapeles = () => {
    if (codigoRef.current) {
      navigator.clipboard
        .writeText(codigoRef.current)
        .then(() => {
          setCodigoCopiad(true);
          setTimeout(() => {
            setCodigoCopiad(false);
          }, 2000);
        })
        .catch((err) => {
          console.error("Error al copiar el código: ", err);
        });
    }
  };

  // ---------------------------
  // Funciones de dibujo
  // ---------------------------
  const drawWheel = (ctx, options, currentAngle) => {
    const numOptions = options.length;
    const arcSize = (2 * Math.PI) / numOptions;
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Limpiar y dibujar fondo
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Fondo con gradiente radial
    const bgGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius + 30
    );
    bgGradient.addColorStop(0, "#0f172a"); // slate-900
    bgGradient.addColorStop(1, "#020617"); // slate-950
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Resplandor exterior
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    const glowGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      radius - 5,
      centerX,
      centerY,
      radius + 15
    );
    glowGradient.addColorStop(0, "rgba(37, 99, 235, 0)");
    glowGradient.addColorStop(0.8, "rgba(37, 99, 235, 0.1)");
    glowGradient.addColorStop(1, "rgba(37, 99, 235, 0.2)");
    ctx.fillStyle = glowGradient;
    ctx.fill();

    // Borde exterior metálico
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    const outerEdgeGradient = ctx.createLinearGradient(
      centerX - radius,
      centerY - radius,
      centerX + radius,
      centerY + radius
    );
    outerEdgeGradient.addColorStop(0, chromeLight);
    outerEdgeGradient.addColorStop(0.3, metalMid);
    outerEdgeGradient.addColorStop(0.5, metalLight);
    outerEdgeGradient.addColorStop(0.7, metalMid);
    outerEdgeGradient.addColorStop(1, chromeDark);
    ctx.strokeStyle = outerEdgeGradient;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Sombra 3D
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.filter = "blur(8px)";
    ctx.fill();
    ctx.filter = "none";

    // Paleta de colores para sectores
    const colors = [
      { main: "#2563eb", light: "#60a5fa", shadow: "#1d4ed8" }, // Blue
      { main: "#1e40af", light: "#3b82f6", shadow: "#1e3a8a" }, // Blue
    ];

    // Dibujar cada sector
    for (let i = 0; i < numOptions; i++) {
      const angle = currentAngle + i * arcSize;
      const nextAngle = angle + arcSize;
      const colorSet = colors[i % colors.length];

      // Sector con gradiente metálico
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 2, angle, nextAngle);

      const midAngle = angle + arcSize / 2;
      const lightX = centerX + Math.cos(midAngle) * (radius * 0.5);
      const lightY = centerY + Math.sin(midAngle) * (radius * 0.5);

      const metalGradient = ctx.createRadialGradient(
        lightX,
        lightY,
        0,
        lightX,
        lightY,
        radius * 0.8
      );
      metalGradient.addColorStop(0, colorSet.light);
      metalGradient.addColorStop(0.7, colorSet.main);
      metalGradient.addColorStop(1, colorSet.shadow);

      ctx.fillStyle = metalGradient;
      ctx.fill();

      // Líneas divisorias
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * (radius - 2),
        centerY + Math.sin(angle) * (radius - 2)
      );
      const lineGradient = ctx.createLinearGradient(
        centerX,
        centerY,
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      lineGradient.addColorStop(0, "rgba(15, 23, 42, 0.9)");
      lineGradient.addColorStop(0.5, "rgba(148, 163, 184, 0.7)");
      lineGradient.addColorStop(1, "rgba(15, 23, 42, 0.9)");
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Texto del sector
      const textRadius = radius * 0.65;
      const textAngle = angle + arcSize / 2;
      const textX = centerX + Math.cos(textAngle) * textRadius;
      const textY = centerY + Math.sin(textAngle) * textRadius;

      ctx.save();
      ctx.translate(textX, textY);

      // Rotar texto si está "al revés"
      let textRotation = textAngle;
      if (textAngle > Math.PI / 2 && textAngle < (Math.PI * 3) / 2) {
        textRotation += Math.PI;
      }
      ctx.rotate(textRotation);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const maxTextWidth = Math.min(radius * 0.75 * Math.sin(arcSize / 2) * 2, 100);
      const fontSize = 12;
      ctx.font = `bold ${fontSize}px 'Arial', sans-serif`;
      const text = options[i].name;

      // Lógica para partir texto si es largo
      if (text.length > 5) {
        const lines = [];
        if (text.includes(" ")) {
          // Dividir por palabras
          const words = text.split(" ");
          let currentLine = "";
          for (let n = 0; n < words.length; n++) {
            const word = words[n];
            const testLine = currentLine + (currentLine ? " " : "") + word;
            if (ctx.measureText(testLine).width <= maxTextWidth) {
              currentLine = testLine;
            } else {
              if (currentLine !== "") {
                lines.push(currentLine);
                currentLine = word;
              } else {
                // Dividir palabra por caracteres
                const chars = word.split("");
                let partWord = "";
                for (let c = 0; c < chars.length; c++) {
                  const testPartWord = partWord + chars[c];
                  if (ctx.measureText(testPartWord).width <= maxTextWidth) {
                    partWord = testPartWord;
                  } else {
                    lines.push(partWord);
                    partWord = chars[c];
                  }
                }
                if (partWord) currentLine = partWord;
              }
            }
          }
          if (currentLine) lines.push(currentLine);
        } else {
          // Dividir texto sin espacios
          let currentLine = "";
          const chars = text.split("");
          for (let c = 0; c < chars.length; c++) {
            const testLine = currentLine + chars[c];
            if (ctx.measureText(testLine).width <= maxTextWidth) {
              currentLine = testLine;
            } else {
              lines.push(currentLine);
              currentLine = chars[c];
            }
          }
          if (currentLine) lines.push(currentLine);
        }
        // Limitar a 4 líneas
        const maxLines = 4;
        const usedLines = lines.slice(0, maxLines);
        if (lines.length > maxLines) {
          const lastLine = usedLines[maxLines - 1];
          if (ctx.measureText(lastLine + "...").width <= maxTextWidth) {
            usedLines[maxLines - 1] = lastLine + "...";
          } else {
            let shortenedLine = lastLine;
            while (
              shortenedLine.length > 0 &&
              ctx.measureText(shortenedLine + "...").width > maxTextWidth
            ) {
              shortenedLine = shortenedLine.slice(0, -1);
            }
            if (shortenedLine.length > 0) {
              usedLines[maxLines - 1] = shortenedLine + "...";
            }
          }
        }
        // Dibujar las líneas
        const lineSpacing = fontSize * 1.2;
        const totalHeight = (usedLines.length - 1) * lineSpacing;
        const startY = -totalHeight / 2;
        for (let i = 0; i < usedLines.length; i++) {
          ctx.fillStyle = "#ffffff";
          ctx.fillText(usedLines[i], 0, startY + i * lineSpacing);
        }
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillText(text, 0, 0);
      }

      ctx.restore();
    }

    // Centro de la ruleta
    const centerRadius = radius * 0.2;

    // Sombra del centro
    ctx.beginPath();
    ctx.arc(centerX + 2, centerY + 2, centerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.filter = "blur(4px)";
    ctx.fill();
    ctx.filter = "none";

    // Imagen central, si existe
    if (centerImageLoaded && centerImageRef.current) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
      const imgBgGradient = ctx.createLinearGradient(
        centerX - centerRadius,
        centerY - centerRadius,
        centerX + centerRadius,
        centerY + centerRadius
      );
      imgBgGradient.addColorStop(0, "#0f172a");
      imgBgGradient.addColorStop(0.5, "#1e293b");
      imgBgGradient.addColorStop(1, "#0f172a");
      ctx.fillStyle = imgBgGradient;
      ctx.fill();

      // Dibujar imagen
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.clip();

      const imgSize = centerRadius * 2;
      ctx.drawImage(
        centerImageRef.current,
        centerX - imgSize / 2,
        centerY - imgSize / 2,
        imgSize,
        imgSize
      );
      ctx.restore();

      // Borde metálico
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
      const imgBorderGradient = ctx.createLinearGradient(
        centerX - centerRadius,
        centerY - centerRadius,
        centerX + centerRadius,
        centerY + centerRadius
      );
      imgBorderGradient.addColorStop(0, metalMid);
      imgBorderGradient.addColorStop(0.5, metalLight);
      imgBorderGradient.addColorStop(1, metalDark);
      ctx.strokeStyle = imgBorderGradient;
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      // Centro metálico sin imagen
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
      const centerMetalGradient = ctx.createLinearGradient(
        centerX - centerRadius,
        centerY - centerRadius,
        centerX + centerRadius,
        centerY + centerRadius
      );
      centerMetalGradient.addColorStop(0, metalDark);
      centerMetalGradient.addColorStop(0.3, metalMid);
      centerMetalGradient.addColorStop(0.5, metalLight);
      centerMetalGradient.addColorStop(0.7, metalMid);
      centerMetalGradient.addColorStop(1, metalDark);
      ctx.fillStyle = centerMetalGradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
      const centerBorderGradient = ctx.createLinearGradient(
        centerX - centerRadius,
        centerY - centerRadius,
        centerX + centerRadius,
        centerY + centerRadius
      );
      centerBorderGradient.addColorStop(0, metalLight);
      centerBorderGradient.addColorStop(0.5, metalDark);
      centerBorderGradient.addColorStop(1, metalMid);
      ctx.strokeStyle = centerBorderGradient;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  // Partículas durante el giro
  const addParticleEffects = (ctx, canvas, progress) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const particleCount = Math.ceil((1 - progress) * 3);

    for (let i = 0; i < particleCount; i++) {
      const randomAngle = Math.random() * 2 * Math.PI;
      const randomRadius = radius * 0.5 + Math.random() * (radius * 0.5);
      const particleSize = 1 + Math.random() * 2;
      const offsetX = Math.cos(randomAngle - 0.2) * (4 * (1 - progress));
      const offsetY = Math.sin(randomAngle - 0.2) * (4 * (1 - progress));

      ctx.beginPath();
      ctx.arc(
        centerX + Math.cos(randomAngle) * randomRadius + offsetX,
        centerY + Math.sin(randomAngle) * randomRadius + offsetY,
        particleSize,
        0,
        2 * Math.PI
      );
      const particleAlpha = 0.6 + Math.random() * 0.4;
      ctx.fillStyle =
        Math.random() > 0.5
          ? `rgba(59, 130, 246, ${particleAlpha})`
          : `rgba(37, 99, 235, ${particleAlpha})`;
      ctx.fill();
    }
  };

  // Resaltar el sector ganador
  const highlightWinningSection = (ctx, canvas, winningIndex) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const numOptions = opciones.length;
    const arcSize = (2 * Math.PI) / numOptions;
    const winAngle = currentAngleRef.current + winningIndex * arcSize;
    const midWinAngle = winAngle + arcSize / 2;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius - 2, winAngle, winAngle + arcSize);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fillStyle = "rgba(37, 99, 235, 0.1)";
    ctx.fill();

    // Partículas en el sector ganador
    for (let i = 0; i < 4; i++) {
      const particleAngle = midWinAngle + (Math.random() - 0.5) * arcSize * 0.7;
      const particleRadius = radius * 0.4 + Math.random() * (radius * 0.5);
      const particleSize = Math.random() * 2 + 1.5;

      ctx.beginPath();
      ctx.arc(
        centerX + Math.cos(particleAngle) * particleRadius,
        centerY + Math.sin(particleAngle) * particleRadius,
        particleSize,
        0,
        Math.PI * 2
      );
      ctx.fillStyle =
        Math.random() > 0.5
          ? "rgba(59, 130, 246, 0.8)"
          : "rgba(37, 99, 235, 0.8)";
      ctx.fill();
    }
  };

  // Efecto de celebración
  const celebrationEffect = (count) => {
    if (count <= 0) {
      setIsSpinning(false);
      setSelectedOption(opciones[winningIndexRef.current]);
      setHasSpun(true);
      celebrationRef.current = null;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle =
      count % 2 === 0
        ? "rgba(59, 130, 246, 0.12)"
        : "rgba(37, 99, 235, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Efecto "respiración"
    const breathScale = 1 + Math.sin(count * 0.4) * 0.004;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(breathScale, breathScale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Redibujar la rueda
    drawWheel(ctx, opciones, currentAngleRef.current);
    ctx.restore();

    // Parpadeo en el sector ganador
    if (count % 2 === 0) {
      highlightWinningSection(ctx, canvas, winningIndexRef.current);
    }

    celebrationRef.current = requestAnimationFrame(() =>
      celebrationEffect(count - 1)
    );
  };

  // Limpieza de animaciones
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (celebrationRef.current) {
        cancelAnimationFrame(celebrationRef.current);
      }
    };
  }, []);

  // Función para girar la ruleta
  const spinWheel = async () => {
    if (isSpinning || hasSpun) return;
    setIsSpinning(true);
    setSelectedOption(null);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (celebrationRef.current) {
      cancelAnimationFrame(celebrationRef.current);
      celebrationRef.current = null;
    }

    try {
      // Llamada a tu endpoint (ajusta la URL y el body según tu necesidad)
      const response = await fetch(
        "https://n8n.zevenglobalfunding.com/webhook/roullete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          },
          body: JSON.stringify({
            documentId: documentId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Error en la respuesta del servidor: ${response.status} ${response.statusText}`
        );
      }
      const text = await response.text();
      if (!text || text.trim() === "") {
        throw new Error("La respuesta del servidor está vacía");
      }
      const winningOption = JSON.parse(text);

      // Verificar error de ticket usado
      if (winningOption.error && winningOption.error === "ticket usado") {
        setTicketError("Este ticket ya ha sido utilizado");
        setIsSpinning(false);
        setHasSpun(true);
        return;
      }

      const winningIndex = winningOption.indice;
      if (winningIndex < 0 || winningIndex >= opciones.length) {
        throw new Error("El índice ganador está fuera de rango");
      }
      winningIndexRef.current = winningIndex;
      codigoRef.current = winningOption.cupon;

      // Animación de giro
      const initialAngle = startAngle;
      currentAngleRef.current = initialAngle;
      const finalAngle = calculateFinalAngle(initialAngle, winningIndex);
      const duration = 3000;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        const currentAngle =
          initialAngle + easedProgress * (finalAngle - initialAngle);

        setStartAngle(currentAngle);
        currentAngleRef.current = currentAngle;

        const canvas = canvasRef.current;
        if (!canvas) {
          animationRef.current = null;
          return;
        }
        const ctx = canvas.getContext("2d");

        ctx.save();
        // Pequeña inclinación
        if (progress < 0.85) {
          const tiltIntensity = 0.015 * (1 - progress / 0.85);
          const tiltX = Math.cos(elapsed * 0.003) * tiltIntensity;
          const tiltY = Math.sin(elapsed * 0.003) * tiltIntensity;
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.transform(1 + tiltX, tiltY, -tiltY, 1 + tiltX, 0, 0);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }
        drawWheel(ctx, opciones, currentAngle);
        ctx.restore();

        if (progress < 1) {
          // Partículas
          if (progress < 0.9 && Math.random() > 0.7) {
            addParticleEffects(ctx, canvas, progress);
          }
          animationRef.current = requestAnimationFrame(animate);
        } else {
          currentAngleRef.current = finalAngle;
          setStartAngle(finalAngle);

          setTimeout(() => {
            celebrationRef.current = requestAnimationFrame(() =>
              celebrationEffect(10)
            );
          }, 100);

          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    } catch (err) {
      console.error("Error detallado:", err);
      setIsSpinning(false);

      if (err.message && err.message.includes("ticket usado")) {
        setTicketError("Este ticket ya ha sido utilizado");
      } else if (err.message && err.message.includes("vacía")) {
        setTicketError("Error: La respuesta del servidor está vacía");
      } else if (err.message && err.message.includes("JSON")) {
        setTicketError("Error: Respuesta del servidor inválida");
      } else {
        setTicketError("Ha ocurrido un error al procesar tu solicitud");
      }
      setHasSpun(true);

      animationRef.current = null;
      celebrationRef.current = null;
    }
  };

  // Carga de la imagen central
  useEffect(() => {
    if (centerImage) {
      const img = new Image();
      img.onload = () => {
        centerImageRef.current = img;
        setCenterImageLoaded(true);
      };
      img.onerror = () => {
        console.error("Error al cargar la imagen central");
        setCenterImageLoaded(false);
      };
      img.src = centerImage;
    } else {
      setCenterImageLoaded(false);
      centerImageRef.current = null;
    }
  }, [centerImage]);

  // Dibuja la ruleta inicialmente
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      drawWheel(ctx, opciones, startAngle);
    }
  }, [opciones, startAngle, width, height, centerImageLoaded]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "#000",
        padding: "20px",
        borderRadius: "8px",
        maxWidth: "500px",
        width: "100%",
        margin: "auto",
      }}
    >
      {loading && <p style={{ color: "#93c5fd" }}>Cargando...</p>}
      {error && <p style={{ color: "#ef4444" }}>Error al cargar datos</p>}
      {opciones.length === 0 ? (
        <p style={{ color: "#93c5fd" }}>No hay opciones disponibles</p>
      ) : (
        <>
          <div
            style={{
              position: "relative",
              width,
              height,
              marginBottom: "80px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                position: "relative",
                zIndex: 1,
                border: "3px solid #2563eb",
                borderRadius: "50%",
                boxShadow: `
                  0 0 15px rgba(37, 99, 235, 0.7), 
                  0 0 30px rgba(59, 130, 246, 0.4), 
                  inset 0 0 10px rgba(59, 130, 246, 0.3),
                  0 10px 20px rgba(0, 0, 0, 0.8)
                `,
                transition: "all 0.3s ease",
                transform: isSpinning ? "scale(1.03)" : "scale(1)",
              }}
            />

            {/* Flecha animada */}
            <motion.div
              style={{
                position: "absolute",
                bottom: "-60px",
                left: "40%",
                transform: "translateX(-50%)",
                zIndex: 10,
                width: "40px",
                height: "40px",
              }}
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "loop",
              }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40">
                <defs>
                  <linearGradient
                    id="arrowGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#00BFFF" />
                    <stop offset="100%" stopColor="#0000CD" />
                  </linearGradient>
                  <filter
                    id="blueGlow"
                    x="-30%"
                    y="-30%"
                    width="160%"
                    height="160%"
                  >
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="innerGlow">
                    <feFlood floodColor="#4DA6FF" result="color" />
                    <feComposite
                      in="color"
                      in2="SourceAlpha"
                      operator="in"
                      result="inner-glow"
                    />
                    <feGaussianBlur in="inner-glow" stdDeviation="1" />
                    <feComposite
                      in="SourceGraphic"
                      in2="inner-glow"
                      operator="over"
                    />
                  </filter>
                </defs>
                <path
                  d="M20,5 C13,15 5,20 5,30 L20,25 L35,30 C35,20 27,15 20,5 Z"
                  fill="none"
                  stroke="#4DA6FF"
                  strokeWidth="0.8"
                  filter="url(#blueGlow)"
                />
                <path
                  d="M20,5 C13,15 5,20 5,30 L20,25 L35,30 C35,20 27,15 20,5 Z"
                  fill="url(#arrowGradient)"
                  filter="url(#innerGlow)"
                />
                <ellipse
                  cx="20"
                  cy="20"
                  rx="3"
                  ry="2"
                  fill="#FFFFFF"
                  opacity="0.4"
                />
              </svg>
            </motion.div>
          </div>

          {/* Mensaje de ticketError */}
          {ticketError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                fontSize: "18px",
                marginBottom: "10px",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                padding: "15px",
                borderRadius: "8px",
                border: "1px solid rgba(239, 68, 68, 0.5)",
                color: "#ef4444",
                fontWeight: "bold",
                textAlign: "center",
                width: "90%",
                boxShadow: "0 0 15px rgba(239, 68, 68, 0.2)",
              }}
            >
              ⚠️ {ticketError}
            </motion.div>
          )}

          {/* Botón de girar (si no se ha girado todavía) */}
          {!hasSpun && (
            <div className="flex justify-center gap-4 items-center">
              <motion.button
                onClick={spinWheel}
                disabled={isSpinning}
                className="w-full"
                whileHover={!isSpinning ? { scale: 1.05 } : {}}
                whileTap={!isSpinning ? { scale: 0.95 } : {}}
                style={{
                  marginTop: "0px",
                  padding: "14px 40px",
                  background: isSpinning
                    ? "linear-gradient(45deg, #334155 0%, #1e293b 100%)"
                    : "linear-gradient(45deg, #2563eb 0%, #3b82f6 100%)",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "30px",
                  cursor: isSpinning ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: isSpinning
                    ? "0 4px 8px rgba(0, 0, 0, 0.3)"
                    : "0 4px 15px rgba(37, 99, 235, 0.5), 0 0 10px rgba(59, 130, 246, 0.3)",
                }}
              >
                {isSpinning ? "GIRANDO..." : "GIRAR"}
              </motion.button>
            </div>
          )}
        </>
      )}

      {/* 
        ----------------------------
        POPUP / OVERLAY para mostrar el premio
        ----------------------------
      */}
      {selectedOption && !isSpinning && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              background: "#111827",
              borderRadius: "12px",
              padding: "20px",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              boxShadow: "0 8px 16px rgba(0, 0, 0, 0.5)",
              maxWidth: "300px",
              width: "90%",
              textAlign: "center",
              position: "relative",
            }}
          >
            {/* Botón "Salir" o "Cerrar" */}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                ✕
              </button>
            )}

            {/* Mensaje de premio */}
            <h2
              style={{
                color: "#93c5fd",
                fontSize: "20px",
                marginBottom: "12px",
                fontWeight: "bold",
              }}
            >
              {/* Verificamos si el nombre es un valor numérico con o sin "%" */}
              {/^\d+%?$/.test(selectedOption.name) ? (
                <>
                  ¡Ganaste un descuento de{" "}
                  {selectedOption.name.endsWith("%")
                    ? selectedOption.name
                    : `${selectedOption.name}%`}
                  !
                </>
              ) : (
                // Si no es solo número, puedes ajustar este texto a tu gusto
                <>
                  ¡Ganaste un descuento especial en {selectedOption.name}!
                </>
              )}
            </h2>

            {/* Mostrar el código del cupón */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.9)",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid rgba(59, 130, 246, 0.3)",
              }}
            >
              <p
                style={{
                  color: "#60a5fa",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                Código:
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span style={{ color: "#fff", fontFamily: "monospace", fontSize: "20px" }}>
                  {codigoRef.current}
                </span>

                <motion.button
                  onClick={copiarCodigoAlPortapapeles}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {codigoCopiad ? (
                    <CheckIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ClipboardDocumentIcon
                      className="h-5 w-5"
                      style={{ color: "#93c5fd" }}
                    />
                  )}
                </motion.button>
              </div>

              {codigoCopiad && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ fontSize: "12px", color: "#22c55e", marginTop: "6px" }}
                >
                  ¡Código copiado!
                </motion.div>
              )}
            </div>

            {/* Botón de "OK" o "Cerrar" si no usas onClose */}
            {!onClose && (
              <motion.button
                onClick={() => setSelectedOption(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  marginTop: "20px",
                  padding: "10px 20px",
                  background: "linear-gradient(45deg, #2563eb 0%, #3b82f6 100%)",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "30px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow:
                    "0 4px 15px rgba(37, 99, 235, 0.5), 0 0 10px rgba(59, 130, 246, 0.3)",
                }}
              >
                Cerrar
              </motion.button>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
