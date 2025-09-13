// frontend/src/peer.ts
import { v4 as uuidv4 } from 'uuid';

class PeerService {
  public peer: RTCPeerConnection | null = null;
  private socketId: string;

  constructor() {
    this.socketId = uuidv4();
    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478"
          ],
        }
      ]
    });
  }

  async getOffer() {
    if (this.peer) {
      const offer = await this.peer.createOffer();
      await this.peer.setLocalDescription(offer);
      return offer;
    }
  }

  async getAnswer(offer: RTCSessionDescriptionInit) {
    if (!this.peer) return;
    await this.peer.setRemoteDescription(offer);
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    return answer;
  }

  async setLocalDescription(ans: RTCSessionDescriptionInit) {
    if (!this.peer?.currentRemoteDescription) {
      await this.peer?.setRemoteDescription(ans);
    }
  }

  getSocketId() {
    return this.socketId;
  }
}

export default new PeerService();