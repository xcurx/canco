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

    constructor(url: string, private callbacks: SocketCallbacks) {
        this.conn = new WebSocket(url);
        this.conn.onopen = () => {
            this.callbacks.onOpen();
        }
    }

    sendMessage(type: string, data: any): void {
        const msg: Message = { type, data };
        this.conn.send(JSON.stringify(msg));
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