const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ]
	}
});

app.use(cors());

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
	res.send('Running');
});

// standard Socket Code
io.on("connection", (socket) => {
	socket.emit("me", socket.id); //initiate the host id

	socket.on("disconnect", () => { //send the host id to server
		socket.broadcast.emit("callEnded")
	});

	socket.on("callUser", ({ userToCall, signalData, from, name }) => { //receiver recived the host id.
		io.to(userToCall).emit("callUser", { signal: signalData, from, name });
	});

	socket.on("answerCall", (data) => { //reciver recied the call and send acknowledge
		io.to(data.to).emit("callAccepted", data.signal)
	});
});


server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));