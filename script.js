(function () {
  const pills = document.querySelectorAll('.pill');
  const rows = document.querySelectorAll('.catalog-table .row:not(.head)');
  const resultCount = document.getElementById('resultCount');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const searchForm = document.getElementById('searchForm');
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.querySelector('.main-nav');

  let activeExam = 'all';

  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    let visible = 0;

    rows.forEach((row) => {
      const matchesExam = activeExam === 'all' || row.dataset.exam === activeExam;
      const matchesQuery = !query || row.textContent.toLowerCase().includes(query);
      const show = matchesExam && matchesQuery;
      row.style.display = show ? '' : 'none';
      if (show) visible += 1;
    });

    resultCount.textContent = visible + (visible === 1 ? ' document' : ' documents');
    emptyState.hidden = visible !== 0;
  }

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      activeExam = pill.dataset.exam;
      applyFilters();
    });
  });

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFilters();
  });
  searchInput.addEventListener('input', applyFilters);

  navToggle.addEventListener('click', () => {
    const open = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', open);
  });
})();



/* =========================================================
   PHOTO COLLAGE MAKER - SCRIPT.JS
   ---------------------------------------------------------
   Features:
   1. Select multiple photos (maximum 10).
   2. Automatic landscape collage arrangement.
   3. Equal grid and automatic layouts.
   4. Remove individual photos.
   5. HD 1920 x 1080 collage generation.
   6. PNG download.
   7. Drag and drop image upload.
   8. Automatic preview updates.
========================================================= */


/* =========================================================
   1. INITIALIZE COLLAGE MAKER
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    // Find all required HTML elements.
    const cmInput = document.getElementById("cm-file-input");
    const cmPhotoList = document.getElementById("cm-photo-list");
    const cmPhotoCount = document.getElementById("cm-photo-count");
    const cmCanvas = document.getElementById("cm-canvas");
    const cmGenerate = document.getElementById("cm-generate");
    const cmDownload = document.getElementById("cm-download");
    const cmStatus = document.getElementById("cm-status");
    const cmDropArea = document.getElementById("cm-drop-area");

    // Stop initialization if the collage section is not on this page.
    if (
        !cmInput ||
        !cmPhotoList ||
        !cmCanvas ||
        !cmGenerate ||
        !cmDownload ||
        !cmStatus ||
        !cmDropArea
    ) {
        return;
    }

    // Get the 2D drawing context of the canvas.
    const cmCtx = cmCanvas.getContext("2d");

    // Store uploaded photos.
    let cmPhotos = [];

    // Maximum number of photos.
    const CM_MAX_PHOTOS = 10;


    /* =====================================================
       2. HANDLE PHOTO SELECTION
    ===================================================== */

    cmInput.addEventListener("change", function (event) {

        // Add selected images to the collage.
        addPhotos(event.target.files);

        // Reset input to allow selecting the same images again.
        cmInput.value = "";

    });


    /* =====================================================
       3. ADD PHOTOS
    ===================================================== */

    function addPhotos(files) {

        // Filter only valid image files.
        const imageFiles = Array.from(files).filter(file =>
            file.type.startsWith("image/")
        );

        // Calculate remaining upload capacity.
        const available = CM_MAX_PHOTOS - cmPhotos.length;

        // Stop if the maximum has already been reached.
        if (available <= 0) {

            cmStatus.textContent = "Maximum 10 photos allowed.";

            return;

        }

        // Add only the number of images allowed.
        const selected = imageFiles.slice(0, available);

        // Create temporary URLs for uploaded images.
        selected.forEach(file => {

            const imageURL = URL.createObjectURL(file);

            cmPhotos.push({
                file: file,
                url: imageURL
            });

        });

        // Display upload information.
        if (imageFiles.length > available) {

            cmStatus.textContent =
                "Only " + available + " additional photos were added.";

        } else {

            cmStatus.textContent = "";

        }

        // Refresh photo thumbnails.
        renderPhotoList();

        // Generate the collage automatically.
        if (cmPhotos.length > 0) {

            generateCollage();

        }

    }


    /* =====================================================
       4. DISPLAY PHOTO THUMBNAILS
    ===================================================== */

    function renderPhotoList() {

        // Clear existing thumbnails.
        cmPhotoList.innerHTML = "";

        // Update photo counter.
        cmPhotoCount.textContent =
            cmPhotos.length + " / " + CM_MAX_PHOTOS;

        // Show empty message if there are no photos.
        if (cmPhotos.length === 0) {

            cmPhotoList.innerHTML =
                '<p class="cm-empty">Your selected photos will appear here.</p>';

            cmDownload.disabled = true;

            return;

        }

        // Create thumbnail for every selected photo.
        cmPhotos.forEach((photo, index) => {

            const item = document.createElement("div");

            item.className = "cm-photo-item";

            // Create image thumbnail.
            const img = document.createElement("img");

            img.src = photo.url;

            img.alt = "Selected photo " + (index + 1);

            // Create remove button.
            const remove = document.createElement("button");

            remove.className = "cm-remove";

            remove.textContent = "×";

            remove.title = "Remove photo";

            // Remove selected photo when clicked.
            remove.addEventListener("click", function () {

                // Release temporary image URL.
                URL.revokeObjectURL(cmPhotos[index].url);

                // Remove photo from array.
                cmPhotos.splice(index, 1);

                // Update thumbnails.
                renderPhotoList();

                // Regenerate collage.
                if (cmPhotos.length > 0) {

                    generateCollage();

                } else {

                    // Clear canvas when all photos are removed.
                    cmCtx.clearRect(
                        0,
                        0,
                        cmCanvas.width,
                        cmCanvas.height
                    );

                    cmDownload.disabled = true;

                    cmStatus.textContent =
                        "Add photos to create a collage.";

                }

            });

            // Add image and remove button.
            item.appendChild(img);

            item.appendChild(remove);

            cmPhotoList.appendChild(item);

        });

    }


    /* =====================================================
       5. CALCULATE AUTOMATIC COLLAGE LAYOUT
    ===================================================== */

    function calculateGrid(count) {

        // Get selected layout.
        const layoutType =
            document.getElementById("cm-layout").value;

        // Equal grid layout.
        if (layoutType === "equal") {

            const columns = Math.ceil(Math.sqrt(count * 16 / 9));

            return {
                columns: columns,
                rows: Math.ceil(count / columns)
            };

        }

        // Automatic landscape layout.
        const layouts = {

            1: [1, 1],
            2: [2, 1],
            3: [3, 1],
            4: [2, 2],
            5: [3, 2],
            6: [3, 2],
            7: [4, 2],
            8: [4, 2],
            9: [3, 3],
            10: [4, 3]

        };

        const layout = layouts[count] || [3, 3];

        return {

            columns: layout[0],

            rows: layout[1]

        };

    }


    /* =====================================================
       6. LOAD SELECTED IMAGE
    ===================================================== */

    function loadImage(url) {

        return new Promise((resolve, reject) => {

            const img = new Image();

            // Resolve after successful image loading.
            img.onload = function () {

                resolve(img);

            };

            // Handle image loading errors.
            img.onerror = function () {

                reject(new Error("Image could not be loaded."));

            };

            img.src = url;

        });

    }


    /* =====================================================
       7. DRAW IMAGE WITHOUT DISTORTION
    ===================================================== */

    function drawCover(ctx, img, x, y, width, height) {

        // Calculate image scaling.
        const scale = Math.max(
            width / img.width,
            height / img.height
        );

        // Calculate scaled image dimensions.
        const scaledWidth = img.width * scale;

        const scaledHeight = img.height * scale;

        // Calculate center cropping.
        const cropX = (scaledWidth - width) / 2;

        const cropY = (scaledHeight - height) / 2;

        // Draw image inside its tile.
        ctx.drawImage(

            img,

            cropX / scale,

            cropY / scale,

            width / scale,

            height / scale,

            x,

            y,

            width,

            height

        );

    }


    /* =====================================================
       8. GENERATE HD COLLAGE
    ===================================================== */

    async function generateCollage() {

        // Check whether photos are available.
        if (cmPhotos.length === 0) {

            cmStatus.textContent =
                "Please upload some photos first.";

            return;

        }

        // Disable buttons during processing.
        cmGenerate.disabled = true;

        cmDownload.disabled = true;

        cmStatus.textContent =
            "Creating your HD collage...";

        try {

            // HD landscape dimensions.
            const canvasWidth = 1920;

            const canvasHeight = 1080;

            // Set canvas dimensions.
            cmCanvas.width = canvasWidth;

            cmCanvas.height = canvasHeight;

            // Get background color.
            const background =
                document.getElementById("cm-background").value;

            // Fill canvas background.
            cmCtx.fillStyle = background;

            cmCtx.fillRect(
                0,
                0,
                canvasWidth,
                canvasHeight
            );

            // Get spacing between photos.
            const gap = Number(
                document.getElementById("cm-gap").value
            );

            // Calculate collage layout.
            const grid = calculateGrid(cmPhotos.length);

            const columns = grid.columns;

            const rows = grid.rows;

            // Calculate each photo tile's dimensions.
            const tileWidth =
                (canvasWidth - gap * (columns + 1)) / columns;

            const tileHeight =
                (canvasHeight - gap * (rows + 1)) / rows;

            // Load all images together.
            const images = await Promise.all(

                cmPhotos.map(photo => loadImage(photo.url))

            );

            // Draw each image in the calculated position.
            images.forEach((img, index) => {

                // Calculate column position.
                const column = index % columns;

                // Calculate row position.
                const row = Math.floor(index / columns);

                // Calculate image coordinates.
                const x = gap + column * (tileWidth + gap);

                const y = gap + row * (tileHeight + gap);

                // Draw image without stretching.
                drawCover(

                    cmCtx,

                    img,

                    x,

                    y,

                    tileWidth,

                    tileHeight

                );

            });

            // Enable download after successful generation.
            cmDownload.disabled = false;

            cmStatus.textContent =
                "Your HD landscape collage is ready!";

        } catch (error) {

            // Display errors in console.
            console.error("Collage Error:", error);

            cmStatus.textContent =
                "Something went wrong while creating the collage.";

        } finally {

            // Re-enable generate button.
            cmGenerate.disabled = false;

        }

    }


    /* =====================================================
       9. GENERATE COLLAGE BUTTON
    ===================================================== */

    cmGenerate.addEventListener("click", function () {

        generateCollage();

    });


    /* =====================================================
       10. AUTOMATIC PREVIEW UPDATE
    ===================================================== */

    // Regenerate when layout changes.
    document.getElementById("cm-layout")
        .addEventListener("change", generateCollage);

    // Regenerate when spacing changes.
    document.getElementById("cm-gap")
        .addEventListener("change", generateCollage);

    // Regenerate when background changes.
    document.getElementById("cm-background")
        .addEventListener("change", generateCollage);


    /* =====================================================
       11. DOWNLOAD HD COLLAGE
    ===================================================== */

    cmDownload.addEventListener("click", function () {

        // Check whether photos exist.
        if (cmPhotos.length === 0) return;

        // Convert canvas into PNG.
        cmCanvas.toBlob(function (blob) {

            // Check generated file.
            if (!blob) {

                cmStatus.textContent =
                    "Unable to download the collage.";

                return;

            }

            // Create temporary download URL.
            const downloadURL = URL.createObjectURL(blob);

            // Create download link.
            const link = document.createElement("a");

            link.href = downloadURL;

            link.download = "My-HD-Photo-Collage.png";

            // Trigger download.
            document.body.appendChild(link);

            link.click();

            link.remove();

            // Release temporary URL.
            URL.revokeObjectURL(downloadURL);

            cmStatus.textContent =
                "Your collage has been downloaded!";

        }, "image/png");

    });


    /* =====================================================
       12. DRAG AND DROP PHOTO UPLOAD
    ===================================================== */

    // Highlight upload area when dragging files.
    cmDropArea.addEventListener("dragover", function (event) {

        event.preventDefault();

        cmDropArea.classList.add("dragging");

    });

    // Remove highlight when leaving upload area.
    cmDropArea.addEventListener("dragleave", function () {

        cmDropArea.classList.remove("dragging");

    });

    // Handle dropped photos.
    cmDropArea.addEventListener("drop", function (event) {

        event.preventDefault();

        cmDropArea.classList.remove("dragging");

        addPhotos(event.dataTransfer.files);

    });


    /* =====================================================
       13. COLLAGE MAKER INITIALIZATION COMPLETE
    ===================================================== */

    console.log("Photo Collage Maker initialized successfully.");

});

