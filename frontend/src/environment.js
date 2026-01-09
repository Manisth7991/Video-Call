
let IS_PROD = true; // true = deployed backend, false = localhost backend

const server = IS_PROD ? "https://video-call-5kgt.onrender.com" : "http://localhost:8000";

export default server;