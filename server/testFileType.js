try {
    const fileType = require('file-type');
    console.log('file-type required successfully:', typeof fileType);
    console.log('Keys:', Object.keys(fileType));
} catch (err) {
    console.error('Error requiring file-type:', err.message);
    if (err.code === 'ERR_REQUIRE_ESM') {
        console.log('Confirmed: file-type is ESM-only.');
    }
}
