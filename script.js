

/* =========================================================
   PROJECT NAME: MY WEBSITE
   FILE NAME: script.js
   LANGUAGE: JavaScript

   PURPOSE:
   This file controls website functionality and interactions.

   JAVASCRIPT CAN:
   1. Handle button clicks.
   2. Validate forms.
   3. Change HTML content.
   4. Open and close navigation menus.
   5. Respond to user actions.
   6. Control interactive website elements.

   HOW TO USE:
   1. Create a file named script.js.
   2. Connect it to index.html.
   3. Write JavaScript code inside this file.

   ========================================================= */


/* =========================================================
   01. SELECT HTML ELEMENTS
   Finds HTML elements so JavaScript can control them.
   ========================================================= */

// Selects the mobile menu button using its ID
const menuToggle = document.getElementById("menuToggle");

// Selects the navigation menu
const navLinks = document.getElementById("navLinks");

// Selects the contact form
const contactForm = document.getElementById("contactForm");

// Selects the form status message element
const formStatus = document.getElementById("formStatus");



/* =========================================================
   02. MOBILE NAVIGATION MENU
   Opens and closes the mobile navigation menu.
   ========================================================= */

// Checks whether both menu elements exist
if (menuToggle && navLinks) {

    // Adds a click event to the menu button
    menuToggle.addEventListener("click", function () {

        // Toggles the active class on the navigation menu
        const isOpen = navLinks.classList.toggle("active");

        // Updates accessibility information
        menuToggle.setAttribute("aria-expanded", String(isOpen));

        // Changes the button icon
        menuToggle.textContent = isOpen ? "✕" : "☰";

        // Updates the accessible button description
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );

    });

}



/* =========================================================
   03. CLOSE MENU AFTER CLICKING A NAVIGATION LINK
   Automatically closes the mobile menu after navigation.
   ========================================================= */

if (navLinks && menuToggle) {

    // Selects every link inside the navigation menu
    const navigationItems = navLinks.querySelectorAll("a");

    // Adds a click event to each navigation link
    navigationItems.forEach(function (link) {

        link.addEventListener("click", function () {

            // Removes the active class
            navLinks.classList.remove("active");

            // Resets the menu button accessibility state
            menuToggle.setAttribute("aria-expanded", "false");

            // Restores the menu icon
            menuToggle.textContent = "☰";

            // Restores the accessible button description
            menuToggle.setAttribute(
                "aria-label",
                "Open navigation menu"
            );

        });

    });

}



/* =========================================================
   04. CONTACT FORM VALIDATION
   Checks the information entered by the visitor.
   ========================================================= */

if (contactForm && formStatus) {

    // Listens for contact form submission
    contactForm.addEventListener("submit", function (event) {

        // Prevents the browser from refreshing the page
        event.preventDefault();


        // Gets the visitor's name
        const name = document.getElementById("name").value.trim();

        // Gets the visitor's email
        const email = document.getElementById("email").value.trim();

        // Gets the visitor's message
        const message = document.getElementById("message").value.trim();


        // Checks whether any field is empty
        if (name === "" || email === "" || message === "") {

            // Displays an error message
            formStatus.textContent =
                "Please fill in all the required fields.";

            // Stops the remaining code
            return;

        }


        // Checks the email format using the browser's email validation
        const emailInput = document.getElementById("email");

        if (!emailInput.validity.valid) {

            formStatus.textContent =
                "Please enter a valid email address.";

            return;

        }


        // Displays a success message
        formStatus.textContent =
            "Thank you, " + name +
            "! Your form has been validated successfully.";


        // Clears all form fields
        contactForm.reset();

    });

}



/* =========================================================
   05. CONSOLE MESSAGE
   Displays a message in the browser developer console.
   Useful for checking whether JavaScript is running.
   ========================================================= */

// Prints a message in the browser console
console.log("My Website JavaScript is running successfully.");



/* =========================================================
   END OF SCRIPT.JS

   HTML = Structure
   CSS = Design
   JavaScript = Functionality

   ========================================================= */
