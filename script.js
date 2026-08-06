'use strict';

// Variables

// Dom objects
const root = document.documentElement;
const consoleElement = document.getElementById('console');

// Functions
function initialize() {
    updateResolution();

    // add event handler
    if (window.visualViewport)
        window.visualViewport.addEventListener('resize', updateResolution);
    else
        window.addEventListener('resize', updateResolution);

    window.addEventListener('oientationchange', updateResolution);

}

// calculate resolution
function updateResolution() {
    const viewport = window.visualViewport ?? window;
    const width = viewport.width;
    const height = viewport.height;

    
    // check landscape
    let isLandscape = height < 700 && width / height >= 1.6;
    if (isLandscape) 
        consoleElement.classList.add('landscape');
    else
        consoleElement.classList.remove('landscape');
}

// Entry Point
initialize();