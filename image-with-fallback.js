const PLACEHOLDER_DATA_URI =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
      <rect width="100%" height="100%" fill="#111827"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#F3F4F6">
        Image Unavailable
      </text>
    </svg>
  `);

function initImagesWithFallback() {
  const imgs = document.querySelectorAll("img[data-cdn-src]");
  imgs.forEach((img) => {
    const cdnSrc = img.getAttribute("data-cdn-src");
    if (!cdnSrc) return;

   
    img.dataset.fallbackStage = "local";

    img.addEventListener(
      "error",
      () => {
        if (img.dataset.fallbackStage === "local") {
          img.dataset.fallbackStage = "cdn";
          img.src = cdnSrc;
          return;
        }

        
        img.dataset.fallbackStage = "placeholder";
        img.src = PLACEHOLDER_DATA_URI;
      },
      { once: false }
    );
  });
}

document.addEventListener("DOMContentLoaded", initImagesWithFallback);

