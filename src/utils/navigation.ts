/**
 * Navigation utilities for Revatix application
 * Handles smooth scrolling and navigation between sections
 */

/**
 * Scrolls to the hero section with smooth animation
 * @param delay - Delay in milliseconds before scrolling (default: 100ms)
 */
export const scrollToHeroSection = (delay: number = 100): void => {
  setTimeout(() => {
    const heroSection = document.getElementById('home');
    if (heroSection) {
      heroSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, delay);
};

/**
 * Scrolls to a specific section by ID
 * @param sectionId - The ID of the section to scroll to
 * @param delay - Delay in milliseconds before scrolling (default: 100ms)
 */
export const scrollToSection = (sectionId: string, delay: number = 100): void => {
  setTimeout(() => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, delay);
};

/**
 * Scrolls to the top of the page
 * @param delay - Delay in milliseconds before scrolling (default: 100ms)
 */
export const scrollToTop = (delay: number = 100): void => {
  setTimeout(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, delay);
};
