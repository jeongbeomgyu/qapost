export interface ChatRoom {
  id: string;
  userId: string;
  userName: string;
  postId?: string; // Context-based chat room per post
  postTitle?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  sender: 'me' | 'other';
  text: string;
  time: string;
}

export const chatRooms: ChatRoom[] = [
  {
    id: '1',
    userId: 'user1',
    userName: '김개발',
    postId: '1',
    postTitle: 'React 18의 새로운 기능들',
    lastMessage: 'React 18 관련해서 질문 드려도 될까요?',
    lastMessageTime: '오후 2:34',
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: '2',
    userId: 'user2',
    userName: '박코딩',
    postId: '2',
    postTitle: 'TypeScript 제네릭 완벽 가이드',
    lastMessage: '감사합니다! 덕분에 해결했어요',
    lastMessageTime: '오후 1:15',
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: '3',
    userId: 'user3',
    userName: '이자바',
    postId: '1',
    postTitle: 'React 18의 새로운 기능들',
    lastMessage: '네 알겠습니다',
    lastMessageTime: '오전 11:22',
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: '4',
    userId: 'user4',
    userName: '최디비',
    postId: '3',
    postTitle: 'SQL 성능 최적화 팁',
    lastMessage: 'SQL 쿼리 최적화 관련 글 잘 봤습니다',
    lastMessageTime: '어제',
    unreadCount: 1,
    isOnline: false,
  },
  {
    id: '5',
    userId: 'user5',
    userName: '정프론트',
    postId: '5',
    postTitle: 'CSS Grid 완벽 가이드',
    lastMessage: 'CSS Grid 예제 감사합니다',
    lastMessageTime: '12/28',
    unreadCount: 0,
    isOnline: true,
  },
];

export const chatMessages: ChatMessage[] = [
  {
    id: '1',
    chatRoomId: '1',
    sender: 'other',
    text: '안녕하세요!',
    time: '14:30',
  },
  {
    id: '2',
    chatRoomId: '1',
    sender: 'other',
    text: 'React 18 관련해서 질문 드려도 될까요?',
    time: '14:34',
  },
  {
    id: '3',
    chatRoomId: '1',
    sender: 'me',
    text: '네, 물론이죠. 무엇이 궁금하신가요?',
    time: '14:35',
  },
  {
    id: '4',
    chatRoomId: '2',
    sender: 'other',
    text: '글 내용 덕분에 문제를 해결했습니다',
    time: '13:10',
  },
  {
    id: '5',
    chatRoomId: '2',
    sender: 'me',
    text: '도움이 되었다니 다행입니다!',
    time: '13:12',
  },
  {
    id: '6',
    chatRoomId: '2',
    sender: 'other',
    text: '감사합니다! 덕분에 해결했어요',
    time: '13:15',
  },
];