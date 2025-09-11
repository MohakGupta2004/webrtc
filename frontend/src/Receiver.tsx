import { useEffect } from "react"

export const Receiver = () => {
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080")
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "receiver" }))
    }

    const video = document.createElement("video")
    video.autoplay = true
    video.playsInline = true
    video.muted = true
    document.body.appendChild(video)

    const pc = new RTCPeerConnection()
    let remoteDescriptionSet = false
    let pendingCandidates: RTCIceCandidateInit[] = []

    pc.ontrack = (event) => {
      console.log("track received", event.streams)
      if (event.streams && event.streams[0]) {
        video.srcObject = event.streams[0]

        video.onloadedmetadata = () => {
          console.log("✅ Video metadata loaded, playing stream")
          video.play().catch(err => console.error("Video play error:", err))
        }
      }
    }

    socket.onmessage = async (event: MessageEvent<any>) => {
      const message = JSON.parse(event.data)

      if (message.type === "offer") {
        console.log("offer received")
        await pc.setRemoteDescription(message.sdb)
        remoteDescriptionSet = true

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        socket.send(JSON.stringify({
          type: "create-answer",
          sdb: answer,
        }))

        for (const c of pendingCandidates) {
          await pc.addIceCandidate(c)
        }
        pendingCandidates = []
      } else if (message.type === "ice-candidate") {
        if (remoteDescriptionSet) {
          await pc.addIceCandidate(message.candidate)
        } else {
          pendingCandidates.push(message.candidate)
        }
      }
    }
  }, [])

  return <div></div>
}

