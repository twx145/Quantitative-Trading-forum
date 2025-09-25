// src/app/page.tsx

"use client"; // 声明这是一个客户端组件

import { useState, useEffect, FormEvent } from 'react';

// 定义帖子的数据结构
interface Post {
  id: number;
  author: string;
  content: string;
  created_at: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 获取所有帖子的函数
  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (err: any) {
      setError('Could not load posts. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  // 在组件加载时获取一次帖子
  useEffect(() => {
    fetchPosts();
  }, []);

  // 处理表单提交的函数
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!author || !content) {
      alert('Author and content cannot be empty!');
      return;
    }

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, content }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      // 清空输入框并重新获取帖子列表
      setAuthor('');
      setContent('');
      await fetchPosts();
    } catch (err: any) {
      setError('Could not create the post.');
    }
  };

  return (
    <main className="container mx-auto p-4 bg-gray-900 text-white min-h-screen">
      <header className="text-center my-8">
        <h1 className="text-5xl font-bold text-cyan-400">Decentralized Forum</h1>
        <p className="text-gray-400 mt-2">Powered by Cloudflare Pages & D1</p>
      </header>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Create a New Post</h2>
          <div className="mb-4">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your Name"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 h-24 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition duration-300">
            Post
          </button>
        </form>

        {error && <p className="text-red-500 text-center my-4">{error}</p>}
        
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center">Loading posts...</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <p className="text-gray-300">{post.content}</p>
                <div className="text-right text-sm text-cyan-400 mt-2">
                  - {post.author} on {new Date(post.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}