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
  centerImage = null, // Prop para la imagen central
  documentId,
  onClose, // Added onClose prop for the Exit button
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

  // Variables de colores usando theme colors - Paleta metálica
  const primaryColor = "var(--app-primary)";       // Base color
  const secondaryColor = "var(--app-secondary)";   // Secondary color
  const metalLight = "#93c5fd";                    // Light metallic highlight (blue-300)
  const metalMid = "#3b82f6";                      // Mid metallic blue (blue-500)
  const metalDark = "#1e40af";                     // Dark metallic blue (blue-800)
  const chromeDark = "#0f172a";                    // Dark chrome (slate-900)
  const chromeLight = "#94a3b8";                   // Light chrome (slate-400)

  // Opciones: si vienen personalizadas, se usan; de lo contrario se obtienen del endpoint
  let opciones = [];
  if (customOptions?.length > 0) {
    opciones = customOptions;
  } else if (data) {
    opciones = data.map((item) => ({
      name: String(item.nombre),
      documentId: item.documentId,
    }));
  }

  // Constante: El puntero ahora está en la parte inferior (π/2 rad o 90 grados)
  const angleOffset = Math.PI / 2;

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  // Normaliza un ángulo para que esté entre 0 y 2π
  const normalizeAngle = (angle) =>
    ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  // Calcula el ángulo final de forma que el sector ganador se alinee con el puntero
  const calculateFinalAngle = (currentAngle, winningIndex) => {
    const numOptions = opciones.length;
    const arcSize = (2 * Math.PI) / numOptions;
    // Centro del sector ganador
    const sectorCenter = winningIndex * arcSize + arcSize / 2;
    const normalizedCurrent = normalizeAngle(currentAngle);
    let delta = normalizeAngle(angleOffset - sectorCenter - normalizedCurrent);
    // Añadimos vueltas extras para efecto visual (por ejemplo, 5 vueltas completas)
    const extraSpins = 5 * 2 * Math.PI;
    return currentAngle + extraSpins + delta;
  };

  const copiarCodigoAlPortapapeles = () => {
    if (codigoRef.current) {
      navigator.clipboard
        .writeText(codigoRef.current)
        .then(() => {
          setCodigoCopiad(true);
          // Reinicia el estado después de 2 segundos
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
  // Funciones DE DIBUJO con estilo metálico profesional
  // ---------------------------
  const drawWheel = (ctx, options, currentAngle) => {
    const numOptions = options.length;
    const arcSize = (2 * Math.PI) / numOptions;
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Limpiar y dibujar fondo con gradiente más profesional
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

    // Resplandor exterior profesional
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    const glowGradient = ctx.createRadialGradient(
      centerX, centerY, radius - 5,
      centerX, centerY, radius + 15
    );
    glowGradient.addColorStop(0, "rgba(37, 99, 235, 0)");
    glowGradient.addColorStop(0.8, "rgba(37, 99, 235, 0.1)");
    glowGradient.addColorStop(1, "rgba(37, 99, 235, 0.2)");
    ctx.fillStyle = glowGradient;
    ctx.fill();

    // Borde exterior metálico con efecto cromo
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

    // Sombra para efecto 3D metálico
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.filter = "blur(8px)";
    ctx.fill();
    ctx.filter = "none";

    // Paleta de colores metálicos
    const colors = [
      { main: "#2563eb", light: "#60a5fa", shadow: "#1d4ed8" }, // Blue-600, Blue-400, Blue-700
      { main: "#1e40af", light: "#3b82f6", shadow: "#1e3a8a" }, // Blue-800, Blue-500, Blue-900
    ];

    // Dibujar cada sector de la ruleta con estilo metálico
    for (let i = 0; i < numOptions; i++) {
      const angle = currentAngle + i * arcSize;
      const nextAngle = angle + arcSize;
      const colorSet = colors[i % colors.length];

      // Dibuja el sector con gradiente metálico
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 2, angle, nextAngle);

      // Gradiente metálico más profesional y menos cartoon
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

      // Gradiente metálico suave
      metalGradient.addColorStop(0, colorSet.light);
      metalGradient.addColorStop(0.7, colorSet.main);
      metalGradient.addColorStop(1, colorSet.shadow);

      ctx.fillStyle = metalGradient;
      ctx.fill();

      // Líneas divisorias con efecto metálico
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * (radius - 2),
        centerY + Math.sin(angle) * (radius - 2)
      );

      // Gradiente para líneas divisorias con efecto metálico
      const lineGradient = ctx.createLinearGradient(
        centerX,
        centerY,
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      lineGradient.addColorStop(0, "rgba(15, 23, 42, 0.9)"); // Oscuro
      lineGradient.addColorStop(0.5, "rgba(148, 163, 184, 0.7)"); // Claro
      lineGradient.addColorStop(1, "rgba(15, 23, 42, 0.9)"); // Oscuro

      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Texto del sector con estilo profesional
      const textRadius = radius * 0.65;
      const textAngle = angle + arcSize / 2;
      const textX = centerX + Math.cos(textAngle) * textRadius;
      const textY = centerY + Math.sin(textAngle) * textRadius;

      ctx.save();
      ctx.translate(textX, textY);

      // Determinar la rotación correcta para que el texto siempre esté derecho
      let textRotation = textAngle;
      if (textAngle > Math.PI / 2 && textAngle < (Math.PI * 3) / 2) {
        textRotation += Math.PI;
      }

      ctx.rotate(textRotation);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Texto en estilo profesional
      const maxTextWidth = Math.min(radius * 0.75 * Math.sin(arcSize / 2) * 2, 100);
      const fontSize = 12;
      ctx.font = `bold ${fontSize}px 'Arial', sans-serif`;

      const text = options[i].name;

      // Texto con estilo profesional y limpio
      if (text.length > 5) {
        const lines = [];

        if (text.includes(' ')) {
          // Código para dividir texto por palabras
          const words = text.split(' ');
          let currentLine = '';

          for (let n = 0; n < words.length; n++) {
            const word = words[n];
            const testLine = currentLine + (currentLine ? ' ' : '') + word;

            if (ctx.measureText(testLine).width <= maxTextWidth) {
              currentLine = testLine;
            } else {
              if (currentLine !== '') {
                lines.push(currentLine);
                currentLine = word;
              } else {
                const chars = word.split('');
                let partWord = '';

                for (let c = 0; c < chars.length; c++) {
                  const testPartWord = partWord + chars[c];
                  if (ctx.measureText(testPartWord).width <= maxTextWidth) {
                    partWord = testPartWord;
                  } else {
                    lines.push(partWord);
                    partWord = chars[c];
                  }
                }

                if (partWord) {
                  currentLine = partWord;
                }
              }
            }
          }

          if (currentLine) {
            lines.push(currentLine);
          }
        } else {
          // División por caracteres para texto sin espacios
          let currentLine = '';
          const chars = text.split('');

          for (let c = 0; c < chars.length; c++) {
            const testLine = currentLine + chars[c];

            if (ctx.measureText(testLine).width <= maxTextWidth) {
              currentLine = testLine;
            } else {
              lines.push(currentLine);
              currentLine = chars[c];
            }
          }

          if (currentLine) {
            lines.push(currentLine);
          }
        }

        // Limitar a un máximo de líneas
        const maxLines = 4;
        const usedLines = lines.slice(0, maxLines);

        if (lines.length > maxLines) {
          const lastLine = usedLines[maxLines - 1];
          if (ctx.measureText(lastLine + "...").width <= maxTextWidth) {
            usedLines[maxLines - 1] = lastLine + "...";
          } else {
            let shortenedLine = lastLine;
            while (shortenedLine.length > 0 &&
              ctx.measureText(shortenedLine + "...").width > maxTextWidth) {
              shortenedLine = shortenedLine.slice(0, -1);
            }

            if (shortenedLine.length > 0) {
              usedLines[maxLines - 1] = shortenedLine + "...";
            }
          }
        }

        // Dibujar texto con estilo profesional
        const lineSpacing = fontSize * 1.2;
        const totalHeight = (usedLines.length - 1) * lineSpacing;
        const startY = -totalHeight / 2;

        for (let i = 0; i < usedLines.length; i++) {
          ctx.fillStyle = "#ffffff"; // Texto blanco para mejor contraste
          ctx.fillText(
            usedLines[i],
            0,
            startY + i * lineSpacing
          );
        }
      } else {
        // Para texto corto
        ctx.fillStyle = "#ffffff";
        ctx.fillText(text, 0, 0);
      }

      ctx.restore();
    }

    // Centro de la ruleta con efecto metálico profesional
    const centerRadius = radius * 0.2;

    // Dibuja la sombra del centro para efecto 3D
    ctx.beginPath();
    ctx.arc(centerX + 2, centerY + 2, centerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.filter = "blur(4px)";
    ctx.fill();
    ctx.filter = "none";

    // Si hay una imagen cargada, la dibujamos con efectos metálicos
    if (centerImageLoaded && centerImageRef.current) {
      // Fondo para la imagen
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);

      // Gradiente metálico para el fondo de la imagen
      const imgBgGradient = ctx.createLinearGradient(
        centerX - centerRadius,
        centerY - centerRadius,
        centerX + centerRadius,
        centerY + centerRadius
      );
      imgBgGradient.addColorStop(0, "#0f172a"); // slate-900
      imgBgGradient.addColorStop(0.5, "#1e293b"); // slate-800
      imgBgGradient.addColorStop(1, "#0f172a"); // slate-900

      ctx.fillStyle = imgBgGradient;
      ctx.fill();

      // Dibuja la imagen en el centro
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.clip();

      // Calcula dimensiones para mantener la proporción de la imagen
      const imgSize = centerRadius * 2;
      ctx.drawImage(
        centerImageRef.current,
        centerX - imgSize / 2,
        centerY - imgSize / 2,
        imgSize,
        imgSize
      );

      ctx.restore();

      // Borde metálico para la imagen
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);

      // Gradiente metálico para el borde
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

      // Gradiente metálico para el centro
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

      // Borde del centro con efecto cromo
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

      // Efecto de luz reflejada en metal
      ctx.beginPath();
      ctx.arc(
        centerX - centerRadius * 0.3,
        centerY - centerRadius * 0.3,
        centerRadius * 0.4,
        0,
        2 * Math.PI
      );

      // Gradiente para simular reflejo de luz
      const reflectionGradient = ctx.createRadialGradient(
        centerX - centerRadius * 0.3,
        centerY - centerRadius * 0.3,
        0,
        centerX - centerRadius * 0.3,
        centerY - centerRadius * 0.3,
        centerRadius * 0.4
      );
      reflectionGradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
      reflectionGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = reflectionGradient;
      ctx.fill();
    }
  };

  // Efectos de partículas durante el giro - simplificados y menos cartoon
  const addParticleEffects = (ctx, canvas, progress) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const particleCount = Math.ceil((1 - progress) * 3); // Menos partículas

    for (let i = 0; i < particleCount; i++) {
      const randomAngle = Math.random() * 2 * Math.PI;
      const randomRadius = radius * 0.5 + Math.random() * (radius * 0.5);
      const particleSize = 1 + Math.random() * 2;
      const offsetX = Math.cos(randomAngle - 0.2) * (4 * (1 - progress));
      const offsetY = Math.sin(randomAngle - 0.2) * (4 * (1 - progress));

      // Partículas circulares elegantes
      ctx.beginPath();
      ctx.arc(
        centerX + Math.cos(randomAngle) * randomRadius + offsetX,
        centerY + Math.sin(randomAngle) * randomRadius + offsetY,
        particleSize,
        0,
        2 * Math.PI
      );

      const particleAlpha = 0.6 + Math.random() * 0.4;
      ctx.fillStyle = Math.random() > 0.5
        ? `rgba(59, 130, 246, ${particleAlpha})` // Blue-500
        : `rgba(37, 99, 235, ${particleAlpha})`; // Blue-600

      ctx.fill();
    }
  };

  // Resalta el sector ganador con partículas elegantes
  const highlightWinningSection = (ctx, canvas, winningIndex) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const numOptions = opciones.length;
    const arcSize = (2 * Math.PI) / numOptions;
    const winAngle = currentAngleRef.current + winningIndex * arcSize;
    const midWinAngle = winAngle + arcSize / 2;

    // Resplandor del sector ganador
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius - 2, winAngle, winAngle + arcSize);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();

    ctx.fillStyle = "rgba(37, 99, 235, 0.1)";
    ctx.fill();

    // Partículas elegantes en el sector ganador
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

      ctx.fillStyle = Math.random() > 0.5
        ? "rgba(59, 130, 246, 0.8)" // Blue-500
        : "rgba(37, 99, 235, 0.8)"; // Blue-600

      ctx.fill();
    }
  };

  // Efecto de celebración simplificado
  const celebrationEffect = (count) => {
    if (count <= 0) {
      setIsSpinning(false);
      setSelectedOption(opciones[winningIndexRef.current]);
      setHasSpun(true); // Set hasSpun to true when celebration is complete
      celebrationRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Flash de celebración
    ctx.fillStyle = count % 2 === 0
      ? "rgba(59, 130, 246, 0.12)"
      : "rgba(37, 99, 235, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Efecto de escala "respiración"
    const breathScale = 1 + Math.sin(count * 0.4) * 0.004;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(breathScale, breathScale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Dibujar la rueda
    drawWheel(ctx, opciones, currentAngleRef.current);
    ctx.restore();

    // Highlight ganador con pulsos
    if (count % 2 === 0) {
      highlightWinningSection(ctx, canvas, winningIndexRef.current);
    }

    celebrationRef.current = requestAnimationFrame(() =>
      celebrationEffect(count - 1)
    );
  };

  // Limpieza de animaciones cuando el componente se desmonta
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

  // ---------------------------
  // Función de ANIMACIÓN del giro
  // ---------------------------
  const spinWheel = async () => {
    if (isSpinning || hasSpun) return; // Check if wheel has already been spun successfully
    setIsSpinning(true);
    setSelectedOption(null);

    // Cancelar cualquier animación previa que esté en curso
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (celebrationRef.current) {
      cancelAnimationFrame(celebrationRef.current);
      celebrationRef.current = null;
    }

    try {
      // Solicita al backend el índice ganador
      const response = await fetch(
        "https://n8n.neocapitalfunding.com/webhook/roullete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          },
          body: JSON.stringify({
            // usuario: session?.user?.email,
            documentId: documentId,
          }),
        }
      );
      if (!response.ok) throw new Error("Error en la respuesta del servidor");
      const winningOption = await response.json();
      // console.log(winningOption);

      // Check if the response contains an error about used ticket
      if (winningOption.error && winningOption.error === "ticket usado") {
        setTicketError("Este ticket ya ha sido utilizado");
        setIsSpinning(false);
        setHasSpun(true); // Disable spin button
        return;
      }
      const winningIndex = winningOption.indice;

      if (winningIndex < 0 || winningIndex >= opciones.length) {
        throw new Error("El índice ganador está fuera de rango");
      }
      // Guardamos el índice ganador en el ref para usarlo en la celebración
      winningIndexRef.current = winningIndex;
      codigoRef.current = winningOption.cupon;

      // Precalcula el ángulo final para alinear el sector ganador
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

        // Actualizamos tanto el estado como el ref para mantener sincronizados
        setStartAngle(currentAngle);
        currentAngleRef.current = currentAngle;

        const canvas = canvasRef.current;
        if (!canvas) {
          animationRef.current = null;
          return;
        }

        const ctx = canvas.getContext("2d");

        ctx.save();
        // Efecto de inclinación opcional durante el giro
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
          // Añadir efectos de partículas durante el giro
          if (progress < 0.9 && Math.random() > 0.7) { // Menos frecuencia de partículas
            addParticleEffects(ctx, canvas, progress);
          }
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Aseguramos que el ángulo final sea exacto
          currentAngleRef.current = finalAngle;
          setStartAngle(finalAngle);

          // Pequeña pausa antes de iniciar la celebración
          setTimeout(() => {
            // Inicia la celebración con requestAnimationFrame
            celebrationRef.current = requestAnimationFrame(() =>
              celebrationEffect(10)
            );
          }, 100);

          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    } catch (err) {
      console.error(err);
      setIsSpinning(false);

      // Check if the error is related to the ticket being used
      if (err.message && err.message.includes("ticket usado")) {
        setTicketError("Este ticket ya ha sido utilizado");
        setHasSpun(true); // Disable spin button
      } else {
        setTicketError("Ha ocurrido un error al procesar tu solicitud");
      }

      // Limpiar referencias de animación en caso de error
      animationRef.current = null;
      celebrationRef.current = null;
    }
  };

  // Cargar la imagen central si se proporciona
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

  // Dibuja la ruleta en el montaje y cuando cambian opciones o ángulo
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
        background: "#000", // Fondo profesional
        padding: "25px",
        borderRadius: "8px",
        //boxShadow: "0 8px 16px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        maxWidth: "400px",
        width: "100%",
        margin: "auto",
        //border: "1px solid rgba(59, 130, 246, 0.3)",
      }}
    >
      {loading && (
        <p style={{ color: "#93c5fd" }}>Cargando...</p>
      )}
      {error && (
        <p style={{ color: "#ef4444" }}>Error al cargar datos</p>
      )}
      {opciones.length === 0 ? (
        <p style={{ color: "#93c5fd" }}>No hay opciones disponibles</p>
      ) : (
        <>
          <div
            style={{
              position: "relative",
              width,
              height,
              marginBottom: "80px", // Aumento de espacio entre ruleta y flecha
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Canvas de la ruleta */}
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

            {/* Nueva flecha brillante azul con animación suave */}
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
                repeatType: "loop"
              }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40">
                <defs>
                  <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00BFFF" />
                    <stop offset="100%" stopColor="#0000CD" />
                  </linearGradient>

                  <filter id="blueGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  <filter id="innerGlow">
                    <feFlood flood-color="#4DA6FF" result="color" />
                    <feComposite in="color" in2="SourceAlpha" operator="in" result="inner-glow" />
                    <feGaussianBlur in="inner-glow" stdDeviation="1" />
                    <feComposite in="SourceGraphic" in2="inner-glow" operator="over" />
                  </filter>
                </defs>

                {/* Resplandor externo */}
                <path
                  d="M20,5 C13,15 5,20 5,30 L20,25 L35,30 C35,20 27,15 20,5 Z"
                  fill="none"
                  stroke="#4DA6FF"
                  strokeWidth="0.8"
                  filter="url(#blueGlow)"
                />

                {/* Forma principal del boomerang */}
                <path
                  d="M20,5 C13,15 5,20 5,30 L20,25 L35,30 C35,20 27,15 20,5 Z"
                  fill="url(#arrowGradient)"
                  filter="url(#innerGlow)"
                />

                {/* Brillo en el centro */}
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

          {/* Resultado del giro mostrado debajo de la flecha */}
          {selectedOption && !isSpinning && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  fontSize: "20px",
                  marginTop: "30px", // Mayor espacio desde la flecha
                  marginBottom: "20px",
                  color: primaryColor,
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "100%",
                  background: "rgba(15, 23, 42, 0.7)",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                }}
              >
                {
                  // Verifica si selectedOption.name es un valor numérico (con o sin "%")
                  /^\d+%?$/.test(selectedOption.name) ? (
                    <p>
                      ¡Ganaste un descuento de:{" "}
                      {selectedOption.name.endsWith("%")
                        ? selectedOption.name
                        : `${selectedOption.name}%`}
                      !
                    </p>
                  ) : (
                    <p>
                      ¡Ganaste un descuento de {selectedOption.descuento}% en{" "}
                      {selectedOption.name}!
                    </p>
                  )
                }

                {/* Resto del contenido (por ejemplo, botón para copiar el código, etc.) */}
                <div className="flex items-center justify-center mt-4 w-full">
                  <div
                    className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 flex items-center shadow-lg"
                    style={{
                      background: "linear-gradient(45deg, #0f172a 0%, #1e293b 100%)",
                    }}
                  >
                    <span className="mr-2 text-blue-300">Código: </span>
                    <span className="font-mono text-white">{codigoRef.current}</span>
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
                        padding: "5px",
                        marginLeft: "8px",
                      }}
                    >
                      {codigoCopiad ? (
                        <CheckIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <ClipboardDocumentIcon
                          className="h-5 w-5"
                          style={{ color: primaryColor }}
                        />
                      )}
                    </motion.button>
                  </div>
                </div>

                {codigoCopiad && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-green-500 mt-2"
                  >
                    ¡Código copiado!
                  </motion.div>
                )}
              </motion.div>
            </>
          )}

          {/* Error message for used ticket */}
          {ticketError && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  fontSize: "18px",
                  //marginTop: "10px",
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
            </>
          )}

          {/* Only render the button if the wheel hasn't been spun yet */}
          {!hasSpun && (
            <div className="flex justify-center gap-4 items-center">
              <motion.button
                onClick={spinWheel}
                disabled={isSpinning}
                className="w-full"
                whileHover={!isSpinning ? { scale: 1.05 } : {}}
                whileTap={!isSpinning ? { scale: 0.95 } : {}}
                style={{
                  marginTop: "20px", // Mayor espaciado desde la flecha
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
    </motion.div>
  );
}