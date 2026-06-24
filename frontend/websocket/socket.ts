export interface Message {
    type: string;
    data: any;
}

interface SocketCallbacks {
    onOpen: () => void;
    onClose?: () => void;
    onError?: (error: Event) => void;
    onMessage: (msg: Message) => void;
}

export class Socket {
    public conn: WebSocket;
    private messageQueue: Message[] = [];

    constructor(url: string, private callbacks: SocketCallbacks) {
        this.conn = new WebSocket(url);
        this.conn.onopen = () => {
            this.callbacks.onOpen();
            this.flushQueue();
        }
    }

    private flushQueue(): void {
        while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            if (msg) {
                this.conn.send(JSON.stringify(msg));
            }
        }
    }

    sendMessage(type: string, data: any): void {
        const msg: Message = { type, data };
        if (this.conn.readyState === WebSocket.OPEN) {
            this.conn.send(JSON.stringify(msg));
        } else if (this.conn.readyState === WebSocket.CONNECTING) {
            this.messageQueue.push(msg);
        } else {
            console.warn("WebSocket is closed. Cannot send message.");
        }
    }

    onMessage(): void {
        this.conn.onmessage = (event) => {
            console.log('WebSocket message received:', event.data);
            const msg: Message = JSON.parse(event.data);
            this.callbacks.onMessage(msg);
        }
    }

    close(): void {
        if (this.callbacks.onClose) {
            this.callbacks.onClose();
        }
        this.conn.close();
    }
}