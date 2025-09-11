import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
let senderSocket: WebSocket | null = null
let receiverSocket: WebSocket | null = null
enum Type {
  Sender = "sender",
  Receiver = "receiver",
  CreateOffer = "create-offer",
  CreateAnswer = "create-answer",
  IceCandidate = "ice-candidate"
}
wss.on('connection', (socket) => {
  socket.on("message", (message: string) => {
    const data = JSON.parse(message)

    // if it's of type "sender"
    if (data.type == Type.Sender) {
      console.log("Sender connected")
      senderSocket = socket
    } else if (data.type == Type.Receiver) {
      console.log("Receiver connected")
      receiverSocket = socket
    } else if (data.type == Type.CreateOffer) {
      console.log("Creating offer")
      if (!receiverSocket) {
        return;
      }
      receiverSocket?.send(JSON.stringify({
        type: "offer",
        sdb: data.sdb
      }))
    } else if (data.type == Type.CreateAnswer) {
      console.log("Creating answer")
      if (!senderSocket) {
        console.log("No sender socket")
        return;
      }
      senderSocket?.send(JSON.stringify({
        type: "answer",
        sdb: data.sdb
      }))
    } else if (data.type == Type.IceCandidate) {
      if (socket == receiverSocket) {
        receiverSocket.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: data.candidate
        }))
      } else {
        senderSocket?.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: data.candidate
        }))
      }
    }

  })
  socket.on('close', () => {
    console.log("Socket disconnected")
  })
})
