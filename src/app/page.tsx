// src/app/page.tsx (Updated Again)

"use client";

import { useState, useEffect, FormEvent } from 'react';

// 帖子的数据结构
interface Post {
  id: number;
  author: string;
  content: string;
  created_at: string;
}

// 新增：定义API返回的数据结构
interface ApiResponse {
  posts: Post[];
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      // FIXED: 使用类型断言 `as ApiResponse`
      const data = await response.json() as ApiResponse;
      
      setPosts(data.posts || []);
    } catch (err) {
      setError('Could not load posts. Make sure the D1 binding is correct.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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
      setAuthor('');
      setContent('');
      await fetchPosts();
    } catch (err) {
      setError('Could not create the post.');
    }
  };

  return (
    // ... JSX部分没有变化，保持原样 ...
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