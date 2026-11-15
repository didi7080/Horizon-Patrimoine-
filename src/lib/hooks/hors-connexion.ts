import { useSyncExternalStore } from "react";

function abonner(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function etatClient() {
  return !navigator.onLine;
}

function etatServeur() {
  return false;
}

export function useHorsConnexion(): boolean {
  return useSyncExternalStore(abonner, etatClient, etatServeur);
}
