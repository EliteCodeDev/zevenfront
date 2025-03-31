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
  const { data: session } = useSession();
  const { data, error, loading } = useStrapiData(
    "provisional-products?populate=*"
  );

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [startAngle, setStartAngle] = useState(0);
  const canvasRef = useRef(null);
  const [intento, setIntento] = useState("");

  // Si no vienen opciones personalizadas, usar las del endpoint
  let opciones = [];
  if (customOptions?.length > 0) {
    opciones = customOptions;
  } else if (data) {
    opciones = data.map((item) => ({
      name: item.precio,
      documentId: item.documentId,
    }));
  }

  // Puntero a la derecha => 0 rad = derecha en el canvas
  const angleOffset = 0;

  // Dibuja la ruleta
  const drawWheel = (ctx, options, currentAngle) => {
    const numOptions = options.length;
    const arcSize = (2 * Math.PI) / numOptions;
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let i = 0; i < numOptions; i++) {
      // Cada sector se dibuja con base en currentAngle + i*arcSize
      const angle = angleOffset + currentAngle + i * arcSize;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arcSize, false);
      ctx.fillStyle = i % 2 === 0 ? "#F7DC6F" : "#F4D03F";
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Texto en cada sector
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#000";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(options[i].name, radius - 10, 8);
      ctx.restore();
    }
  };

  // Calcula el ángulo final para que winningIndex quede en 0 rad (a la derecha)
  const calculateFinalAngle = (currentAngle, winningIndex) => {
    const numOptions = opciones.length;
    const arcSize = (2 * Math.PI) / numOptions;
    // El centro del sector ganador es winningIndex * arcSize + (arcSize/2).
    const sectorCenter = winningIndex * arcSize + arcSize / 2;

    // Queremos que finalAngle + sectorCenter = 0 (mod 2π)
    // => finalAngle = -sectorCenter (mod 2π)
    // Además, sumamos vueltas completas para un giro más vistoso (ej: 3 vueltas).
    const extraSpins = 3 * 2 * Math.PI;

    // Normalizamos el currentAngle a [0, 2π).
    const currentMod =
      ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Delta que necesitamos para alinear el sector con el puntero
    let delta = -sectorCenter - currentMod;
    // Ajustamos delta para que esté en [0, 2π)
    delta = ((delta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    return currentAngle + extraSpins + delta;
  };
  // Acción de girar la ruleta
  const spinWheel = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSelectedOption(null);

    try {
      // Aquí llamas a tu backend para obtener el índice ganador
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
      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const winningOption = await response.json();
      // console.log(winningOption);
      const winningIndex = winningOption.indice; // Número devuelto por tu backend
      if (winningIndex < 0 || winningIndex >= opciones.length) {
        throw new Error("El índice ganador está fuera de rango");
      }

      const finalAngle = calculateFinalAngle(startAngle, winningIndex);
      const duration = 3000;
      const startTime = performance.now();
      const initialAngle = startAngle;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Curva de desaceleración
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentAngle =
          initialAngle + easeOut * (finalAngle - initialAngle);
        setStartAngle(currentAngle);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        drawWheel(ctx, opciones, currentAngle);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsSpinning(false);
          setSelectedOption(opciones[winningIndex]);
        }
      };

      requestAnimationFrame(animate);
    } catch (err) {
      console.error(err);
      setIsSpinning(false);
    }
  };

  // Dibuja la ruleta inicialmente y en cada cambio de ángulo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      drawWheel(ctx, opciones, startAngle);
    }
  }, [opciones, startAngle, width, height]);

  // Ejemplo de función "perder"
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
      if (!ticket.ok) {
        throw new Error("Error en la respuesta del servidor");
      }
      const responseData = await ticket.json();
      console.log(responseData);
      setIntento(responseData.data.documentId);
    } catch (error) {
      console.error("Error al manejar la respuesta:", error);
    }
  };

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
          {/* Canvas con la ruleta */}
          <div style={{ position: "relative", width, height }}>
            <canvas
              ref={canvasRef}
              style={{
                border: "10px solid #F57F17",
                borderRadius: "50%",
                boxShadow:
                  "0 0 20px rgba(255, 215, 0, 0.7), 0 0 40px rgba(255, 235, 59, 0.4), inset 0 0 15px rgba(255, 235, 59, 0.3)",
                transition: "box-shadow 0.3s ease, transform 0.3s ease",
                // transform: isSpinning ? "scale(1.03)" : "scale(1)",
              }}
            />
            {/* Puntero en el lado derecho, apuntando hacia la izquierda */}
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
                ease: isSpinning ? "easeInOut" : "easeInOut",
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

          {/* Botones */}
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

          {/* Resultado final */}
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
