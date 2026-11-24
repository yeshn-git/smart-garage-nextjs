/* lib/utils.js - shared helpers used by pages and components */

export const STATUSES = ["Pending", "In Progress", "Completed"];

export const shortId = (id) => "SG-" + String(id || "").slice(0, 6).toUpperCase();

export function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d)) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

export const toMillis = (ts) => (ts ? new Date(ts).getTime() || 0 : 0);

/** Error message to show the user (API errors already carry friendly text) */
export function friendlyError(err) {
  if (err?.code === "network") return "Network error. Check your internet connection.";
  return err?.message || "Something went wrong. Please try again.";
}

/**
 * Resizes an image in the browser.
 * Returns { blob, base64, mimeType, dataUrl }.
 * The result is kept under ~700 KB so it uploads quickly and fits in the database.
 */
export function compressImage(file, maxSize = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("Please choose a valid image file."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Unsupported image format."));
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(1, maxSize / Math.max(width, height));
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        let q = quality;
        let dataUrl = canvas.toDataURL("image/jpeg", q);
        while (dataUrl.length > 700000 && q > 0.3) {
          q -= 0.15;
          dataUrl = canvas.toDataURL("image/jpeg", q);
        }
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Image compression failed."));
            resolve({ blob, dataUrl, base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
          },
          "image/jpeg",
          q
        );
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
