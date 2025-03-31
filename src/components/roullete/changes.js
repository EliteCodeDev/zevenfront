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
  // =============== STATE AND SETUP ===============
  const { data: session } = useSession();
  const { data, error, loading } = useStrapiData(
    "provisional-products?populate=*"
  );

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [startAngle, setStartAngle] = useState(0);
  const [intento, setIntento] = useState("");
  const [winningIndex, setWinningIndex] = useState(null);
  const canvasRef = useRef(null);

  // Set up options for the wheel
  let opciones = [];
  if (customOptions?.length > 0) {
    opciones = customOptions;
  } else if (data) {
    opciones = data.map((item) => ({
      name: item.precio,
      documentId: item.documentId,
    }));
  }

  // Pointer at right position (0 rad)
  const angleOffset = 0;

  // =============== DRAWING FUNCTIONS ===============

  /**
   * Draws the roulette wheel
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} options - Wheel options
   * @param {number} currentAngle - Current rotation angle
   */
  const drawWheel = (ctx, options, currentAngle) => {
    const numOptions = options.length;
    const arcSize = (2 * Math.PI) / numOptions;
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Clear canvas and set dark gradient background
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

    // Outer glow effects
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 15, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255, 235, 59, 0.1)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255, 235, 59, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Color palette - yellow tones
    const colors = [
      { main: "#F9A825", light: "#FFD54F", shadow: "#F57F17" }, // Amber yellow
      { main: "#FBC02D", light: "#FFEE58", shadow: "#F9A825" }, // Medium yellow
      { main: "#FFD54F", light: "#FFF59D", shadow: "#FBC02D" }, // Light yellow
    ];

    // 3D effect - shadow under the wheel
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.filter = "blur(8px)";
    ctx.fill();
    ctx.filter = "none";

    // Outer edge of wheel
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

    // Draw wheel sections with 3D effect
    for (let i = 0; i < numOptions; i++) {
      const angle = angleOffset + currentAngle + i * arcSize;
      const nextAngle = angle + arcSize;
      const colorSet = colors[i % colors.length];

      // Main sector
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 2, angle, nextAngle);

      // 3D radial gradient effect
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

      // Inner border for depth effect
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 2, angle, nextAngle);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Dividing lines with 3D effect
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

      // Text on each section
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = "right";

      ctx.fillStyle = "#212121";
      ctx.font = "bold 18px 'Arial', sans-serif";
      ctx.fillText(options[i].name, radius * 0.85, 6);

      ctx.shadowColor = "transparent";
      ctx.restore();
    }

    // Center of wheel with 3D effect
    const centerRadius = radius * 0.18;

    // Shadow for center - depth effect
    ctx.beginPath();
    ctx.arc(centerX + 2, centerY + 2, centerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.filter = "blur(3px)";
    ctx.fill();
    ctx.filter = "none";

    // 3D gradient for center
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

    // Metallic border for center
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#5D4037";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Light reflection on center
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

  /**
   * Adds particle effects during wheel spin
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {number} progress - Animation progress (0-1)
   */
  const addParticleEffects = (ctx, canvas, progress) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // More particles at beginning, fewer at end
    const particleCount = Math.ceil((1 - progress) * 4);

    for (let i = 0; i < particleCount; i++) {
      const randomAngle = Math.random() * 2 * Math.PI;
      const randomRadius = radius * 0.5 + Math.random() * (radius * 0.5);
      const particleSize = 1 + Math.random() * 3;

      // Displacement to simulate "trail" during spin
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

      // Gold colors for particles
      const particleAlpha = 0.6 + Math.random() * 0.4;
      ctx.fillStyle =
        Math.random() > 0.5
          ? `rgba(255, 215, 0, ${particleAlpha})`
          : `rgba(255, 235, 59, ${particleAlpha})`;
      ctx.fill();
    }
  };

  /**
   * Highlights the winning section with particles
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  const highlightWinningSection = (ctx, canvas) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    const numOptions = opciones.length;
    const arcSize = (2 * Math.PI) / numOptions;

    // Winning sector angle
    const winAngle = angleOffset + startAngle + winningIndex * arcSize;
    const midWinAngle = winAngle + arcSize / 2;

    // Particles concentrated in winning sector
    for (let i = 0; i < 4; i++) {
      // Calculate angle within winning sector
      const particleAngle = midWinAngle + (Math.random() - 0.5) * arcSize * 0.7;
      // Variable radius for particles
      const particleRadius = radius * 0.4 + Math.random() * (radius * 0.5);
      // Variable size
      const particleSize = Math.random() * 3 + 2;

      ctx.beginPath();
      ctx.arc(
        centerX + Math.cos(particleAngle) * particleRadius,
        centerY + Math.sin(particleAngle) * particleRadius,
        particleSize,
        0,
        2 * Math.PI
      );

      // Golden particles
      ctx.fillStyle =
        Math.random() > 0.5
          ? "rgba(255, 215, 0, 0.8)"
          : "rgba(255, 235, 59, 0.8)";
      ctx.fill();
    }
  };

  // =============== CALCULATION FUNCTIONS ===============

  /**
   * Calculates the final angle to correctly align the winning sector with pointer
   * @param {number} currentAngle - Current wheel angle
   * @param {number} winIndex - Index of winning sector
   * @returns {number} - Target angle for wheel rotation
   */
  const calculateFinalAngle = (currentAngle, winIndex) => {
    const numOptions = opciones.length;
    const arcSize = (2 * Math.PI) / numOptions;

    // Calculate the center angle of the winning sector in wheel coordinates
    const sectorCenterAngle = winIndex * arcSize + arcSize / 2;

    // For the winning sector to align with pointer at 0 rad,
    // the wheel needs to be at angle = -sectorCenterAngle
    const targetAngle = -sectorCenterAngle;

    // Normalize current angle to range [0, 2π)
    const normalizedCurrentAngle =
      ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Normalize target angle to range [0, 2π)
    const normalizedTargetAngle =
      ((targetAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Calculate clockwise rotation needed (could be negative)
    let deltaAngle = normalizedTargetAngle - normalizedCurrentAngle;

    // Ensure we're always rotating clockwise (positive delta)
    if (deltaAngle <= 0) {
      deltaAngle += 2 * Math.PI;
    }

    // Add extra full rotations for visual effect (5 complete turns)
    const extraRotations = 5 * 2 * Math.PI;

    // Final angle = current angle + rotation needed + extra rotations
    return currentAngle + deltaAngle + extraRotations;
  };

  /**
   * Ensures the wheel is correctly aligned with winning sector
   * @param {number} winIndex - Index of winning sector
   * @returns {number} - Perfect angle for alignment
   */
  const ensureCorrectAlignment = (winIndex) => {
    const numOptions = opciones.length;
    const arcSize = (2 * Math.PI) / numOptions;

    // Center of winning sector
    const sectorCenterAngle = winIndex * arcSize + arcSize / 2;

    // Target angle to align sector with pointer at 0 rad
    const targetAngle = -sectorCenterAngle;

    // Normalize to range [0, 2π) while maintaining current full rotations
    const fullRotations =
      Math.floor(startAngle / (2 * Math.PI)) * (2 * Math.PI);
    const normalizedTargetAngle =
      ((targetAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    return fullRotations + normalizedTargetAngle;
  };

  /**
   * Calculates easing for smooth wheel animation
   * @param {number} progress - Animation progress (0-1)
   * @returns {number} - Eased progress value
   */
  const calculateEasing = (progress) => {
    if (progress < 0.7) {
      // Initial phase: high constant speed
      return progress / 0.7;
    } else if (progress < 0.9) {
      // Deceleration phase: smooth slowdown
      const decelerationProgress = (progress - 0.7) / 0.2;
      // Cubic deceleration curve
      return 0.7 + 0.25 * (1 - Math.pow(1 - decelerationProgress, 3));
    } else {
      // Final precision phase: very gentle easing
      const finalProgress = (progress - 0.9) / 0.1;
      // Quadratic final positioning
      return 0.95 + 0.05 * (1 - Math.pow(1 - finalProgress, 2));
    }
  };

  // =============== ANIMATION FUNCTIONS ===============

  /**
   * Smoothly aligns the wheel to the correct winning position
   * @param {number} targetAngle - Target angle for perfect alignment
   * @param {number} alignDuration - Duration of alignment animation (ms)
   */
  const smoothAlignToWinner = (targetAngle, alignDuration) => {
    const startAlignTime = performance.now();
    const initialAlignAngle = startAngle;

    const alignAnimation = (currentTime) => {
      const elapsed = currentTime - startAlignTime;
      const alignProgress = Math.min(elapsed / alignDuration, 1);

      // Ease-out curve for natural movement
      const easeOutProgress = 1 - Math.pow(1 - alignProgress, 2);

      // Calculate intermediate angle
      const currentAlignAngle =
        initialAlignAngle + easeOutProgress * (targetAngle - initialAlignAngle);

      setStartAngle(currentAlignAngle);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      drawWheel(ctx, opciones, currentAlignAngle);

      if (alignProgress < 1) {
        requestAnimationFrame(alignAnimation);
      } else {
        // Once correctly aligned, show celebration
        celebrationEffect(10);
      }
    };

    requestAnimationFrame(alignAnimation);
  };

  /**
   * Celebration effect after wheel stops
   * @param {number} count - Number of animation frames remaining
   */
  const celebrationEffect = (count) => {
    if (count <= 0) {
      // End animation and show result
      setIsSpinning(false);
      setSelectedOption(opciones[winningIndex]);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Soft golden flashes
    ctx.fillStyle =
      count % 2 === 0 ? "rgba(255, 215, 0, 0.15)" : "rgba(255, 235, 59, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Natural breathing effect
    const breathScale = 1 + Math.sin(count * 0.4) * 0.005;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(breathScale, breathScale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Redraw wheel at exact final position
    drawWheel(ctx, opciones, startAngle);

    ctx.restore();

    // Special particles on winning sector
    if (count % 2 === 0) {
      highlightWinningSection(ctx, canvas);
    }

    setTimeout(() => celebrationEffect(count - 1), 120);
  };

  // =============== INTERACTION FUNCTIONS ===============

  /**
   * Handles spinning the wheel
   */
  const spinWheel = async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setSelectedOption(null);

    try {
      // Call backend to get winning index
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

      const winIndex = winningOption.indice;
      setWinningIndex(winIndex);

      if (winIndex < 0 || winIndex >= opciones.length) {
        throw new Error("El índice ganador está fuera de rango");
      }

      // Calculate exact final angle for perfect alignment
      const finalAngle = calculateFinalAngle(startAngle, winIndex);
      const duration = 3000;
      const startTime = performance.now();
      const initialAngle = startAngle;

      // Animation function
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Use optimized easing function
        const easeOutProgress = calculateEasing(progress);

        // Calculate current rotation angle
        const currentAngle =
          initialAngle + easeOutProgress * (finalAngle - initialAngle);
        setStartAngle(currentAngle);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        // Save context before applying transformations
        ctx.save();

        // 3D tilt effect during spin
        if (progress < 0.85 && isSpinning) {
          const tiltIntensity = 0.015 * (1 - progress / 0.85);
          const tiltX = Math.cos(elapsed * 0.003) * tiltIntensity;
          const tiltY = Math.sin(elapsed * 0.003) * tiltIntensity;

          // Apply 3D transformation
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.transform(1 + tiltX, tiltY, -tiltY, 1 + tiltX, 0, 0);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }

        // Draw wheel at current angle
        drawWheel(ctx, opciones, currentAngle);

        // Restore context to original state
        ctx.restore();

        // Particle effects during spin
        if (progress < 0.9 && isSpinning && Math.random() > 0.7) {
          addParticleEffects(ctx, canvas, progress);
        }

        // Continue animation or finish
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Final check: ensure angle is exactly aligned
          const perfectAngle = ensureCorrectAlignment(winIndex);

          // If there's any misalignment, correct smoothly
          if (
            Math.abs(
              (currentAngle % (2 * Math.PI)) - (perfectAngle % (2 * Math.PI))
            ) > 0.01
          ) {
            smoothAlignToWinner(perfectAngle, 300);
          } else {
            // Show celebration effect
            celebrationEffect(10);
          }
        }
      };

      requestAnimationFrame(animate);
    } catch (err) {
      console.error(err);
      setIsSpinning(false);
    }
  };

  /**
   * Handles the "perder" (lose) button action
   */
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
      // console.log(responseData);
      setIntento(responseData.data.documentId);
    } catch (error) {
      console.error("Error al manejar la respuesta:", error);
    }
  };

  // Draw wheel initially and on each angle change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      drawWheel(ctx, opciones, startAngle);
    }
  }, [opciones, startAngle, width, height]);

  // =============== RENDERING ===============
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
          {/* Canvas with wheel */}
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
            {/* Pointer on right side, pointing left */}
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

          {/* Buttons */}
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

          {/* Final result */}
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
