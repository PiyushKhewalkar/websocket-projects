import express from "express"
import WebSocket, {WebSocketServer} from "ws"

const app = express()

const httpServer = app.listen(8080, () => {
    console.log("App is listening on post 8080")
})

const wss = new WebSocketServer({server:httpServer})

wss.on("connection", function connection(socket){
    socket.on("error", (err) => console.error(err))

    socket.on('message', function message(data, isBinary){
        wss.clients.forEach( function each(client) {
            if (client.readyState === WebSocket.OPEN){
                socket.send(data, {binary: isBinary})
            }
        })
    })
})