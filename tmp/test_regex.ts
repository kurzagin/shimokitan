const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
const testUrl = 'https://www.youtube.com/watch?v=jtpX8a8G3q0';
const match = testUrl.match(regex);
console.log('Match is: ', match ? match[1] : 'null');
