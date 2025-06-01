// public/js/theme.js
document.addEventListener('DOMContentLoaded', () => {
    const themeToggler = document.getElementById('theme-toggler');
    const htmlElement = document.documentElement; // Target <html> element
    const sunIcon = themeToggler ? themeToggler.querySelector('.theme-icon-sun') : null;
    const moonIcon = themeToggler ? themeToggler.querySelector('.theme-icon-moon') : null;

    // Function to update button icon based on current theme
    const updateButtonIcon = (theme) => {
        if (!sunIcon || !moonIcon) return; // Guard clause if icons aren't found

        if (theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'inline';
        } else {
            sunIcon.style.display = 'inline';
            moonIcon.style.display = 'none';
        }
    };

    // Initialize button icon based on the theme set by the inline script
    // The inline script already set the class on <html>
    const initialTheme = htmlElement.classList.contains('dark-mode') ? 'dark' : 'light';
    updateButtonIcon(initialTheme);

    if (themeToggler) {
        themeToggler.addEventListener('click', () => {
            const isDarkMode = htmlElement.classList.toggle('dark-mode');
            const newTheme = isDarkMode ? 'dark' : 'light';
            
            localStorage.setItem('theme', newTheme); // Save user's preference
            updateButtonIcon(newTheme);
        });
    }

    // Optional: Listen for OS theme changes if no explicit user preference is set
    // This might be redundant if the inline script already handles it, but can be a fallback
    // or for dynamic updates if the user clears localStorage.
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            // Only react if no theme is explicitly saved in localStorage
            if (!localStorage.getItem('theme')) {
                const newOsTheme = event.matches ? 'dark' : 'light';
                if (newOsTheme === 'dark') {
                    htmlElement.classList.add('dark-mode');
                } else {
                    htmlElement.classList.remove('dark-mode');
                }
                updateButtonIcon(newOsTheme);
            }
        });
    }
});