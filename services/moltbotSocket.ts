import { GatewayStatus } from "../types";

type MessageCallback = (data: any) => void;
type StatusCallback = (status: GatewayStatus) => void;

class MoltbotSocketService {
  private ws: WebSocket | null = null;
  private messageListeners: Set<MessageCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private status: GatewayStatus = GatewayStatus.DISCONNECTED;
  
  // Reconnection State
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts: number = 0;
  private isExplicitlyDisconnected: boolean = false;
  
  private readonly MAX_RECONNECT_ATTEMPTS = 30; // Allow persistent retries for ~15 mins
  private readonly BASE_RECONNECT_DELAY = 1000; // 1 second start
  private readonly MAX_RECONNECT_DELAY = 30000; // 30 seconds max
  
  // Initialize from localStorage if available, otherwise default to localhost
  private url: string = (typeof window !== 'undefined' ? localStorage.getItem('raven_gateway_url') : null) || 'ws://127.0.0.1:18789';
  private token: string = (typeof window !== 'undefined' ? localStorage.getItem('raven_gateway_token') : null) || '';

  constructor() {}

  public connect(url?: string, token?: string) {
    if (url) {
        this.url = url;
        // Persist the new URL
        if (typeof window !== 'undefined') {
            localStorage.setItem('raven_gateway_url', url);
        }
    }

    if (token !== undefined) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('raven_gateway_token', token);
        }
    }

    // Reset explicit disconnect flag since we are trying to connect
    this.isExplicitlyDisconnected = false;

    // Clean up any existing socket or pending timers
    this.cleanupOldConnection();

    this.updateStatus(GatewayStatus.CONNECTING);

    try {
      // Construct URL with token query parameter if token exists
      // This ensures authentication happens during the connection handshake
      let connectionUrl = this.url;
      if (this.token) {
        try {
            const urlObj = new URL(this.url);
            urlObj.searchParams.append('token', this.token);
            connectionUrl = urlObj.toString();
        } catch (e) {
            // Fallback for simple string concatenation if URL parsing fails
            const separator = connectionUrl.includes('?') ? '&' : '?';
            connectionUrl = `${connectionUrl}${separator}token=${encodeURIComponent(this.token)}`;
        }
      }

      this.ws = new WebSocket(connectionUrl);

      this.ws.onopen = () => {
        console.log('[MoltbotSocket] Connected');
        this.updateStatus(GatewayStatus.CONNECTED);
        this.reconnectAttempts = 0; // Reset attempts on successful connection

        // Send Identify packet as well to ensure session context is established
        if (this.token) {
            this.sendMessage({
                type: 'identify',
                token: this.token
            });
        }
      };

      this.ws.onclose = (event) => {
        // If we deliberately disconnected, don't trigger reconnect logic
        if (this.isExplicitlyDisconnected) {
             console.log('[MoltbotSocket] Disconnected by user');
             this.updateStatus(GatewayStatus.DISCONNECTED);
             this.ws = null;
             return;
        }

        console.log('[MoltbotSocket] Disconnected unexpectedly', event.code, event.reason);
        this.updateStatus(GatewayStatus.DISCONNECTED);
        this.ws = null;
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[MoltbotSocket] Error', error);
        // We don't change status to ERROR permanently here, as onclose will typically follow 
        // and handle the flow, or we retry.
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyMessageListeners(data);
        } catch (e) {
          this.notifyMessageListeners({ type: 'text', content: event.data });
        }
      };

    } catch (e) {
      console.error('[MoltbotSocket] Connection instantiation failed', e);
      this.updateStatus(GatewayStatus.ERROR);
      if (!this.isExplicitlyDisconnected) {
          this.handleReconnect();
      }
    }
  }

  public disconnect() {
    this.isExplicitlyDisconnected = true;
    this.cleanupOldConnection();
    this.updateStatus(GatewayStatus.DISCONNECTED);
  }

  private cleanupOldConnection() {
    // Clear pending reconnects
    if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
    }

    // Detach listeners and close existing socket
    if (this.ws) {
        this.ws.onopen = null;
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        this.ws.close();
        this.ws = null;
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
        console.warn('[MoltbotSocket] Max reconnect attempts reached. Manual intervention required.');
        this.updateStatus(GatewayStatus.ERROR);
        return;
    }

    // Exponential backoff
    let delay = Math.min(
        this.BASE_RECONNECT_DELAY * Math.pow(1.5, this.reconnectAttempts),
        this.MAX_RECONNECT_DELAY
    );

    // Add Jitter (+/- 20%) to prevent thundering herd if multiple clients reconnect
    const jitter = delay * (0.4 * Math.random() - 0.2);
    delay = Math.floor(delay + jitter);

    console.log(`[MoltbotSocket] Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);

    this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect(); 
    }, delay);
  }

  public sendMessage(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
      this.ws.send(message);
    } else {
      console.warn('[MoltbotSocket] Cannot send message: Socket not open');
    }
  }

  public onMessage(callback: MessageCallback) {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  public onStatusChange(callback: StatusCallback) {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  public getStatus() {
    return this.status;
  }
  
  public getUrl() {
    return this.url;
  }
  
  public getToken() {
      return this.token;
  }

  private updateStatus(newStatus: GatewayStatus) {
    this.status = newStatus;
    this.notifyStatusListeners(newStatus);
  }

  private notifyMessageListeners(data: any) {
    this.messageListeners.forEach(listener => listener(data));
  }

  private notifyStatusListeners(status: GatewayStatus) {
    this.statusListeners.forEach(listener => listener(status));
  }
}

export const moltbotSocket = new MoltbotSocketService();