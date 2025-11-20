🎥 Video Call App

A Zoom-inspired real-time video calling platform built using the MERN stack + WebRTC, allowing users to create or join meetings, enable/disable audio/video, share screens, chat in real time, and enjoy smooth peer-to-peer communication.

🚀 Live Demo

👉 Live Site: [Add your live link here](https://video-call-frontend-91ty.onrender.com)

✨ Features

🔐 User Authentication (Signup & Login)

🎦 Real-time Video & Audio Calling with WebRTC

🧑‍🤝‍🧑 Join Meeting Using Code + Display Name

🖥️ Screen Sharing

💬 Real-time Chat Messaging

🎤 Toggle Microphone

🎥 Toggle Camera

🔚 End Call with Auto Disconnect

📱 Fully Responsive UI Design

⚡ Low-latency peer-to-peer streaming

🌐 Deployed on Render

🛠️ Tech Stack
🧰 Backend

Node.js

Express.js

MongoDB & Mongoose

🎨 Frontend

React.js

HTML, CSS

WebRTC & PeerJS

Socket.IO Client

📦 Other Libraries & Tools

Socket.IO – Real-time signaling

JWT / Bcrypt – Authentication

UUID – Meet code generation

TailwindCSS / Custom CSS

⚙️ Installation & Setup
# Clone the repository
git clone https://github.com/your-username/video-call-app.git
cd video-call-app

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Create environment file
touch .env

Add environment variables inside .env:
MONGO_URI=your_mongo_database_url
JWT_SECRET=your_secret_key
PORT=5000

📁 Folder Structure
video-call-app/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
│
└── README.md
