
/* =========================================================
   EXAMSHELF PDF TO MCQ JSON CONVERTER

   Main features:
   1. Read PDF files using PDF.js.
   2. Optionally OCR scanned pages using Tesseract.js.
   3. Detect MCQ question blocks and A/B/C/D options.
   4. Create editable question cards.
   5. Export structured JSON.

   IMPORTANT:
   Automatic extraction is not guaranteed to be accurate.
   Review every question and answer before publishing.
========================================================= */

// Configure the PDF.js worker.
pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// Store selected file and extracted questions.
let selectedPDF = null;
let questions = [];
let totalPages = 0;

// Collect page elements.
const pdfInput = document.getElementById("pdfInput");
const dropZone = document.getElementById("dropZone");
const browseBtn = document.getElementById("browseBtn");
const extractBtn = document.getElementById("extractBtn");
const progressBar = document.getElementById("progressBar");
const statusText = document.getElementById("status");
const questionList = document.getElementById("questionList");
const questionCount = document.getElementById("questionCount");
const jsonPreview = document.getElementById("jsonPreview");

// ---------- PDF selection ----------

// Open the file browser when the button is clicked.
browseBtn.addEventListener("click", () => pdfInput.click());

// Accept a selected PDF.
pdfInput.addEventListener("change", () => {
    acceptPDF(pdfInput.files[0]);
});

// Enable drag-and-drop support.
["dragover", "dragenter"].forEach(eventName => {
    dropZone.addEventListener(eventName, event => {
        event.preventDefault();
        dropZone.classList.add("dragover");
    });
});

["dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, event => {
        event.preventDefault();
        dropZone.classList.remove("dragover");
    });
});

// Process the dropped file.
dropZone.addEventListener("drop", event => {
    acceptPDF(event.dataTransfer.files[0]);
});

// Validate the PDF before processing.
function acceptPDF(file) {

    if (!file) return;

    if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    ) {
        alert("Please select a PDF file.");
        return;
    }

    selectedPDF = file;

    document.getElementById("fileInfo").textContent =
        "Selected: " + file.name;

    extractBtn.disabled = false;
}

// ---------- Progress display ----------

// Update the progress bar and status text.
function updateProgress(percent, message) {

    progressBar.style.width = percent + "%";

    statusText.textContent = message;
}

// ---------- Extract PDF page text ----------

// Extract selectable text from one page.
async function extractPageText(page) {

    const content = await page.getTextContent();

    return content.items
        .map(item => item.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
}

// Render a page to a canvas for OCR.
async function renderPage(page) {

    const viewport = page.getViewport({ scale: 1.7 });

    const canvas = document.createElement("canvas");

    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    return canvas;
}

// Extract all pages from the uploaded PDF.
async function extractPDF() {

    const bytes = await selectedPDF.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: bytes
    }).promise;

    totalPages = pdf.numPages;

    const pageRecords = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {

        const page = await pdf.getPage(pageNumber);

        let text = await extractPageText(page);

        // Use OCR only when the page has almost no selectable text.
        if (
            document.getElementById("useOCR").checked &&
            text.length < 35
        ) {

            if (!window.Tesseract) {
                throw new Error("OCR library failed to load.");
            }

            updateProgress(
                pageNumber / pdf.numPages * 90,
                "Running OCR on page " + pageNumber
            );

            const canvas = await renderPage(page);

            const result = await Tesseract.recognize(
                canvas,
                "eng+hin"
            );

            text = result.data.text
                .replace(/\s+/g, " ")
                .trim();

            canvas.width = 1;
            canvas.height = 1;
        }

        pageRecords.push({
            page: pageNumber,
            text: text
        });

        updateProgress(
            pageNumber / pdf.numPages * 90,
            "Reading page " + pageNumber + " of " + pdf.numPages
        );
    }

    return pageRecords;
}

// ---------- Detect question blocks ----------

// Split text into blocks using numbered question patterns.
function splitQuestionBlocks(pageRecords) {

    const blocks = [];

    const questionPattern =
        /(?:^|\n)\s*(?:Q(?:uestion)?\s*)?\d{1,3}\s*[.)\-:]\s+/gim;

    pageRecords.forEach(record => {

        const text = record.text.replace(/\s+/g, " ");

        const matches = [...text.matchAll(questionPattern)];

        matches.forEach((match, index) => {

            const start = match.index;

            const end = matches[index + 1]
                ? matches[index + 1].index
                : text.length;

            const block = text.slice(start, end).trim();

            if (block.length > 12) {

                blocks.push({
                    page: record.page,
                    raw: block
                });

            }

        });

    });

    return blocks;
}

// ---------- Parse an individual MCQ ----------

function parseMCQ(block, index) {

    const raw = block.raw;

    // Detect common option labels: A), (A), A., B), etc.
    const optionPattern =
        /(?:^|\s)(?:\(([A-D])\)|([A-D])[).])\s*/gi;

    const matches = [...raw.matchAll(optionPattern)];

    // At least two options are required to consider this an MCQ.
    if (matches.length < 2) return null;

    // Text before the first option is the question.
    let questionText = raw.slice(0, matches[0].index).trim();

    questionText = questionText.replace(
        /^(?:Q(?:uestion)?\s*)?\d{1,3}\s*[.)\-:]\s*/i,
        ""
    );

    const options = [];

    // Extract each option's text.
    matches.forEach((match, index) => {

        const label = (match[1] || match[2]).toUpperCase();

        const start = match.index + match[0].length;

        const end = matches[index + 1]
            ? matches[index + 1].index
            : raw.length;

        let optionText = raw.slice(start, end).trim();

        // Avoid capturing answer/explanation labels as part of an option.
        optionText = optionText.replace(
            /\b(?:Answer|Ans\.?|Correct answer|Explanation)\s*[:\-].*$/i,
            ""
        ).trim();

        if (optionText) {
            options.push({
                label: label,
                text: optionText
            });
        }

    });

    // Detect answers printed immediately after a question.
    const answerMatch = raw.match(
        /\b(?:Answer|Ans\.?|Correct answer)\s*[:\-]?\s*\(?([A-D])\)?\b/i
    );

    const answer = answerMatch
        ? answerMatch[1].toUpperCase()
        : null;

    const correctAnswer = options.find(
        option => option.label === answer
    );

    // Mark incomplete or uncertain detections for review.
    const reviewNotes = [];

    if (options.length !== 4) {
        reviewNotes.push("Check whether all four options were extracted.");
    }

    if (!answer) {
        reviewNotes.push("Correct answer was not detected.");
    }

    return {

        id: "q" + String(index + 1).padStart(3, "0"),

        question: questionText,

        options: options,

        correct_option: answer,

        correct_answer: correctAnswer
            ? correctAnswer.text
            : null,

        explanation: "",

        subject: document.getElementById("subject").value,

        chapter: document.getElementById("chapter").value,

        language: document.getElementById("language").value,

        exam: document.getElementById("exam").value,

        source: {
            file: selectedPDF.name,
            page: block.page
        },

        verification_status: reviewNotes.length
            ? "needs_review"
            : "unverified",

        review_notes: reviewNotes
    };
}

// ---------- Build the MCQ array ----------

function buildQuestions(pageRecords) {

    const blocks = splitQuestionBlocks(pageRecords);

    return blocks
        .map((block, index) => parseMCQ(block, index))
        .filter(Boolean);
}

// ---------- Render question cards ----------

// Create a label and editable input.
function createField(labelText, value, callback, multiline = false) {

    const label = document.createElement("label");

    label.textContent = labelText;

    const input = document.createElement(
        multiline ? "textarea" : "input"
    );

    if (!multiline) {
        input.type = "text";
    }

    input.value = value || "";

    input.addEventListener("input", () => callback(input.value));

    label.appendChild(input);

    return label;
}

// Draw all extracted questions.
function renderQuestions() {

    questionList.innerHTML = "";

    questionCount.textContent =
        questions.length + " questions";

    questions.forEach((question, index) => {

        const card = document.createElement("div");

        card.className = "question-card";

        const top = document.createElement("div");

        top.className = "question-top";

        const number = document.createElement("span");

        number.className = "question-number";

        number.textContent =
            "Question " + (index + 1) +
            " · Page " + (question.source.page || "—");

        const remove = document.createElement("button");

        remove.className = "remove-btn";

        remove.textContent = "Remove";

        remove.addEventListener("click", () => {

            questions.splice(index, 1);

            renderQuestions();

            refreshJSON();

        });

        top.append(number, remove);

        card.appendChild(top);

        // Question text.
        card.appendChild(
            createField(
                "Question",
                question.question,
                value => {
                    question.question = value;
                    refreshJSON();
                },
                true
            )
        );

        // Four answer options.
        ["A", "B", "C", "D"].forEach(label => {

            const option = question.options.find(
                item => item.label === label
            );

            card.appendChild(
                createField(
                    "Option " + label,
                    option ? option.text : "",
                    value => {

                        let target = question.options.find(
                            item => item.label === label
                        );

                        if (!target) {
                            target = {
                                label: label,
                                text: ""
                            };

                            question.options.push(target);
                        }

                        target.text = value;

                        refreshJSON();
                    }
                )
            );

        });

        // Correct answer fields.
        card.appendChild(
            createField(
                "Correct option (A/B/C/D)",
                question.correct_option,
                value => {
                    question.correct_option = value.toUpperCase();
                    refreshJSON();
                }
            )
        );

        card.appendChild(
            createField(
                "Explanation",
                question.explanation,
                value => {
                    question.explanation = value;
                    refreshJSON();
                },
                true
            )
        );

        // Admin verification checkbox.
        const verifyLabel = document.createElement("label");

        const verify = document.createElement("input");

        verify.type = "checkbox";

        verify.checked =
            question.verification_status === "verified";

        verify.addEventListener("change", () => {

            question.verification_status = verify.checked
                ? "verified"
                : "needs_review";

            question.review_notes = verify.checked
                ? []
                : ["Admin review required."];

            refreshJSON();

        });

        verifyLabel.append(
            verify,
            document.createTextNode(
                " I have manually checked this question and answer"
            )
        );

        card.appendChild(verifyLabel);

        questionList.appendChild(card);

    });

}

// ---------- Add a question manually ----------

document.getElementById("addQuestionBtn")
    .addEventListener("click", () => {

        questions.push({

            id: "manual_" + Date.now(),

            question: "",

            options: [
                { label: "A", text: "" },
                { label: "B", text: "" },
                { label: "C", text: "" },
                { label: "D", text: "" }
            ],

            correct_option: null,

            correct_answer: null,

            explanation: "",

            subject: document.getElementById("subject").value,

            chapter: document.getElementById("chapter").value,

            language: document.getElementById("language").value,

            exam: document.getElementById("exam").value,

            source: {
                file: selectedPDF ? selectedPDF.name : null,
                page: null
            },

            verification_status: "needs_review",

            review_notes: ["Manually added; verify before publishing."]

        });

        renderQuestions();

        refreshJSON();

    });

// ---------- Create structured JSON ----------

function createJSON() {

    const includeUncertain =
        document.getElementById("includeUncertain").checked;

    const exportedQuestions = questions
        .filter(question =>
            includeUncertain ||
            question.verification_status === "verified"
        )
        .map(question => {

            // Always export options in A, B, C, D order.
            const orderedOptions = ["A", "B", "C", "D"].map(label => {

                const found = question.options.find(
                    option => option.label === label
                );

                return {
                    label: label,
                    text: found ? found.text : ""
                };

            });

            const answerOption = orderedOptions.find(
                option => option.label === question.correct_option
            );

            return {

                id: question.id,

                question: question.question,

                options: orderedOptions,

                correct_option: question.correct_option,

                correct_answer: answerOption
                    ? answerOption.text
                    : question.correct_answer,

                explanation: question.explanation,

                subject: question.subject,

                chapter: question.chapter,

                language: question.language,

                exam: question.exam,

                source: question.source,

                verification_status: question.verification_status,

                review_notes: question.review_notes

            };

        });

    return {

        schema_version: "1.0",

        generated_at: new Date().toISOString(),

        content_type: "mcq",

        source_document: {
            file_name: selectedPDF ? selectedPDF.name : null,
            total_pages: totalPages || null
        },

        questions: exportedQuestions

    };

}

// ---------- Preview JSON ----------

function refreshJSON() {

    jsonPreview.textContent = JSON.stringify(
        createJSON(),
        null,
        2
    );

}

document.getElementById("previewBtn")
    .addEventListener("click", refreshJSON);

// ---------- Download JSON ----------

document.getElementById("downloadBtn")
    .addEventListener("click", () => {

        const data = JSON.stringify(createJSON(), null, 2);

        const blob = new Blob(
            [data],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        const filename = selectedPDF
            ? selectedPDF.name.replace(/\.pdf$/i, "")
            : "examshelf-questions";

        link.href = url;

        link.download = filename + "-mcq.json";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

    });

// ---------- Main extraction action ----------

extractBtn.addEventListener("click", async () => {

    if (!selectedPDF) return;

    extractBtn.disabled = true;

    try {

        updateProgress(0, "Starting PDF extraction...");

        const pages = await extractPDF();

        updateProgress(95, "Detecting MCQ questions...");

        questions = buildQuestions(pages);

        renderQuestions();

        refreshJSON();

        updateProgress(
            100,
            "Finished. Detected " + questions.length + " questions."
        );

        if (questions.length === 0) {
            alert(
                "No questions detected. Your PDF may use a different layout. Try OCR or add questions manually."
            );
        }

    } catch (error) {

        console.error(error);

        alert("PDF processing failed: " + error.message);

        updateProgress(0, "Extraction failed.");

    } finally {

        extractBtn.disabled = false;

    }

});

// ---------- Reset the converter ----------

document.getElementById("resetBtn")
    .addEventListener("click", () => {

        selectedPDF = null;

        questions = [];

        totalPages = 0;

        pdfInput.value = "";

        document.getElementById("fileInfo").textContent = "";

        extractBtn.disabled = true;

        progressBar.style.width = "0%";

        statusText.textContent = "Waiting for PDF...";

        renderQuestions();

        refreshJSON();

    });

// Initial empty JSON preview.
renderQuestions();

refreshJSON();
