// current year
document.getElementById("year").textContent = new Date().getFullYear();

// simple search filter by title/keywords
const search = document.getElementById("search");
const cards = Array.from(document.querySelectorAll(".card"));

search.addEventListener("input", () => {
  const q = search.value.trim().toLowerCase();
  cards.forEach(card => {
    const hay = (card.dataset.title + " " + card.dataset.keywords).toLowerCase();
    card.style.display = hay.includes(q) ? "" : "none";
  });
});

// “Read/Close” buttons: show one embedded viewer at a time
let openViewer = null;
let openButton = null;
// Hide images if they fail to load (graceful fallback)
document.querySelectorAll('img[data-hide-on-error="1"]').forEach(img => {
  img.addEventListener('error', () => {
    const header = img.closest('.header-hero');
    const media = img.closest('.card-media');
    if (header) {
      header.classList.add('img-failed');
      img.remove();
      return;
    }
    if (media) {
      media.classList.add('img-failed');
      img.remove();
      return;
    }
    // fallback: hide just the broken image
    img.style.display = 'none';
  });
});

// Remove Wikimedia Commons auto-fetch; images are provided locally
document.querySelectorAll('img[data-commons-query]').forEach(img => {
  img.removeAttribute('data-commons-query');
});
document.querySelectorAll(".read-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    // close previous
    if (openViewer && openViewer !== btn.closest(".card").querySelector(".viewer")) {
      openViewer.hidden = true;
      const oldFrame = openViewer.querySelector("iframe");
      oldFrame.removeAttribute("src");
      // remove expanded state from previous card
      const prevCard = openViewer.closest('.card');
      prevCard && prevCard.classList.remove('open');
      // revert previous button text/state
      if (openButton) {
        openButton.textContent = 'Read';
        openButton.setAttribute('aria-expanded', 'false');
        openButton = null;
      }
    }

    const card = btn.closest(".card");
    const viewer = card.querySelector(".viewer");
    const iframe = viewer.querySelector("iframe");
    const pdf = btn.getAttribute("data-pdf") || "";

    // Attempt to suppress native toolbar/annotations in some viewers via fragment params (best effort, not guaranteed across browsers)
    const addFragmentParam = (url, frag) => url.includes('#') ? `${url}&${frag}` : `${url}#${frag}`;
    let viewerUrl = pdf;
    viewerUrl = addFragmentParam(viewerUrl, 'toolbar=0');
    viewerUrl = addFragmentParam(viewerUrl, 'navpanes=0');
    viewerUrl = addFragmentParam(viewerUrl, 'view=FitH');

    // toggle
    if (!viewer.hidden) {
      viewer.hidden = true;
      iframe.removeAttribute("src");
      openViewer = null;
      card.classList.remove('open');
      // revert current button to Read
      btn.textContent = 'Read';
      btn.setAttribute('aria-expanded', 'false');
      openButton = null;
    } else {
      iframe.src = viewerUrl; // lets the browser render PDF (or prompt user)
      viewer.hidden = false;
      openViewer = viewer;
      card.classList.add('open');
      // change button to Close
      btn.textContent = 'Close';
      btn.setAttribute('aria-expanded', 'true');
      openButton = btn;
      // scroll into view (nice on mobile)
      viewer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// Ensure downloads stay on the same page by triggering a programmatic download (avoids navigation in some browsers)
document.querySelectorAll('a[download]').forEach(link => {
  link.addEventListener('click', async (e) => {
    // If modifier keys are used, allow default behavior
    if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    const href = link.getAttribute('href');
    const filename = link.getAttribute('download') || href.split('/').pop() || 'download.pdf';
    try {
      const res = await fetch(href, { cache: 'force-cache' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback to direct navigation if fetch fails
      window.location.href = href;
    }
  });
});


