import React from 'react';
import PostForm from '../components/PostForm';
import PostCard from '../components/PostCard';
import Spinner from '../components/Spinner';

// 1. 从我们的新文件中导入统一的类型
import { type User, type Post } from '../types';

// 2. 更新 HomePageProps 的定义
interface HomePageProps {
  user: User | null;
  posts: Post[]; // 现在它使用的是正确的 Post 类型
  isLoading: boolean;
  handlePostSubmit: (content: string, isNft: boolean) => Promise<void>;
}

const HomePage: React.FC<HomePageProps> = ({ user, posts, isLoading, handlePostSubmit }) => {
  return (
    <>
      {user && (
        <PostForm
          onSubmit={handlePostSubmit}
          userHasWallet={!!user.public_address}
        />
      )}

      {isLoading ? (
        <div className="card" style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
          <Spinner />
        </div>
      ) : (
        // 这里的 posts.map 不会再报错，因为类型现在完全一致
        posts.map(post => <PostCard key={post.id} post={post} />)
      )}
    </>
  );
};

export default HomePage;