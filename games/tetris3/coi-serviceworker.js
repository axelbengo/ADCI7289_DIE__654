/*! coi-serviceworker v0.1.7 - Guido Zuidhof and contributors, licensed under MIT */
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener("fetch", (event) => {
		if (event.request.url.includes("paddle.com")) {
			return; 
		}
		
        if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") {
            return;
        }

        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.status === 0) {
                        return response;
                    }

                    // --- DEBUT DE LA CORRECTION ---
                    // Si le statut est 204 (No Content) ou 304 (Not Modified), 
                    // on ne doit pas essayer de reconstruire la réponse avec un body.
                    if (response.status === 204 || response.status === 304) {
                        const newHeaders = new Headers(response.headers);
                        newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
                        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
                        
                        return new Response(null, {
                            status: response.status,
                            statusText: response.statusText,
                            headers: newHeaders,
                        });
                    }
                    // --- FIN DE LA CORRECTION ---

                    const newHeaders = new Headers(response.headers);
                    newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
                    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });
                })
                .catch((e) => console.error(e))
        );
    });
} else {
    // Code pour enregistrer le service worker
    navigator.serviceWorker.register(window.document.currentScript.src).then((registration) => {
        registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    window.location.reload();
                }
            });
        });
    });
}
