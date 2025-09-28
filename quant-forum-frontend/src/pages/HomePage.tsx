import React from 'react';
import PostForm from '../components/PostForm';
import PostCard from '../components/PostCard';
import Spinner from '../components/Spinner';

// Define the types again for this component's props
interface User {
  id: number;
  public_address: string | null;
}
interface Post {
  id: number; content: string; created_at: string; author_phone: string;
  is_nft: number; ipfs_cid: string | null; transaction_hash: string | null;
}

interface HomePageProps {
  user: User | null;
  posts: Post[];
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
        posts.map(post => <PostCard key={post.id} post={post} />)
      )}
    </>
  );
};

export default HomePage;