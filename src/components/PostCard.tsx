import { CheckCircle2 } from 'lucide-react';

interface Post {
  id: number;
  author_address: string;
  content: string;
  post_type: 'web2' | 'web3';
  tx_hash: string | null;
  created_at: string;
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 transition-all hover:border-cyan-600/50">
      <p className="text-gray-300 break-words mb-4 whitespace-pre-wrap">{post.content}</p>
      <div className="border-t border-gray-700 pt-3 flex justify-between items-center text-xs text-gray-400">
        <div className='font-mono' title={post.author_address}>
          <p>作者: {`${post.author_address.substring(0, 10)}...`}</p>
          <p>时间: {new Date(post.created_at).toLocaleString()}</p>
        </div>
        {post.post_type === 'web3' && (
          <div className="flex items-center space-x-2 bg-cyan-900/50 text-cyan-300 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-4 h-4" />
            <span>已上链存证</span>
          </div>
        )}
      </div>
    </div>
  );
}