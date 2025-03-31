import React, { useEffect, useState } from 'react';

const Recaptcha = ({ onVerify }) => {
    const [isLoaded, setIsLoaded] = useState(false);  // Estado para controlar si el CAPTCHA ha sido cargado.

    useEffect(() => {
        if (isLoaded) return;  // Si ya está cargado, no hacemos nada más.

        const loadTurnstile = () => {
            // Verificamos si Turnstile ya está disponible
            if (window.turnstile) {
                // Si Turnstile ya está disponible, lo renderizamos con el tema oscuro
                window.turnstile.render('#turnstile-container', {
                    sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
                    callback: (token) => {
                        onVerify(token);
                    }
                });
                setIsLoaded(true); // Marcamos que ya se cargó el CAPTCHA
            }
        };

        // Verificamos si el script está cargado en el navegador
        const scriptExists = document.querySelector('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
        if (!scriptExists) {
            const script = document.createElement('script');
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
            script.async = true;
            script.defer = true;
            script.onload = loadTurnstile;  // Cuando cargue el script, ejecutamos loadTurnstile.
            document.head.appendChild(script);
        } else {
            loadTurnstile();  // Si el script ya está presente, lo cargamos directamente
        }
    }, [isLoaded, onVerify]);  // El efecto solo se ejecuta si isLoaded cambia.

    return <div id="turnstile-container"></div>;
};

export default Recaptcha;
