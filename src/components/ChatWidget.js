import { useEffect } from "react";

const ChatwootWidget = () => {
    useEffect(() => {
        (function(d, t) {
            const BASE_URL = "https://web.wazend.net";
            const g = d.createElement(t), s = d.getElementsByTagName(t)[0];
            g.src = `${BASE_URL}/packs/js/sdk.js`;
            g.defer = true;
            g.async = true;
            s.parentNode.insertBefore(g, s);

            g.onload = function() {
                if (window.chatwootSDK) {
                    window.chatwootSDK.run({
                        websiteToken: "TNY662q7JTJ37mehhtyq9oav",
                        baseUrl: BASE_URL
                    });
                }
            };
        })(document, "script");
    }, []);

    return null;
};

export default ChatwootWidget;
