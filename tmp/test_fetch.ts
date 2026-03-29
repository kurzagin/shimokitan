async function testFetch() {
    const url = 'https://img.youtube.com/vi/jtpX8a8G3q0/maxresdefault.jpg';
    try {
        const response = await fetch(url);
        console.log('Response Status:', response.status);
        console.log('Response OK:', response.ok);
        const buffer = await response.arrayBuffer();
        console.log('Buffer Length:', buffer.byteLength);
    } catch (e) {
        console.error('Fetch Error:', e);
    }
}
testFetch();
