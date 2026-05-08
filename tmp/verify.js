try {
    require('../src/app.js');
    console.log('All modules loaded successfully');
} catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
}
