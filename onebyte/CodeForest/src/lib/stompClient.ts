import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE, getChatAccessToken } from "../api/http";
import type { ChatMessageResponse } from "../api/chatApi";

export type ChatPublishRequest = {
  roomId: number;
  content: string;
};

/**
 * ⚠️ SockJS endpoint는 백엔드 설정에 따라 다를 수 있습니다.
 * - 흔한 값: "/ws-stomp", "/ws", "/stomp"
 * - 지금은 기본을 "/ws-stomp"로 두고, 필요하면 여기만 바꾸면 됩니다.
 */
export const DEFAULT_SOCKJS_PATH = "/ws-stomp";

export function createChatStompClient(params: {
  roomId: number;
  onMessage: (msg: ChatMessageResponse) => void;
  sockJsPath?: string;
}) {
  const token = getChatAccessToken();

  const client = new Client({
    // SockJS 사용 (brokerURL 대신 webSocketFactory)
    webSocketFactory: () => new SockJS(`${API_BASE}${params.sockJsPath ?? DEFAULT_SOCKJS_PATH}`),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    debug: () => {
      // noisy logs off
    },
    reconnectDelay: 3000, // 기본 재연결
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });

  client.onConnect = () => {
    client.subscribe(`/sub/chat/room/${params.roomId}`, (frame: IMessage) => {
      try {
        const raw = JSON.parse(frame.body);
        params.onMessage(raw as ChatMessageResponse);
      } catch {
        // ignore
      }
    });
  };

  return client;
}

export function publishChatMessage(client: Client, payload: ChatPublishRequest) {
  client.publish({
    destination: "/pub/chat/message",
    body: JSON.stringify(payload),
  });
}


