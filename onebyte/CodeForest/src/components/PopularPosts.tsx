import { Link } from "react-router-dom";
import { TrendingUp, MessageCircle, Eye } from "lucide-react";

type PopularPostItem = {
  id: number;
  title: string;
  categoryName: string;
  viewCount: number;
  commentCount: number;
};

interface PopularPostsProps {
  posts: PopularPostItem[];
}

export function PopularPosts({ posts }: PopularPostsProps) {
  const popularPosts = [...posts].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)).slice(0, 5);

  const mostCommented = [...posts].sort((a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Popular Posts */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3>인기 게시글</h3>
        </div>
        <div className="space-y-4">
          {popularPosts.map((post, index) => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className="block group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{post.viewCount ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{post.commentCount ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Most Commented */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3>댓글 많은 글</h3>
        </div>
        <div className="space-y-4">
          {mostCommented.map((post, index) => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className="block group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-block px-2 py-0.5 bg-secondary rounded-full">
                      {post.categoryName}
                    </span>
                    <span>댓글 {post.commentCount ?? 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
