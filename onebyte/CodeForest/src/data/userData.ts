export interface UserProfile {
  id: string;
  nickname: string;
  email: string;
  joinDate: string;
  profileImage?: string;
  bio?: string;
  website?: string;
  location?: string;
  postCount: number;
  commentCount: number;
  level?: 1 | 2 | 3 | 4 | 5;
}

export interface UserPost {
  id: string;
  title: string;
  category: string;
  date: string;
  views: number;
  comments: number;
  likes: number;
}

export interface UserComment {
  id: string;
  postId: string;
  postTitle: string;
  content: string;
  date: string;
  likes: number;
}

export const currentUser: UserProfile = {
  id: 'current-user',
  nickname: '코드숲개발자',
  email: 'developer@codeforest.kr',
  joinDate: '2024.03.15',
  bio: '백엔드 개발자입니다. Java와 Spring Boot를 주로 사용합니다.',
  website: 'https://github.com/codeforest',
  location: '서울, 대한민국',
  postCount: 24,
  commentCount: 156,
  level: 3, // 🌳 숲지기
};

export const userPosts: UserPost[] = [
  {
    id: '1',
    title: 'React 18의 새로운 기능들',
    category: 'Web',
    date: '2024.12.28',
    views: 1234,
    comments: 45,
    likes: 89,
  },
  {
    id: '2',
    title: 'TypeScript 제네릭 완벽 가이드',
    category: 'Web',
    date: '2024.12.25',
    views: 2156,
    comments: 67,
    likes: 134,
  },
  {
    id: '3',
    title: 'SQL 성능 최적화 팁',
    category: 'Database',
    date: '2024.12.20',
    views: 987,
    comments: 32,
    likes: 56,
  },
  {
    id: '4',
    title: 'Docker Compose로 개발 환경 구축하기',
    category: 'DevOps',
    date: '2024.12.15',
    views: 1543,
    comments: 28,
    likes: 72,
  },
  {
    id: '5',
    title: 'Spring Boot 3.0 마이그레이션 가이드',
    category: 'Java',
    date: '2024.12.10',
    views: 2341,
    comments: 91,
    likes: 178,
  },
  {
    id: '6',
    title: 'REST API 설계 베스트 프랙티스',
    category: 'Web',
    date: '2024.12.05',
    views: 1876,
    comments: 54,
    likes: 112,
  },
  {
    id: '7',
    title: 'Git 브랜치 전략 - Git Flow vs Trunk Based',
    category: 'DevOps',
    date: '2024.11.30',
    views: 1432,
    comments: 43,
    likes: 87,
  },
  {
    id: '8',
    title: 'JPA N+1 문제 해결하기',
    category: 'Java',
    date: '2024.11.25',
    views: 2567,
    comments: 78,
    likes: 156,
  },
];

export const userComments: UserComment[] = [
  {
    id: 'c1',
    postId: '10',
    postTitle: 'Python 비동기 프로그래밍 입문',
    content: '정말 유용한 정보네요! asyncio를 처음 배울 때 이런 글이 있었으면 좋았을 텐데요. 특히 await와 async의 차이점 설명이 명확해서 좋았습니다.',
    date: '2024.12.29 14:32',
    likes: 12,
  },
  {
    id: 'c2',
    postId: '11',
    postTitle: 'Kubernetes 초보자 가이드',
    content: 'Pod와 Service의 관계에 대해 궁금한 점이 있는데, Service가 여러 Pod를 묶어서 로드밸런싱을 해주는 건가요?',
    date: '2024.12.28 16:45',
    likes: 8,
  },
  {
    id: 'c3',
    postId: '12',
    postTitle: 'MongoDB vs PostgreSQL 비교',
    content: 'NoSQL과 RDBMS 중 선택할 때 가장 중요한 기준은 데이터 구조의 유연성인 것 같아요. 프로젝트 초기에는 스키마가 자주 바뀌니까 MongoDB가 유리하지만, 안정화되면 PostgreSQL로 가는 것도 좋은 전략 같습니다.',
    date: '2024.12.27 11:20',
    likes: 23,
  },
  {
    id: 'c4',
    postId: '13',
    postTitle: 'CSS Flexbox vs Grid',
    content: 'Flexbox는 1차원 레이아웃, Grid는 2차원 레이아웃이라는 설명이 정말 명쾌하네요. 감사합니다!',
    date: '2024.12.26 09:15',
    likes: 15,
  },
  {
    id: 'c5',
    postId: '14',
    postTitle: 'Redis 캐싱 전략',
    content: 'Cache-Aside 패턴을 사용 중인데, TTL 설정을 너무 길게 하면 메모리 부족 문제가 생기더라고요. 적절한 TTL 값은 어떻게 결정하시나요?',
    date: '2024.12.25 13:40',
    likes: 19,
  },
  {
    id: 'c6',
    postId: '15',
    postTitle: 'JavaScript 클로저 이해하기',
    content: '클로저 개념이 항상 헷갈렸는데 예제가 정말 이해하기 쉽네요. 특히 실무에서 자주 사용하는 패턴들을 보여주셔서 좋았습니다.',
    date: '2024.12.24 17:22',
    likes: 11,
  },
  {
    id: 'c7',
    postId: '16',
    postTitle: 'CI/CD 파이프라인 구축하기',
    content: 'Jenkins vs GitHub Actions 중에 고민 중인데, 작은 프로젝트라면 GitHub Actions가 더 간편한 것 같아요. 설정도 쉽고 무료 티어도 충분하고요.',
    date: '2024.12.23 10:05',
    likes: 7,
  },
  {
    id: 'c8',
    postId: '17',
    postTitle: 'OAuth 2.0 인증 구현',
    content: 'Authorization Code Flow와 Implicit Flow의 차이점을 명확하게 설명해주셔서 감사합니다. 보안 측면에서 Authorization Code Flow가 더 안전하다는 점을 알게 됐네요.',
    date: '2024.12.22 15:50',
    likes: 16,
  },
  {
    id: 'c9',
    postId: '18',
    postTitle: 'Vue 3 Composition API',
    content: 'Options API에서 Composition API로 넘어가는 게 쉽지 않았는데, 이 글 덕분에 많은 도움이 됐습니다. setup() 함수 안에서 모든 로직을 관리하는 게 처음엔 낯설었지만 점점 익숙해지고 있어요.',
    date: '2024.12.21 12:30',
    likes: 14,
  },
  {
    id: 'c10',
    postId: '19',
    postTitle: 'Linux 서버 보안 설정',
    content: 'SSH 포트 변경과 fail2ban 설정은 기본 중의 기본이죠. 여기에 더해서 UFW 방화벽 설정도 추천드립니다!',
    date: '2024.12.20 08:45',
    likes: 21,
  },
];