"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useStrapiData } from "src/services/strapiService";
import { useSession } from "next-auth/react";

export default function RuletaSorteo({
  customOptions,
  width = 300,
  height = 300,
}) {
  // Hooks y estados
  const { data: session } = useSession();
  const { data, error, loading } = useStrapiData(
    "provisional-products?populate=*"
  );
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [startAngle, setStartAngle] = useState(0);
  const canvasRef = useRef(null);
  const [intento, setIntento] = useState("");

  // Refs para controlar la animación
  const animationRef = useRef(null);
  const celebrationRef = useRef(null);
  const currentAngleRef = useRef(startAngle);
  const winningIndexRef = useRef(null);

  // Opciones: si vienen personalizadas, se usan; de lo contrario se obtienen del endpoint
  let opciones = [];
  if (customOptions?.length > 0) {
    opciones = customOptions;
  } else if (data) {
    opciones = data.map((item) => ({
      name: item.precio,
      documentId: item.documentId,
    }));
  }

  // Constante: El puntero se asume a 0 rad (derecha)
  const angleOffset = 0;

  // ---------------------------
  // Funciones de CÁLCULO y EASING
  // ---------------------------
  // Función de easing (easeOutCubic) para una transición suave
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
    // Se busca que: normalize(finalAngle + sectorCenter) = 0 => finalAngle = -sectorCenter (mod 2π)
    let delta = normalizeAngle(-sectorCenter - normalizedCurrent);
    // Añadimos vueltas extras para efecto visual (por ejemplo, 5 vueltas completas)
    const extraSpins = 5 * 2 * Math.PI;
    return currentAngle + extraSpins + delta;
  };

  // ---------------------------
  // Funciones DE DIBUJO
  // ---------------------------
  const drawWheel = (ctx, options, currentAngle) => {
    const numOptions = options.length;
    const arcSize = (2 * Math.PI) / numOptions;
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Limpiar y dibujar fondo con gradiente
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const bgGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius + 30
    );
    bgGradient.addColorStop(0, "#292929");
    bgGradient.addColorStop(1, "#111111");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Efectos de brillo y resplandor exterior
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 15, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255, 235, 59, 0.1)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255, 235, 59, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Paleta de colores en tonos amarillos
    const colors = [
      { main: "#F9A825", light: "#FFD54F", shadow: "#F57F17" },
      { main: "#FBC02D", light: "#FFEE58", shadow: "#F9A825" },
      { main: "#FFD54F", light: "#FFF59D", shadow: "#FBC02D" },
    ];

    // Sombra para efecto 3D (base)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.filter = "blur(8px)";
    ctx.fill();
    ctx.filter = "none";

    // Borde exterior con gradiente para efecto 3D
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    const outerEdge = ctx.createLinearGradient(
      centerX - radius,
      centerY - radius,
      centerX + radius,
      centerY + radius
    );
    outerEdge.addColorStop(0, "#F57F17");
    outerEdge.addColorStop(0.5, "#FFEB3B");
    outerEdge.addColorStop(1, "#F57F17");
    ctx.strokeStyle = outerEdge;
    ctx.lineWidth = 5;
    ctx.stroke();

    // Dibujar cada sector de la ruleta
    for (let i = 0; i < numOptions; i++) {
      const angle = angleOffset + currentAngle + i * arcSize;
      const nextAngle = angle + arcSize;
      const colorSet = colors[i % colors.length];

      // Dibuja el sector con gradiente 3D
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 2, angle, nextAngle);
      const midAngle = angle + arcSize / 2;
      const lightX = centerX + Math.cos(midAngle) * (radius * 0.5);
      const lightY = centerY + Math.sin(midAngle) * (radius * 0.5);
      const lightGradient = ctx.createRadialGradient(
        lightX,
        lightY,
        0,
        lightX,
        lightY,
        radius * 0.8
      );
      lightGradient.addColorStop(0, colorSet.light);
      lightGradient.addColorStop(0.6, colorSet.main);
      lightGradient.addColorStop(1, colorSet.shadow);
      ctx.fillStyle = lightGradient;
      ctx.fill();

      // Bordes y líneas divisorias para dar profundidad
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 2, angle, nextAngle);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

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
      lineGradient.addColorStop(0, "rgba(0, 0, 0, 0.2)");
      lineGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.6)");
      lineGradient.addColorStop(1, "rgba(0, 0, 0, 0.2)");
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Texto del sector
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#212121";
      ctx.font = "bold 18px 'Arial', sans-serif";
      ctx.fillText(options[i].name, radius * 0.85, 6);
      ctx.restore();
    }

    // Centro de la ruleta con efecto 3D
    const centerRadius = radius * 0.18;
    ctx.beginPath();
    ctx.arc(centerX + 2, centerY + 2, centerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.filter = "blur(3px)";
    ctx.fill();
    ctx.filter = "none";

    const centerGradient = ctx.createLinearGradient(
      centerX - centerRadius,
      centerY - centerRadius,
      centerX + centerRadius,
      centerY + centerRadius
    );
    centerGradient.addColorStop(0, "#FDD835");
    centerGradient.addColorStop(0.5, "#F9A825");
    centerGradient.addColorStop(1, "#F57F17");
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = centerGradient;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#5D4037";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(
      centerX - centerRadius * 0.3,
      centerY - centerRadius * 0.3,
      centerRadius * 0.5,
      0,
      2 * Math.PI
    );
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fill();
  };

  // Efectos de partículas durante el giro
  const addParticleEffects = (ctx, canvas, progress) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const particleCount = Math.ceil((1 - progress) * 4);
    for (let i = 0; i < particleCount; i++) {
      const randomAngle = Math.random() * 2 * Math.PI;
      const randomRadius = radius * 0.5 + Math.random() * (radius * 0.5);
      const particleSize = 1 + Math.random() * 3;
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
          ? `rgba(255, 215, 0, ${particleAlpha})`
          : `rgba(255, 235, 59, ${particleAlpha})`;
      ctx.fill();
    }
  };

  // Resalta el sector ganador con partículas
  const highlightWinningSection = (ctx, canvas, winningIndex) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const numOptions = opciones.length;
    const arcSize = (2 * Math.PI) / numOptions;
    const winAngle =
      angleOffset + currentAngleRef.current + winningIndex * arcSize;
    const midWinAngle = winAngle + arcSize / 2;
    for (let i = 0; i < 4; i++) {
      const particleAngle = midWinAngle + (Math.random() - 0.5) * arcSize * 0.7;
      const particleRadius = radius * 0.4 + Math.random() * (radius * 0.5);
      const particleSize = Math.random() * 3 + 2;
      ctx.beginPath();
      ctx.arc(
        centerX + Math.cos(particleAngle) * particleRadius,
        centerY + Math.sin(particleAngle) * particleRadius,
        particleSize,
        0,
        2 * Math.PI
      );
      ctx.fillStyle =
        Math.random() > 0.5
          ? "rgba(255, 215, 0, 0.8)"
          : "rgba(255, 235, 59, 0.8)";
      ctx.fill();
    }
  };

  // Efecto de celebración una vez finalizado el giro usando requestAnimationFrame
  const celebrationEffect = (count) => {
    if (count <= 0) {
      setIsSpinning(false);
      setSelectedOption(opciones[winningIndexRef.current]);
      celebrationRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle =
      count % 2 === 0 ? "rgba(255, 215, 0, 0.15)" : "rgba(255, 235, 59, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const breathScale = 1 + Math.sin(count * 0.4) * 0.005;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(breathScale, breathScale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Usamos el ángulo actual almacenado en el ref
    drawWheel(ctx, opciones, currentAngleRef.current);
    ctx.restore();

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
    if (isSpinning) return;
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
        "https://n8n.neocapitalfunding.com/webhook/webhook/ruleta",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          },
          body: JSON.stringify({
            usuario: session?.user?.email,
            documentId: intento,
          }),
        }
      );
      if (!response.ok) throw new Error("Error en la respuesta del servidor");
      const winningOption = await response.json();
      const winningIndex = winningOption.indice;
      console.log(winningOption);
      if (winningIndex < 0 || winningIndex >= opciones.length) {
        throw new Error("El índice ganador está fuera de rango");
      }

      // Guardamos el índice ganador en el ref para usarlo en la celebración
      winningIndexRef.current = winningIndex;

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
          if (progress < 0.9 && Math.random() > 0.7) {
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

      // Limpiar referencias de animación en caso de error
      animationRef.current = null;
      celebrationRef.current = null;
    }
  };

  // ---------------------------
  // Función para simular "perder"
  // ---------------------------
  const handlePerder = async () => {
    try {
      const ticket = await fetch(
        "https://n8n.neocapitalfunding.com/webhook/user/lose",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          },
          body: JSON.stringify({
            usuario: session?.user?.email,
          }),
        }
      );
      if (!ticket.ok) throw new Error("Error en la respuesta del servidor");
      const responseData = await ticket.json();
      console.log(responseData);
      setIntento(responseData.data.documentId);
    } catch (error) {
      console.error("Error al manejar la respuesta:", error);
    }
  };

  // Dibuja la ruleta en el montaje y cuando cambian opciones o ángulo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      drawWheel(ctx, opciones, startAngle);
    }
  }, [opciones, startAngle, width, height]);

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
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.8)",
        maxWidth: "400px",
        margin: "auto",
      }}
    >
      {loading && <p style={{ color: "#fff" }}>Cargando...</p>}
      {error && <p style={{ color: "#fff" }}>Error al cargar datos</p>}
      {opciones.length === 0 ? (
        <p style={{ color: "#fff" }}>No hay opciones disponibles</p>
      ) : (
        <>
          <div style={{ position: "relative", width, height }}>
            <canvas
              ref={canvasRef}
              style={{
                border: "10px solid #F57F17",
                borderRadius: "50%",
                boxShadow:
                  "0 0 20px rgba(255, 215, 0, 0.7), 0 0 40px rgba(255, 235, 59, 0.4), inset 0 0 15px rgba(255, 235, 59, 0.3)",
                transition: "box-shadow 0.3s ease, transform 0.3s ease",
                transform: isSpinning ? "scale(1.03)" : "scale(1)",
              }}
            />
            <motion.div
              initial={{ x: 10 }}
              animate={{
                x: [10, 0, 10],
                filter: isSpinning
                  ? [
                      "drop-shadow(0 0 5px #FFEB3B)",
                      "drop-shadow(0 0 15px #FFEB3B)",
                      "drop-shadow(0 0 5px #FFEB3B)",
                    ]
                  : "drop-shadow(0 0 8px #FFEB3B)",
              }}
              transition={{
                repeat: Infinity,
                duration: isSpinning ? 0.3 : 1.5,
                ease: "easeInOut",
              }}
              style={{
                position: "absolute",
                top: "50%",
                left: "95%",
                transform: "translate(50%, -50%)",
                rotate: "180deg",
                width: 0,
                height: 0,
                borderTop: "20px solid transparent",
                borderBottom: "20px solid transparent",
                borderLeft: "30px solid #FFD600",
                zIndex: 10,
                backgroundImage:
                  "linear-gradient(135deg, #FFD600 0%, #FFC107 100%)",
              }}
            />
          </div>
          <div className="flex justify-center gap-4 items-center">
            <button
              style={{
                marginTop: "20px",
                padding: "12px 30px",
                background: "#FFEB3B",
                color: "#000",
                fontSize: "16px",
                fontWeight: "bold",
                border: "none",
                borderRadius: "30px",
                cursor: "pointer",
                transition: "background 0.3s, transform 0.3s",
                boxShadow: "0 4px 8px rgba(255,235,59,0.6)",
              }}
              onClick={handlePerder}
            >
              perder
            </button>
            <motion.button
              onClick={spinWheel}
              disabled={isSpinning}
              whileHover={!isSpinning ? { scale: 1.05 } : {}}
              whileTap={!isSpinning ? { scale: 0.95 } : {}}
              style={{
                marginTop: "20px",
                padding: "12px 30px",
                background: isSpinning ? "#777" : "#FFEB3B",
                color: "#000",
                fontSize: "16px",
                fontWeight: "bold",
                border: "none",
                borderRadius: "30px",
                cursor: isSpinning ? "not-allowed" : "pointer",
                transition: "background 0.3s, transform 0.3s",
                boxShadow: "0 4px 8px rgba(255,235,59,0.6)",
              }}
            >
              {isSpinning ? "Girando..." : "Girar"}
            </motion.button>
          </div>
          {selectedOption && !isSpinning && (
            <p
              style={{
                fontSize: "20px",
                marginTop: "25px",
                color: "#FFEB3B",
                fontWeight: "bold",
              }}
            >
              Resultado: {selectedOption.name}
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}
