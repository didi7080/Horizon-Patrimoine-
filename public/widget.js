/*!
 * ArtisanRDV — widget de prise de rendez-vous embarquable.
 * Utilisation :
 *   Bouton flottant : <script src=".../widget.js" data-artisanrdv="mon-slug" async></script>
 *   Bloc intégré     : <div data-artisanrdv-inline="mon-slug"></div>
 *                      <script src=".../widget.js" async></script>
 * Options du bouton (attributs sur la balise <script data-artisanrdv="...">) :
 *   data-mode="button" (défaut) | "none" (pour ne charger que le mode inline)
 *   data-color="#1d6f5c"  data-label="Prendre rendez-vous"
 */
(function () {
  "use strict";

  function origineScript() {
    var script = document.currentScript;
    if (script && script.src) {
      try {
        return new URL(script.src).origin;
      } catch (e) {
        /* ignore */
      }
    }
    return "";
  }

  var BASE = origineScript();
  if (!BASE) return;

  function creerIframe(slug) {
    var iframe = document.createElement("iframe");
    iframe.src = BASE + "/embed/" + encodeURIComponent(slug);
    iframe.setAttribute("data-artisanrdv-frame", "1");
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("title", "Prendre rendez-vous");
    iframe.style.width = "100%";
    iframe.style.border = "0";
    iframe.style.minHeight = "420px";
    iframe.style.display = "block";
    return iframe;
  }

  window.addEventListener("message", function (event) {
    if (!event.data || event.data.source !== "artisanrdv-widget") return;
    var frames = document.querySelectorAll("iframe[data-artisanrdv-frame]");
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === event.source) {
        frames[i].style.height = event.data.height + "px";
      }
    }
  });

  // Mode intégré : un <div data-artisanrdv-inline="slug"> par emplacement.
  var blocs = document.querySelectorAll("[data-artisanrdv-inline]");
  for (var b = 0; b < blocs.length; b++) {
    var bloc = blocs[b];
    var slugInline = bloc.getAttribute("data-artisanrdv-inline");
    if (slugInline) bloc.appendChild(creerIframe(slugInline));
  }

  // Mode bouton flottant : une balise <script data-artisanrdv="slug"> suffit.
  var scripts = document.querySelectorAll("script[data-artisanrdv]");
  for (var s = 0; s < scripts.length; s++) {
    (function (script) {
      var slug = script.getAttribute("data-artisanrdv");
      var mode = script.getAttribute("data-mode") || "button";
      if (!slug || mode === "none") return;

      var couleur = script.getAttribute("data-color") || "#1d6f5c";
      var libelle = script.getAttribute("data-label") || "Prendre rendez-vous";

      var bouton = document.createElement("button");
      bouton.type = "button";
      bouton.textContent = libelle;
      bouton.setAttribute("aria-haspopup", "dialog");
      assignerStyle(bouton, {
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: "2147483000",
        background: couleur,
        color: "#fff",
        border: "none",
        borderRadius: "999px",
        padding: "14px 22px",
        fontSize: "15px",
        fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif",
        fontWeight: "600",
        boxShadow: "0 8px 24px rgba(0,0,0,.18)",
        cursor: "pointer",
      });

      var overlay = document.createElement("div");
      assignerStyle(overlay, {
        position: "fixed",
        inset: "0",
        background: "rgba(15,23,42,.55)",
        zIndex: "2147483001",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      });

      var panneau = document.createElement("div");
      assignerStyle(panneau, {
        background: "#fff",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "480px",
        maxHeight: "90vh",
        overflow: "auto",
        position: "relative",
        boxShadow: "0 24px 60px rgba(0,0,0,.28)",
      });

      var fermer = document.createElement("button");
      fermer.type = "button";
      fermer.textContent = "×";
      fermer.setAttribute("aria-label", "Fermer");
      assignerStyle(fermer, {
        position: "absolute",
        top: "6px",
        right: "12px",
        background: "none",
        border: "none",
        fontSize: "28px",
        lineHeight: "1",
        cursor: "pointer",
        color: "#64748b",
      });

      var iframe = creerIframe(slug);
      iframe.style.minHeight = "600px";
      iframe.style.borderRadius = "16px";

      panneau.appendChild(fermer);
      panneau.appendChild(iframe);
      overlay.appendChild(panneau);

      function ouvrir() {
        overlay.style.display = "flex";
      }
      function fermerModale() {
        overlay.style.display = "none";
      }

      bouton.addEventListener("click", ouvrir);
      fermer.addEventListener("click", fermerModale);
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) fermerModale();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") fermerModale();
      });

      document.body.appendChild(overlay);
      document.body.appendChild(bouton);
    })(scripts[s]);
  }

  function assignerStyle(el, styles) {
    for (var k in styles) {
      if (Object.prototype.hasOwnProperty.call(styles, k)) el.style[k] = styles[k];
    }
  }
})();
