
/* =========================================================
   WEBSITE MAIN SCRIPT.JS
   ---------------------------------------------------------
   PART 1: MATERIAL SEARCH AND FILTER
   PART 2: MOBILE NAVIGATION
   PART 3: PHOTO COLLAGE MAKER

   All features are initialized safely.
========================================================= */


/* =========================================================
   PART 1: MATERIAL SEARCH AND EXAM FILTERS
========================================================= */

(function () {

    // Get website elements.
    const pills = document.querySelectorAll('.pill');
    const rows = document.querySelectorAll('.catalog-table .row:not(.head)');
    const resultCount = document.getElementById('resultCount');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.getElementById('searchForm');

    // Track currently selected exam.
    let activeExam = 'all';

    // Apply search and exam filters.
    function applyFilters() {

        // Stop safely if search elements are unavailable.
        if (!searchInput || !resultCount || !emptyState) return;

        const query = searchInput.value.trim().toLowerCase();

        let visible = 0;

        rows.forEach((row) => {

            const matchesExam =
                activeExam === 'all' ||
                row.dataset.exam === activeExam;

            const matchesQuery =
                !query ||
                row.textContent.toLowerCase().includes(query);

            const show = matchesExam && matchesQuery;

            row.style.display = show ? '' : 'none';

            if (show) visible++;

        });

        // Update result count.
        resultCount.textContent =
            visible + (visible === 1 ? ' document' : ' documents');

        // Display empty state when no results exist.
        emptyState.hidden = visible !== 0;

    }

    // Handle exam filter buttons.
    pills.forEach((pill) => {

        pill.addEventListener('click', () => {

            pills.forEach((p) =>
                p.classList.remove('is-active')
            );

            pill.classList.add('is-active');

            activeExam = pill.dataset.exam;

            applyFilters();

        });

    });

    // Handle search form submission.
    if (searchForm) {

        searchForm.addEventListener('submit', (e) => {

            e.preventDefault();

            applyFilters();

        });

    }

    // Update results while typing.
    if (searchInput) {

        searchInput.addEventListener('input', applyFilters);

    }

})();


/* =========================================================
   PART 2: MOBILE NAVIGATION
========================================================= */

(function () {

    // Find navigation elements.
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.querySelector('.main-nav');

    // Only initialize when both elements exist.
    if (!navToggle || !mainNav) return;

    // Toggle mobile navigation.
    navToggle.addEventListener('click', () => {

        const open = mainNav.classList.toggle('is-open');

        navToggle.setAttribute('aria-expanded', String(open));

    });

})();


/* =========================================================
   PART 3: PHOTO COLLAGE MAKER
========================================================= */

(function () {

    /* -----------------------------------------------------
       1. INITIALIZE COLLAGE ELEMENTS
    ----------------------------------------------------- */

    const cmInput = document.getElementById('cm-file-input');
    const cmPhotoList = document.getElementById('cm-photo-list');
    const cmPhotoCount = document.getElementById('cm-photo-count');
    const cmCanvas = document.getElementById('cm-canvas');
    const cmGenerate = document.getElementById('cm-generate');
    const cmDownload = document.getElementById('cm-download');
    const cmStatus = document.getElementById('cm-status');
    const cmDropArea = document.getElementById('cm-drop-area');

    // Collage settings.
    const cmLayout = document.getElementById('cm-layout');
    const cmGap = document.getElementById('cm-gap');
    const cmBackground = document.getElementById('cm-background');

    // Make sure all essential HTML elements exist.
    if (
        !cmInput ||
        !cmPhotoList ||
        !cmPhotoCount ||
        !cmCanvas ||
        !cmGenerate ||
        !cmDownload ||
        !cmStatus ||
        !cmDropArea ||
        !cmLayout ||
        !cmGap ||
        !cmBackground
    ) {

        console.warn(
            'Collage Maker: Required HTML element is missing. Check your element IDs.'
        );

        return;

    }

    // Get canvas drawing context.
    const cmCtx = cmCanvas.getContext('2d');

    if (!cmCtx) {

        console.error('Collage Maker: Canvas is not supported.');

        return;

    }

    // Store uploaded photos.
    let cmPhotos = [];

    // Maximum number of photos.
    const CM_MAX_PHOTOS = 10;

    // Prevent older collage generation from replacing a newer one.
    let cmGenerationId = 0;

    // Set action buttons to avoid accidental form submission.
    cmGenerate.type = 'button';
    cmDownload.type = 'button';


    /* -----------------------------------------------------
       2. HANDLE PHOTO UPLOAD
    ----------------------------------------------------- */

    cmInput.addEventListener('change', function (event) {

        addPhotos(event.target.files);

        // Reset input.
        cmInput.value = '';

    });


    /* -----------------------------------------------------
       3. ADD PHOTOS TO COLLAGE
    ----------------------------------------------------- */

    function addPhotos(files) {

        // Accept image files only.
        const imageFiles = Array.from(files).filter(file =>
            file.type.startsWith('image/')
        );

        // Calculate available photo slots.
        const available = CM_MAX_PHOTOS - cmPhotos.length;

        if (available <= 0) {

            cmStatus.textContent = 'Maximum 10 photos allowed.';

            return;

        }

        // Select only allowed number of photos.
        const selected = imageFiles.slice(0, available);

        // Store image files.
        selected.forEach(file => {

            cmPhotos.push({

                file: file,

                url: URL.createObjectURL(file)

            });

        });

        // Show upload information.
        if (imageFiles.length > available) {

            cmStatus.textContent =
                'Only ' + available + ' additional photos were added.';

        } else if (selected.length === 0) {

            cmStatus.textContent =
                'Please select valid image files.';

        } else {

            cmStatus.textContent = '';

        }

        // Refresh photo thumbnails.
        renderPhotoList();

        // Generate preview automatically.
        if (cmPhotos.length > 0) {

            generateCollage();

        }

    }


    /* -----------------------------------------------------
       4. DISPLAY SELECTED PHOTO THUMBNAILS
    ----------------------------------------------------- */

    function renderPhotoList() {

        cmPhotoList.innerHTML = '';

        cmPhotoCount.textContent =
            cmPhotos.length + ' / ' + CM_MAX_PHOTOS;

        // Display empty message.
        if (cmPhotos.length === 0) {

            cmPhotoList.innerHTML =
                '<p class="cm-empty">Your selected photos will appear here.</p>';

            cmDownload.disabled = true;

            return;

        }

        // Create individual thumbnails.
        cmPhotos.forEach((photo, index) => {

            const item = document.createElement('div');

            item.className = 'cm-photo-item';

            const img = document.createElement('img');

            img.src = photo.url;

            img.alt = 'Selected photo ' + (index + 1);

            // Create remove button.
            const remove = document.createElement('button');

            remove.type = 'button';

            remove.className = 'cm-remove';

            remove.textContent = '×';

            remove.title = 'Remove photo';

            // Remove selected photo.
            remove.addEventListener('click', function () {

                URL.revokeObjectURL(cmPhotos[index].url);

                cmPhotos.splice(index, 1);

                renderPhotoList();

                if (cmPhotos.length > 0) {

                    generateCollage();

                } else {

                    // Invalidate any ongoing generation.
                    cmGenerationId++;

                    cmCtx.clearRect(
                        0,
                        0,
                        cmCanvas.width,
                        cmCanvas.height
                    );

                    cmDownload.disabled = true;

                    cmStatus.textContent =
                        'Add photos to create a collage.';

                }

            });

            item.appendChild(img);

            item.appendChild(remove);

            cmPhotoList.appendChild(item);

        });

    }


    /* -----------------------------------------------------
       5. CALCULATE AUTOMATIC COLLAGE LAYOUT
    ----------------------------------------------------- */

    function calculateGrid(count) {

        // Equal grid layout.
        if (cmLayout.value === 'equal') {

            const columns = Math.ceil(Math.sqrt(count * 16 / 9));

            return {

                columns: columns,

                rows: Math.ceil(count / columns)

            };

        }

        // Automatic landscape layouts.
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


    /* -----------------------------------------------------
       6. LOAD IMAGE FILE
    ----------------------------------------------------- */

    function loadImage(url) {

        return new Promise((resolve, reject) => {

            const img = new Image();

            img.onload = () => resolve(img);

            img.onerror = () => reject(
                new Error('Unable to load selected image.')
            );

            img.src = url;

        });

    }


    /* -----------------------------------------------------
       7. DRAW IMAGE WITHOUT DISTORTION
    ----------------------------------------------------- */

    function drawCover(ctx, img, x, y, width, height) {

        // Calculate correct image scaling.
        const scale = Math.max(
            width / img.width,
            height / img.height
        );

        // Calculate center crop.
        const cropX = (img.width - width / scale) / 2;

        const cropY = (img.height - height / scale) / 2;

        // Draw image.
        ctx.drawImage(

            img,

            cropX,

            cropY,

            width / scale,

            height / scale,

            x,

            y,

            width,

            height

        );

    }


    /* -----------------------------------------------------
       8. GENERATE HD LANDSCAPE COLLAGE
    ----------------------------------------------------- */

    async function generateCollage() {

        // Check for uploaded photos.
        if (cmPhotos.length === 0) {

            cmStatus.textContent =
                'Please upload photos first.';

            return;

        }

        // Create unique generation ID.
        const currentGeneration = ++cmGenerationId;

        // Disable buttons during generation.
        cmGenerate.disabled = true;

        cmDownload.disabled = true;

        cmStatus.textContent =
            'Creating your HD collage...';

        try {

            // Set HD landscape dimensions.
            const canvasWidth = 1920;

            const canvasHeight = 1080;

            cmCanvas.width = canvasWidth;

            cmCanvas.height = canvasHeight;

            // Get selected background.
            cmCtx.fillStyle = cmBackground.value;

            cmCtx.fillRect(
                0,
                0,
                canvasWidth,
                canvasHeight
            );

            // Get photo spacing.
            const gap = Number(cmGap.value);

            // Calculate layout.
            const grid = calculateGrid(cmPhotos.length);

            const columns = grid.columns;

            const rows = grid.rows;

            // Calculate tile dimensions.
            const tileWidth =
                (canvasWidth - gap * (columns + 1)) / columns;

            const tileHeight =
                (canvasHeight - gap * (rows + 1)) / rows;

            // Save current photo URLs.
            const photoURLs = cmPhotos.map(photo => photo.url);

            // Load all photos.
            const images = await Promise.all(
                photoURLs.map(url => loadImage(url))
            );

            // Ignore outdated generation requests.
            if (currentGeneration !== cmGenerationId) return;

            // Draw each image.
            images.forEach((img, index) => {

                // Calculate grid position.
                const column = index % columns;

                const row = Math.floor(index / columns);

                // Calculate image position.
                const x = gap + column * (tileWidth + gap);

                const y = gap + row * (tileHeight + gap);

                // Draw photo.
                drawCover(
                    cmCtx,
                    img,
                    x,
                    y,
                    tileWidth,
                    tileHeight
                );

            });

            // Enable download.
            cmDownload.disabled = false;

            cmStatus.textContent =
                'Your HD landscape collage is ready!';

        } catch (error) {

            console.error('Collage generation error:', error);

            if (currentGeneration === cmGenerationId) {

                cmStatus.textContent =
                    'Unable to generate collage. Please try again.';

            }

        } finally {

            // Enable button only for the latest request.
            if (currentGeneration === cmGenerationId) {

                cmGenerate.disabled = false;

            }

        }

    }


    /* -----------------------------------------------------
       9. GENERATE BUTTON EVENT
    ----------------------------------------------------- */

    cmGenerate.addEventListener('click', function (event) {

        event.preventDefault();

        generateCollage();

    });


    /* -----------------------------------------------------
       10. UPDATE PREVIEW WHEN SETTINGS CHANGE
    ----------------------------------------------------- */

    cmLayout.addEventListener('change', generateCollage);

    cmGap.addEventListener('change', generateCollage);

    cmBackground.addEventListener('change', generateCollage);


    /* -----------------------------------------------------
       11. DOWNLOAD COLLAGE AS HD PNG
    ----------------------------------------------------- */

    cmDownload.addEventListener('click', function (event) {

        event.preventDefault();

        if (cmPhotos.length === 0) return;

        cmStatus.textContent = 'Preparing PNG download...';

        cmCanvas.toBlob(function (blob) {

            if (!blob) {

                cmStatus.textContent =
                    'Unable to create PNG file.';

                return;

            }

            // Create temporary download URL.
            const downloadURL = URL.createObjectURL(blob);

            const link = document.createElement('a');

            link.href = downloadURL;

            link.download = 'My-HD-Photo-Collage.png';

            document.body.appendChild(link);

            link.click();

            link.remove();

            // Release URL after initiating download.
            setTimeout(() => {

                URL.revokeObjectURL(downloadURL);

            }, 1000);

            cmStatus.textContent =
                'Your HD collage has been downloaded!';

        }, 'image/png');

    });


    /* -----------------------------------------------------
       12. DRAG AND DROP PHOTO UPLOAD
    ----------------------------------------------------- */

    // Highlight upload box.
    cmDropArea.addEventListener('dragover', function (event) {

        event.preventDefault();

        cmDropArea.classList.add('dragging');

    });

    // Remove highlight.
    cmDropArea.addEventListener('dragleave', function () {

        cmDropArea.classList.remove('dragging');

    });

    // Handle dropped files.
    cmDropArea.addEventListener('drop', function (event) {

        event.preventDefault();

        cmDropArea.classList.remove('dragging');

        addPhotos(event.dataTransfer.files);

    });


    /* -----------------------------------------------------
       13. COLLAGE MAKER READY
    ----------------------------------------------------- */

    console.log('Photo Collage Maker initialized successfully.');

})();


/* =========================================================
   END OF WEBSITE SCRIPT.JS
========================================================= */
