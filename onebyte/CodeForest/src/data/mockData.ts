// =======================
// 1) 공용 타입 (백엔드와 맞추기 쉬운 형태)
// =======================
export interface CategoryTreeItem {
  id: string; // groupId or categoryId (지금은 cat1/sub1 같은 mock)
  name: string;
  order: number;
  isActive: boolean;
  parentId?: string; // 소분류면 상위 카테고리 id
  children: CategoryTreeItem[]; // 소분류도 동일 구조로 통일
}

// 헤더/유저 페이지에서 쓰기 쉬운 형태(기존 UI 유지용)
export interface Category {
  id: string;
  name: string;
  isActive: boolean;
  subcategories?: { id: string; name: string; isActive: boolean }[];
}

// =======================
// 2) 게시글/댓글/유저 타입 (기존 유지)
// =======================
export interface Post {
  id: string;
  category: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  date: string;
  commentCount: number;
  views: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  authorId: string;
  content: string;
  date: string;
}

export interface User {
  id: string;
  email: string;
  nickname: string;
  status: "active" | "blocked" | "withdrawn";
  joinedDate: string;
  level?: 1 | 2 | 3 | 4 | 5; // 🌱 새싹, 🌿 묘목, 🌳 숲지기, 🛡️ 숲의 수호자, ✨ 숲의 정령
}

// =======================
// 3) ✅ 통일된 카테고리 트리 데이터 (관리자/헤더 공용)
//    - 나중에 백엔드에서 그대로 내려오게 만들면 됨
// =======================
export const categoryTree: CategoryTreeItem[] = [
  {
    id: "cat1",
    name: "Java",
    order: 1,
    isActive: true,
    children: [
      { id: "sub1", parentId: "cat1", name: "Java 기초", order: 1, isActive: true, children: [] },
      { id: "sub2", parentId: "cat1", name: "Spring Framework", order: 2, isActive: true, children: [] },
      { id: "sub3", parentId: "cat1", name: "JPA/Hibernate", order: 3, isActive: false, children: [] },
    ],
  },
  {
    id: "cat2",
    name: "Python",
    order: 2,
    isActive: true,
    children: [
      { id: "sub4", parentId: "cat2", name: "Python 기초", order: 1, isActive: true, children: [] },
      { id: "sub5", parentId: "cat2", name: "Django", order: 2, isActive: true, children: [] },
      { id: "sub6", parentId: "cat2", name: "머신러닝", order: 3, isActive: true, children: [] },
    ],
  },
  {
    id: "cat3",
    name: "Web",
    order: 3,
    isActive: true,
    children: [
      { id: "sub7", parentId: "cat3", name: "HTML/CSS", order: 1, isActive: true, children: [] },
      { id: "sub8", parentId: "cat3", name: "JavaScript", order: 2, isActive: true, children: [] },
      { id: "sub9", parentId: "cat3", name: "React", order: 3, isActive: true, children: [] },
      { id: "sub10", parentId: "cat3", name: "Vue.js", order: 4, isActive: false, children: [] },
    ],
  },
  {
    id: "cat4",
    name: "Database",
    order: 4,
    isActive: true,
    children: [
      { id: "sub11", parentId: "cat4", name: "MySQL", order: 1, isActive: true, children: [] },
      { id: "sub12", parentId: "cat4", name: "PostgreSQL", order: 2, isActive: true, children: [] },
      { id: "sub13", parentId: "cat4", name: "MongoDB", order: 3, isActive: true, children: [] },
    ],
  },
  {
    id: "cat5",
    name: "DevOps",
    order: 5,
    isActive: false,
    children: [
      { id: "sub14", parentId: "cat5", name: "Docker", order: 1, isActive: true, children: [] },
      { id: "sub15", parentId: "cat5", name: "Kubernetes", order: 2, isActive: true, children: [] },
      { id: "sub16", parentId: "cat5", name: "CI/CD", order: 3, isActive: false, children: [] },
    ],
  },
  {
    id: "cat6",
    name: "CS",
    order: 6,
    isActive: true,
    children: [
      { id: "sub17", parentId: "cat6", name: "알고리즘", order: 1, isActive: true, children: [] },
      { id: "sub18", parentId: "cat6", name: "자료구조", order: 2, isActive: true, children: [] },
      { id: "sub19", parentId: "cat6", name: "네트워크", order: 3, isActive: false, children: [] },
    ],
  },
  {
    id: "cat7",
    name: "자유게시판",
    order: 7,
    isActive: true,
    children: [
      { id: "sub20", parentId: "cat7", name: "자유주제", order: 1, isActive: true, children: [] },
      { id: "sub21", parentId: "cat7", name: "커리어", order: 2, isActive: true, children: [] },
      { id: "sub22", parentId: "cat7", name: "Q&A", order: 3, isActive: true, children: [] },
    ],
  },
];

// ✅ 관리자 화면에서 쓰던 이름 유지용(alias)
export const adminCategories = categoryTree;

// ✅ 관리자 화면 타입 (기존 코드 호환)
export type AdminCategory = CategoryTreeItem;
export type AdminSubCategory = CategoryTreeItem;

// ✅ 헤더(유저 화면)에서 쓰기 편한 변환 함수
export function getPublicCategories(): Category[] {
  return [...categoryTree]
    .sort((a, b) => a.order - b.order)
    .filter((c) => c.isActive)
    .map((c) => ({
      id: c.id,
      name: c.name,
      isActive: c.isActive,
      subcategories: c.children
        .slice()
        .sort((a, b) => a.order - b.order)
        .filter((s) => s.isActive)
        .map((s) => ({ id: s.id, name: s.name, isActive: s.isActive })),
    }));
}

// ✅ 모든 카테고리 (활성/비활성 포함) - 게시글 작성 등에서 사용
export const categories: Category[] = categoryTree.map((c) => ({
  id: c.id,
  name: c.name,
  isActive: c.isActive,
  subcategories: c.children.map((s) => ({ 
    id: s.id, 
    name: s.name, 
    isActive: s.isActive 
  })),
}));

// =======================
// 4) 기존 posts/comments/users (그대로 유지)
// =======================
export const posts: Post[] = [
  {
    id: "1",
    category: "Java",
    title: "Spring Boot 3.0 마이그레이션 후기",
    content:
      "안녕하세요. 최근 프로젝트를 Spring Boot 3.0으로 마이그레이션했습니다.\n\n주요 변경사항:\n1. Java 17 필수\n2. Jakarta EE 9+ 사용\n3. 의존성 버전 업데이트\n\n특히 javax에서 jakarta로 패키지명이 변경되어 많은 import 문을 수정해야 했습니다. 하지만 성능과 보안이 크게 개선되어 만족스럽습니다.",
    author: "김개발",
    authorId: "user1",
    date: "2024-12-30",
    commentCount: 12,
    views: 234,
  },
  {
    id: "2",
    category: "React",
    title: "React 19 새로운 기능 정리",
    content: "React 19에서 추가된 새로운 기능들을 정리해봤습니다...",
    author: "이프론트",
    authorId: "user2",
    date: "2024-12-29",
    commentCount: 8,
    views: 156,
  },
  {
    id: "3",
    category: "Docker",
    title: "Docker Compose로 개발 환경 구축하기",
    content: "Docker Compose를 활용한 로컬 개발 환경 세팅 방법을 공유합니다...",
    author: "박데브옵스",
    authorId: "user3",
    date: "2024-12-28",
    commentCount: 5,
    views: 89,
  },
  {
    id: "4",
    category: "Python",
    title: "FastAPI vs Django 성능 비교",
    content: "FastAPI와 Django의 성능을 벤치마크 테스트로 비교해봤습니다...",
    author: "최파이썬",
    authorId: "user4",
    date: "2024-12-27",
    commentCount: 15,
    views: 312,
  },
  {
    id: "5",
    category: "알고리즘",
    title: "코딩테스트 효율적으로 준비하는 법",
    content: "코딩테스트를 준비하면서 느낀 효율적인 학습 방법을 공유합니다...",
    author: "정알고",
    authorId: "user5",
    date: "2024-12-26",
    commentCount: 23,
    views: 445,
  },
  {
    id: "6",
    category: "MySQL",
    title: "인덱스 최적화 전략",
    content: "MySQL 인덱스를 효율적으로 설계하는 방법에 대해 알아봅니다...",
    author: "강디비",
    authorId: "user6",
    date: "2024-12-25",
    commentCount: 7,
    views: 178,
  },
  {
    id: "7",
    category: "JavaScript",
    title: "async/await vs Promise 언제 써야 할까?",
    content: "비동기 처리 패턴에 대한 고민을 나눠봅니다...",
    author: "윤자스",
    authorId: "user7",
    date: "2024-12-24",
    commentCount: 18,
    views: 267,
  },
  {
    id: "8",
    category: "커리어",
    title: "주니어 개발자 1년 회고",
    content: "주니어 개발자로 1년간 일하면서 배운 점들을 정리했습니다...",
    author: "신주니어",
    authorId: "user8",
    date: "2024-12-23",
    commentCount: 31,
    views: 523,
  },
];

export const comments: Comment[] = [
  {
    id: "c1",
    postId: "1",
    author: "이댓글",
    authorId: "user9",
    content: "좋은 정보 감사합니다! 저희도 곧 마이그레이션 계획 중인데 참고하겠습니다.",
    date: "2024-12-30 10:30",
  },
  {
    id: "c2",
    postId: "1",
    author: "박리뷰",
    authorId: "user10",
    content: "jakarta 패키지 변경은 정말 번거롭더라구요. 자동화 스크립트 작성하셨나요?",
    date: "2024-12-30 11:15",
  },
  {
    id: "c3",
    postId: "1",
    author: "최질문",
    authorId: "user11",
    content: "성능 개선 수치를 공유해주실 수 있을까요?",
    date: "2024-12-30 14:20",
  },
];

export const users: User[] = [
  { id: "user1", email: "kim@example.com", nickname: "김개발", status: "active", joinedDate: "2024-01-15" },
  { id: "user2", email: "lee@example.com", nickname: "이프론트", status: "active", joinedDate: "2024-02-20" },
  { id: "user3", email: "park@example.com", nickname: "박데브옵스", status: "active", joinedDate: "2024-03-10" },
  { id: "user4", email: "choi@example.com", nickname: "최파이썬", status: "blocked", joinedDate: "2024-04-05" },
  { id: "user5", email: "jung@example.com", nickname: "정알고", status: "active", joinedDate: "2024-05-12" },
  { id: "user6", email: "kang@example.com", nickname: "강디비", status: "active", joinedDate: "2024-06-18" },
  { id: "user7", email: "yoon@example.com", nickname: "윤자스", status: "withdrawn", joinedDate: "2024-07-22" },
  { id: "user8", email: "shin@example.com", nickname: "신주니어", status: "active", joinedDate: "2024-08-30" },
];