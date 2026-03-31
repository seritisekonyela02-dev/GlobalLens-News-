function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return m;
    }
  });
}

function initVideoPlayers() {
  const videos = document.querySelectorAll("video.news-video");
  videos.forEach((video) => {
    const panel = video.closest(".panel");
    const errorBox = panel ? panel.querySelector(".video-error") : null;
    const retryBtn = errorBox ? errorBox.querySelector(".video-retry") : null;

    const hideError = () => {
      if (!errorBox) return;
      errorBox.hidden = true;
    };

    const showError = () => {
      if (!errorBox) return;
      errorBox.hidden = false;
    };

    hideError();

    video.addEventListener("loadeddata", hideError);
    video.addEventListener("canplay", hideError);
    video.addEventListener("error", showError);

    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        hideError();
        try {
          
          video.load();
          
          video.play().catch(() => {
            
          });
        } catch {
          showError();
        }
      });
    }
  });
}

function initRadioStations() {
  const audios = document.querySelectorAll("audio.radio-audio");
  audios.forEach((audio) => {
    const panel = audio.closest(".panel") || audio.parentElement;
    const statusEl = panel ? panel.querySelector(".radio-status") : null;
    const playBtn = panel ? panel.querySelector(".radio-play") : null;
    const retryBtn = panel ? panel.querySelector(".radio-retry") : null;
    const errorBox = panel ? panel.querySelector(".radio-error") : null;

    const setStatus = (text) => {
      if (!statusEl) return;
      statusEl.textContent = text;
    };

    const hideError = () => {
      if (errorBox) errorBox.hidden = true;
      if (retryBtn) retryBtn.hidden = true;
    };

    const showError = () => {
      if (errorBox) errorBox.hidden = false;
      if (retryBtn) retryBtn.hidden = false;
    };

    hideError();

    audio.addEventListener("playing", () => {
      setStatus("Now playing.");
      hideError();
    });
    audio.addEventListener("loadstart", () => setStatus("Loading stream..."));
    audio.addEventListener("error", () => {
      setStatus("Stream Unavailable.");
      showError();
    });
    audio.addEventListener("stalled", () => setStatus("Stream stalled. Try again."));

    if (playBtn) {
      playBtn.addEventListener("click", async () => {
        hideError();
        setStatus("Loading stream...");
        try {
          await audio.play();
        } catch (e) {
          setStatus("Click Retry to try again.");
          showError();
        }
      });
    }

    if (retryBtn) {
      retryBtn.addEventListener("click", async () => {
        hideError();
        setStatus("Retrying...");
        try {
          audio.load();
          await audio.play();
        } catch (e) {
          setStatus("Stream Unavailable - Click to Retry.");
          showError();
        }
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initVideoPlayers();
  initRadioStations();
});

