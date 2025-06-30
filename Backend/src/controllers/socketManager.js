
import { Server } from 'socket.io';

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
    const io = new Server(server , {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            allowedHeaders: ['*'],
            credentials: true
        },
    });


    io.on('connection' , (socket) => { // socket is the user who is connecting to the server
        console.log("New user connected");

        socket.on('join-call' , (path) =>{ // path is the room name or room id
            if(connections[path] === undefined){
                connections[path] = []; // Create a new room if it doesn't exist
            }
            connections[path].push(socket.id);

            timeOnline[socket.id] =new Date(); // Store the time when the user joined

            for(let i = 0; i < connections[path].length; i++){ // Notify all users in the room about the new user joining
                io.to(connections[path][i]).emit('user-joined', socket.id , connections[path]);
            }

            if(messages[path] !== undefined){
                for(let i = 0; i < messages[path].length; i++){
                    io.to(socket.id).emit('chat-message', messages[path][i]['data'] , messages[path][i]['sender'] , messages[path][i]['socket-id-sender']);
                }
            }
        })


        socket.on('signal' , (toId,message) =>{ // toId is the id of the user to whom the signal is being sent and message is the signal data
            io.to(toId).emit('signal',socket.id, message);
        })


        socket.on('chat-message', (data , sender) => { // data is the message content and sender is the name of the user sending the message
            const [matchingRoom , found] = Object.entries(connections).reduce(([room , isFound] , [roomkey , roomvalue]) =>{ // Object.entries(connections) gives all the rooms and their users and we are checking if the socket.id is present in any of the rooms
                if(!isFound && roomvalue.includes(socket.id)){
                    return [roomkey , true];
                }
                return [room , isFound];
            } , ['', false]);
            if(found === true){
                if(messages[matchingRoom] === undefined){
                    messages[matchingRoom] = [];
                }
                messages[matchingRoom].push({
                    "data": data,
                    "sender": sender,
                    "socket-id-sender": socket.id
                });
                console.log("messages", matchingRoom, ":" , sender, ":", data);

                // Emit the message to all users in the room
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }
        });




        // ✅ ======= PRIVATE MESSAGE =======
        socket.on('private-message', ({ to, message, from }) => {
            io.to(to).emit('receive-private-message', {
                message,
                from,
                socketId: socket.id
            });
        });


        socket.on('disconnect', () => {
            var difftime = Math.abs(timeOnline[socket.id] - new Date());
            
            // Notify all users in the room about the user leaving
            var key;
            for(const [k,v] of JSON.parse(JSON.stringify(Object.entries(connections)))){ // JSON.parse(JSON.stringify(Object.entries(connections))) is used to create a deep copy of the connections object to avoid issues with modifying the object while iterating over it 
                for(let i = 0; i < v.length; i++){ // Check if the socket.id is present in the room
                // If the socket.id is found, notify all users in the room about the user leaving
                    if(v[i] === socket.id){
                        key = k;
                        for(let j = 0; j < connections[key].length; j++){ 
                        io.to(connections[key][j]).emit('user-left', socket.id, difftime);
                    }
                    var index = connections[key].indexOf(socket.id); // Find the index of the socket.id in the room and if it is found, remove it from the room
                    connections[key].splice(index, 1);

                    if(connections[key].length === 0){
                        delete connections[key];
                        // delete messages[key];
                    }
                }
            }
            }

        });
    })
    return io;
}
