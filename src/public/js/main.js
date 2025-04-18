// Client-side JavaScript for MixBert app

document.addEventListener("DOMContentLoaded", function () {
  // Initialize tooltips if Bootstrap is available
  if (typeof bootstrap !== "undefined") {
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  // Show loading indicator when sync is started
  const syncButtons = document.querySelectorAll('[href^="/sync/start/"]');

  syncButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      // Only show loading if we're on the playlist detail page
      if (window.location.pathname.includes("/playlists/")) {
        e.preventDefault();
        const playlistId = this.getAttribute("href").split("/").pop();

        // Create loading overlay
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = "9999";

        const content = document.createElement("div");
        content.style.color = "white";
        content.style.textAlign = "center";

        const spinner = document.createElement("div");
        spinner.className = "spinner-border text-light mb-3";
        spinner.setAttribute("role", "status");

        const message = document.createElement("h4");
        message.textContent = "Syncing playlist to Tidal...";
        message.style.marginTop = "20px";

        const subMessage = document.createElement("p");
        subMessage.textContent =
          "This may take a few minutes depending on the size of your playlist.";

        content.appendChild(spinner);
        content.appendChild(message);
        content.appendChild(subMessage);
        overlay.appendChild(content);
        document.body.appendChild(overlay);

        // Redirect after showing loading indicator
        setTimeout(() => {
          window.location.href = `/sync/start/${playlistId}`;
        }, 500);
      }
    });
  });

  // Add event listeners for accordion behavior in sync results if present
  const accordion = document.getElementById("syncDetailsAccordion");
  if (accordion) {
    const toggleButtons = accordion.querySelectorAll(".accordion-button");

    toggleButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const target = document.querySelector(
          this.getAttribute("data-bs-target")
        );
        if (target) {
          if (target.classList.contains("show")) {
            target.classList.remove("show");
            this.classList.add("collapsed");
          } else {
            target.classList.add("show");
            this.classList.remove("collapsed");
          }
        }
      });
    });
  }
});
