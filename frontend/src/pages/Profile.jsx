// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const Profile = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const API = process.env.REACT_APP_API_URL;
  const [likes, setLikes] = useState({});
  const [showMenu, setShowMenu] = useState(false);
  const [openDropdownPostId, setOpenDropdownPostId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserAndPosts = async () => {
      try {
        const userRes = await axios.get(`${API}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const currentUser = userRes.data.user;
        setUser(currentUser);

        const postRes = await axios.get(`${API}/api/posts`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userPosts = postRes.data.filter(
          (post) => post.author._id === currentUser._id
        );

        setPosts(userPosts);

        const likeMap = {};
        userPosts.forEach(post => {
          likeMap[post._id] = post.likedByUser;
        });
        setLikes(likeMap);
      } catch (err) {
        console.error("Error loading profile or posts:", err);
        navigate('/login');
      }
    };

    fetchUserAndPosts();
  }, [navigate, token]);

  const toggleLike = async (postId) => {
    try {
      await axios.post(`${API}/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLikes(prev => ({ ...prev, [postId]: !prev[postId] }));

      const res = await axios.get(`${API}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = res.data.filter(post => post.author._id === user._id);
      setPosts(updated);
    } catch (err) {
      console.error("Error toggling like", err);
    }
  };

  const deletePost = async (postId) => {
    const confirm = window.confirm("Are you sure you want to delete this post?");
    if (!confirm) return;

    try {
      await axios.delete(`${API}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(prev => prev.filter(post => post._id !== postId));
    } catch (err) {
      console.error("Failed to delete post", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete your account? This action is irreversible.");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API}/api/delete-account`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem('token');
      navigate('/register');
    } catch (err) {
      console.error("Account deletion failed:", err);
      alert("Failed to delete account.");
    }
  };

  const toggleDropdown = (postId) => {
    setOpenDropdownPostId(prev => (prev === postId ? null : postId));
  };

  return (
    <div className="container mt-5">
      <div className="mx-auto mb-4" style={{ maxWidth: '600px' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0">Profile Page</h2>
          <div className="dropdown">
            <button
              className="btn btn-secondary dropdown-toggle"
              onClick={() => setShowMenu(!showMenu)}
            >
              ⋮
            </button>
            {showMenu && (
              <ul className="dropdown-menu show" style={{ position: 'absolute' }}>
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    🔓 Logout
                  </button>
                </li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleDeleteAccount}>
                    🗑️ Delete Account
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>

        {user ? (
          <div className="card p-4 shadow-sm">
            <img
              src={`${API}/uploads/${user.profilePic || 'default-user.png'}`}
              alt={user.name}
              className="rounded-circle mb-3 mx-auto d-block"
              height="250"
              width="250"
              style={{ objectFit: 'cover' }}
            />
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        ) : (
          <p>Loading profile...</p>
        )}
      </div>

      <div className="mx-auto mb-3" style={{ maxWidth: '600px' }}>
        <h4>Your Posts</h4>
      </div>

      {posts.length === 0 ? (
        <p className="text-center">No posts yet.</p>
      ) : (
        <div className="mb-5 d-flex flex-column align-items-center">
          {posts.map(post => (
            <div className="card mb-4 shadow-sm" key={post._id} style={{ maxWidth: '600px', width: '100%' }}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <img
                    src={`${API}/uploads/${user.profilePic || 'default-user.png'}`}
                    alt={user.name}
                    width="40"
                    height="40"
                    className="rounded-circle me-2"
                  />
                  <strong>{user.name}</strong>
                </div>
                <div className="dropdown">
                  <button
                    className="btn btn-sm btn-light"
                    onClick={() => toggleDropdown(post._id)}
                  >
                    ⋮
                  </button>
                  {openDropdownPostId === post._id && (
                    <ul className="dropdown-menu show dropdown-menu-end" style={{ position: 'absolute' }}>
                      <li>
                        <button className="dropdown-item text-danger" onClick={() => deletePost(post._id)}>
                          🗑️ Delete Post
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              </div>

              <div className="card-body">
                <p>{post.content}</p>
                {post.image && (
                  <img
                    src={`${API}/uploads/${post.image}`}
                    alt="Post"
                    className="img-fluid rounded"
                    style={{ maxHeight: '300px', objectFit: 'cover' }}
                  />
                )}
              </div>

              <div className="card-footer d-flex justify-content-between align-items-center">
                <button
                  className={`btn btn-sm ${likes[post._id] ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={() => toggleLike(post._id)}
                >
                  ❤️ {post.likeCount}
                </button>
                <small className="text-muted">{new Date(post.createdAt).toLocaleString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile;
