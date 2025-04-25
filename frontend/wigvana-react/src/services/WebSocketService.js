class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(userId) {
    // In a real app, this would connect to your WebSocket server
    // For demo purposes, we'll simulate WebSocket behavior
    this.socket = {
      readyState: WebSocket.CONNECTING
    };

    // Simulate connection success after a short delay
    setTimeout(() => {
      this.socket.readyState = WebSocket.OPEN;
      this.emit('connection', { userId });
    }, 1000);
  }

  disconnect() {
    if (this.socket) {
      this.socket.readyState = WebSocket.CLOSED;
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  sendMessage(message) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      // Simulate sending message
      setTimeout(() => {
        this.emit('message', message);
      }, 100);
      return true;
    }
    return false;
  }

  // Simulate receiving a message
  simulateIncomingMessage(message) {
    this.emit('message', message);
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();
export default webSocketService; 