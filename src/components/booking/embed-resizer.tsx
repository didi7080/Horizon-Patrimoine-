"use client";

import { useEffect } from "react";

/**
 * Signale la hauteur réelle du contenu à la page parente (widget.js) via
 * postMessage, pour que l'iframe embarquée s'ajuste sans barre de défilement.
 */
export function EmbedResizer() {
  useEffect(() => {
    if (window.self === window.top) return; // pas dans une iframe

    function envoyerHauteur() {
      window.parent.postMessage(
        { source: "artisanrdv-widget", height: document.documentElement.scrollHeight },
        "*",
      );
    }

    envoyerHauteur();
    const observateur = new ResizeObserver(envoyerHauteur);
    observateur.observe(document.documentElement);
    window.addEventListener("load", envoyerHauteur);

    return () => {
      observateur.disconnect();
      window.removeEventListener("load", envoyerHauteur);
    };
  }, []);

  return null;
}
