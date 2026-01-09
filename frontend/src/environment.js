
let IS_PROD = false; // Changed to false for local testing

const server = IS_PROD ? "https://video-call-5kgt.onrender.com" : "http://localhost:8000";

export default server;