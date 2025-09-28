import React from 'react';
import { FiAward } from 'react-icons/fi';

interface Post {
  id: number;
  content: string;
  created_at: string;
  author_phone: string;
  is_nft: number;
  ipfs_cid: string | null;
  transaction_hash: string | null;
}

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const formattedDate = new Date(post.created_at).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const avatarInitial = post.author_phone.slice(-2);

  return (
    <article className={`card ${post.is_nft ? 'nft-post' : ''}`}>
      <header className="post-card-header">
        <div className="post-card-avatar">{avatarInitial}</div>
        <div className="post-card-author-info">
          <span className="post-card-author">作者: {post.author_phone}</span>
          <time className="post-card-date">{formattedDate}</time>
        </div>
        {post.is_nft === 1 && (
          <div className="nft-badge">
            <FiAward />
            <span>数字藏品</span>
          </div>
        )}
      </header>

      <p className="post-card-content">{post.content}</p>

      {post.is_nft === 1 && post.ipfs_cid && post.transaction_hash && (
        <footer className="post-card-nft-footer">
          <a href={`https://ipfs.io/ipfs/${post.ipfs_cid}`} target="_blank" rel="noopener noreferrer">
            查看IPFS源文件
          </a>
          <span>|</span>
          {/* 这里可以链接到文昌链的区块浏览器 */}
          <span>交易哈希: {post.transaction_hash.substring(0, 10)}...</span>
        </footer>
      )}
    </article>
  );
};

export default PostCard;