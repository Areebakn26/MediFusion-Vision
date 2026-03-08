// EMERGENCY FIX - Run this in browser console (F12 → Console)
// This will immediately remove all blocking overlays and make page clickable

console.log('🚨 EMERGENCY FIX STARTING...');

// 1. Remove ALL fixed/absolute overlays
document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' || style.position === 'absolute') {
        const zIndex = parseInt(style.zIndex) || 0;
        const rect = el.getBoundingClientRect();
        
        // If covers screen and has backdrop or is transparent
        if ((rect.width > window.innerWidth * 0.3 || rect.height > window.innerHeight * 0.3) && zIndex > 5) {
            const bg = style.backgroundColor;
            const isTransparent = !bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)';
            const hasBackdrop = style.backdropFilter || style.webkitBackdropFilter;
            
            // Don't remove sidebar or unblock button
            const isSidebar = el.closest('aside');
            const isUnblockButton = el.textContent?.includes('FORCE UNBLOCK');
            
            if ((isTransparent || hasBackdrop) && !isSidebar && !isUnblockButton) {
                console.log('🗑️ REMOVING:', el.tagName, 'z-index:', zIndex);
                el.remove();
            }
        }
    }
});

// 2. Force enable pointer events on EVERYTHING
document.querySelectorAll('*').forEach(el => {
    el.style.pointerEvents = 'auto';
    el.style.setProperty('pointer-events', 'auto', 'important');
});

// 3. Force enable body and html
document.body.style.pointerEvents = 'auto';
document.body.style.setProperty('pointer-events', 'auto', 'important');
document.documentElement.style.pointerEvents = 'auto';

// 4. Force main content to be on top
document.querySelectorAll('main, [role="main"]').forEach(el => {
    el.style.zIndex = '100';
    el.style.position = 'relative';
    el.style.pointerEvents = 'auto';
});

// 5. Enable scrolling
document.documentElement.style.overflow = 'auto';
document.body.style.overflow = 'auto';

console.log('✅ EMERGENCY FIX COMPLETE! Page should now be clickable.');
console.log('Try clicking on the page now.');

