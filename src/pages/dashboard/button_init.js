/* src/pages/dashboard/button_init.js */
"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from 'sonner';

const ButtonInit = ({ documentId, result, phase, className }) => {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    const sendToWebhook = async () => {
        if (!session) {
            console.warn("⚠️User not authenticated.");
            return;
        }
        if (!documentId) {
            console.warn("⚠️No documentId was received.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_N8N_CHALLENGE_UPDATE, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: session.user.id,
                    documentId,
                    timestamp: new Date().toISOString(),
                }),
            });

            if (response.ok) {
                toast.success('Application processed successfully');
                window.location.reload();
            } else {
                console.error("❌ Error al enviar datos a n8n");
                toast.error('Error when processing the application, please try again later');
            }
        } catch (err) {
            console.error("❌ Error en la solicitud al webhook:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (result === "disapproved") {
        return (
            <div className="flex items-center py-3 px-4 gap-3 mt-4 border border-red-500 bg-red-500 rounded-lg">
                <p className="text-sm text-white font-medium">
                    Your challenge was disapproved.You can buy another.
                </p>
                <a
                    href="http://zevenglobalfunding.com/desafio-zeven/"
                    className="text-sm text-white font-bold uppercase underline"
                >
                    Click HERE
                </a>
            </div>
        );
    }

    if (result !== "init") {
        return null;
    }

    return (
        <div className="flex items-center py-1 h-9 px-4 gap-1 border border-[var(--app-primary)] bg-[var(--app-primary)] rounded-lg">
            <p className="text-xs text-black font-medium">
                Start your challenge doing
            </p>
            <button
                onClick={sendToWebhook}
                className="text-xs text-black font-bold uppercase underline"
                disabled={isLoading}
            >
                {isLoading ? "lOADING..." : "click HERE"}
            </button>
        </div>
    );
};

export default ButtonInit;