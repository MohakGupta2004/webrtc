import { useEffect, useState } from "react"

export const Sender = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [pc, setPc] = useState<RTCPeerConnection | null>(null)
  const [remoteDescriptionSet, setRemoteDescriptionSet] = useState(false)
  const [pendingCandidates, setPendingCandidates] = useState<RTCIceCandidateInit[]>([])

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8080')
    setSocket(websocket)
    websocket.onopen = () => {
      websocket.send(JSON.stringify({ type: 'sender' }))
    }
  }, [])

  async function sendVideo() {
    if (!socket) return;

    const pc = new RTCPeerConnection()
    setPc(pc)

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }))
      }
    }

    pc.onnegotiationneeded = async () => {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket?.send(JSON.stringify({
        type: "create-offer",
        sdb: offer
      }))
    }

    socket.onmessage = async (event: MessageEvent<any>) => {
      const message = JSON.parse(event.data)

      if (message.type === "answer") {
        await pc.setRemoteDescription(message.sdb)
        setRemoteDescriptionSet(true)

        // flush candidates
        pendingCandidates.forEach(c => pc.addIceCandidate(c))
        setPendingCandidates([])
      }
      else if (message.type === "ice-candidate") {
        if (remoteDescriptionSet) {
          await pc.addIceCandidate(message.candidate)
        } else {
          setPendingCandidates(prev => [...prev, message.candidate])
        }
      }
    }

    // add local camera
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    const video = document.createElement("video")
    video.srcObject = stream
    video.autoplay = true
    video.playsInline = true
    document.body.appendChild(video)

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream)
    })
  }

  return (
    <div>
      <button onClick={sendVideo}>Send Video</button>
    </div>
  )
}

