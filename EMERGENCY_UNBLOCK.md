# Emergency Unblock Script

If your screen is not clickable, open browser console (F12) and run:

```javascript
// Remove stuck overlays
document.querySelectorAll('[class*="backdrop"], [class*="overlay"], [class*="modal"]').forEach(el => {
    if (window.getComputedStyle(el).position === 'fixed' && 
        parseInt(window.getComputedStyle(el).zIndex) > 30) {
        el.style.display = 'none';
        console.log('Removed:', el);
    }
});

// Remove pointer-events blocking
document.querySelectorAll('*').forEach(el => {
    if (window.getComputedStyle(el).pointerEvents === 'none') {
        el.style.pointerEvents = 'auto';
    }
});

// Force enable clicks
document.body.style.pointerEvents = 'auto';
document.body.style.userSelect = 'auto';

console.log('Unblock complete!');
```

Or simply refresh the page (Ctrl+R or F5).

