import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Link } from 'react-router-dom';

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null); // for controlled dropdown

  const token = localStorage.getItem('token');
  const API_BASE = process.env.REACT_APP_API_URL;

  const decodedToken = token ? jwtDecode(token) : null;
  const currentUserId = decodedToken?.id;

  const fetchPosts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
    } catch {
      setMessage('Failed to load posts');
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchPosts();
  }, [token, fetchPosts]);

  // Automatically clear message after 10 seconds
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(''), 10000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  const handlePost = async () => {
    try {
      const formData = new FormData();
      formData.append('content', newPost);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await axios.post(`${API_BASE}/api/posts`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setNewPost('');
      setImageFile(null);
      setMessage('Post created!');
      fetchPosts();
    } catch {
      setMessage('Failed to create post');
    }
  };

  const handleToggleLike = async (postId, likedByUser) => {
    try {
      if (likedByUser) {
        await axios.delete(`${API_BASE}/api/posts/${postId}/unlike`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_BASE}/api/posts/${postId}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchPosts();
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to toggle like');
    }
  };

  const handleDelete = async (postId) => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this post?');
      if (!confirmed) return;

      await axios.delete(`${API_BASE}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage('Post deleted');
      fetchPosts();
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to delete post');
    }
  };

  const toggleDropdown = (postId) => {
    setOpenDropdownId((prevId) => (prevId === postId ? null : postId));
  };

  const closeDropdown = () => setOpenDropdownId(null);

  return (
    <div className="container mt-4" style={{ maxWidth: '600px' }}>
      <h2>Posts</h2>
      {message && <div className="alert alert-info">{message}</div>}

      <div className="mb-3">
        <textarea
          className="form-control"
          placeholder="What's on your mind?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <input
          type="file"
          className="form-control mt-2"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
        />
        <button
          className="btn btn-primary mt-2 w-100"
          onClick={handlePost}
          disabled={!newPost.trim() && !imageFile}
        >
          Post
        </button>
      </div>

      {posts.length === 0 && <p>No posts available</p>}
      {posts.map(post => (
        <div className="card mb-3" key={post._id}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="d-flex align-items-center">
                <Link to={post.author._id === currentUserId ? "/profile" : `/user/${post.author._id}`}>
                  <img
                    src={`${API_BASE}/uploads/${post.author.profilePic || 'default-user.png'}`}
                    alt="profile"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginRight: '10px'
                    }}
                  />
                </Link>
                <Link
                  to={post.author._id === currentUserId ? "/profile" : `/user/${post.author._id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <h5 className="card-title mb-0">{post.author.name}</h5>
                </Link>
              </div>

              {post.author._id === currentUserId && (
                <div className="position-relative">
                  <button
                    className="btn btn-sm btn-light"
                    onClick={() => toggleDropdown(post._id)}
                  >
                    ⋮
                  </button>
                  {openDropdownId === post._id && (
                    <ul
                      className="dropdown-menu show position-absolute end-0"
                      style={{ zIndex: 1000 }}
                    >
                      <li>
                        <button
                          className="dropdown-item text-danger"
                          onClick={() => {
                            handleDelete(post._id);
                            closeDropdown();
                          }}
                        >
                          🗑️ Delete Post
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              )}
            </div>

            <p className="card-text">{post.content}</p>
            {post.image && (
              <img
                src={`http://localhost:5000/uploads/${post.image}`}
                alt="Post"
                className="img-fluid rounded mb-2"
              />
            )}

            <small className="text-muted">
              {new Date(post.createdAt).toLocaleString()}
            </small>

            <div className="d-flex justify-content-between align-items-center mt-2">
              <button
                className={`btn btn-sm ${post.likedByUser ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                onClick={() => handleToggleLike(post._id, post.likedByUser)}
              >
                {post.likedByUser ? '👎 Unlike' : '👍 Like'}
              </button>
              <span>{post.likeCount || 0} likes</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Posts;
