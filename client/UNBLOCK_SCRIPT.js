// EMERGENCY UNBLOCK SCRIPT - Run this in browser console (F12)
// Copy and paste this entire script into the console and press Enter

console.log('🚨 EMERGENCY UNBLOCK SCRIPT STARTING...');

// 1. Force enable scrolling
document.documentElement.style.overflow = 'auto';
document.documentElement.style.overflowX = 'hidden';
document.body.style.overflow = 'auto';
document.body.style.overflowX = 'hidden';
document.body.style.height = 'auto';
document.body.style.minHeight = '100vh';

// 2. Find all fixed/absolute elements
const allFixed = [];
document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' || style.position === 'absolute') {
        const rect = el.getBoundingClientRect();
        allFixed.push({
            element: el,
            tag: el.tagName,
            classes: Array.from(el.classList),
            zIndex: parseInt(style.zIndex) || 0,
            width: rect.width,
            height: rect.height,
            bg: style.backgroundColor,
            pointerEvents: style.pointerEvents,
            overflow: style.overflow
        });
    }
});

console.log('🔍 Found fixed/absolute elements:', allFixed);

// 3. Remove all blocking overlays
allFixed.forEach(({ element: el, zIndex, width, height }) => {
    if (el.textContent && el.textContent.includes('FORCE UNBLOCK')) {
        console.log('⏭️ Skipping unblock button');
        return;
    }
    
    if (zIndex > 20 || width > window.innerWidth * 0.2 || height > window.innerHeight * 0.2) {
        console.log('🗑️ REMOVING:', el.tagName, 'z-index:', zIndex, 'size:', `${width}x${height}`);
        el.style.display = 'none';
        el.remove();
    }
});

// 4. Force enable pointer events on everything
document.querySelectorAll('*').forEach(el => {
    el.style.pointerEvents = 'auto';
    el.style.setProperty('pointer-events', 'auto', 'important');
});

document.body.style.pointerEvents = 'auto';
document.documentElement.style.pointerEvents = 'auto';

// 5. Remove overflow-hidden from all containers
document.querySelectorAll('div').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.overflow === 'hidden' && el !== document.body && el !== document.documentElement) {
        el.style.overflow = 'auto';
        console.log('🔓 Enabled overflow on:', el);
    }
});

console.log('✅ UNBLOCK COMPLETE! Page should now be clickable and scrollable.');
console.log('If still not working, check the elements listed above.');

