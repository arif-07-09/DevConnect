// src/pages/UserProfile.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  
  const [myId, setMyId] = useState(null);
  const [likes, setLikes] = useState({});
  const [followStatus, setFollowStatus] = useState("");
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Get own profile to know my ID
        const profileRes = await axios.get(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyId(profileRes.data.user._id);

        // Get the other user's profile and their posts
        const [userRes, postsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/user/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/api/user/${id}/posts`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setUser(userRes.data.user);

        const postList = postsRes.data.posts || [];
        setPosts(postList);

        const likeMap = {};
        postList.forEach((post) => {
          likeMap[post._id] = post.likedByUser;
        });
        setLikes(likeMap);

        // Determine follow status between me and that user
        const followRes = await axios.get(`${API_BASE}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const thisUser = followRes.data.find(u => u._id === id);
        const status = (() => {
          if (thisUser._id === profileRes.data.user._id) return "self";
          if (thisUser.followers?.includes(profileRes.data.user._id)) return "following";
          if (thisUser.pendingRequests?.includes(profileRes.data.user._id)) return "requested";
          if (thisUser.following?.includes(profileRes.data.user._id)) return "follow_back";
          return "not_following";
        })();
        setFollowStatus(status);
      } catch (err) {
        setError(err.response?.data?.msg || "Error loading user");
      }
    };

    fetchData();
  }, [id, navigate, token]);

  const toggleLike = async (postId) => {
    try {
      await axios.post(`${API_BASE}/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLikes(prev => ({ ...prev, [postId]: !prev[postId] }));
      const res = await axios.get(`${API_BASE}/api/user/${id}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Error liking post", err);
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (followStatus === "not_following" || followStatus === "follow_back") {
        await axios.post(`${API_BASE}/api/follow/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFollowStatus("requested");
      } else if (followStatus === "following") {
        await axios.delete(`${API_BASE}/api/unfollow/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFollowStatus("not_following");
      }
    } catch (err) {
      console.error("Follow/unfollow failed", err);
    }
  };

  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;
  if (!user) return <div className="container mt-5">Loading user...</div>;

  const followLabel = followStatus === "following"
    ? "Unfollow"
    : followStatus === "requested"
    ? "Requested"
    : followStatus === "follow_back"
    ? "Follow Back"
    : "Follow";

  return (
    <div className="container mt-5">
      <div className="mx-auto mb-4" style={{ maxWidth: '600px' }}>
        <h2 className="mb-4">{user.name}'s Profile</h2>
        <div className="card p-4 shadow-sm text-center">
          <img
            src={`${API_BASE}/uploads/${user.profilePic || 'default-user.png'}`}
            alt={user.name}
            className="rounded-circle mb-3 mx-auto"
            height="250"
            width="250"
            style={{ objectFit: "cover" }}
          />
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          {followStatus !== "self" && (
            <button
              className={`btn btn-sm ${followStatus === "following" ? "btn-outline-danger" : "btn-outline-primary"} mt-2`}
              onClick={handleFollowToggle}
              disabled={followStatus === "requested"}
            >
              {followLabel}
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto mb-3" style={{ maxWidth: '600px' }}>
        <h4>{user.name}'s Posts</h4>
      </div>

      {posts.length === 0 ? (
        <p className="text-center">No posts added</p>
      ) : (
        <div className="mb-5 d-flex flex-column align-items-center">
          {posts.map((post) => (
            <div key={post._id} className="card mb-4 shadow-sm" style={{ maxWidth: "600px", width: "100%" }}>
              <div className="card-header d-flex align-items-center">
                <img
                  src={`${API_BASE}/uploads/${user.profilePic || 'default-user.png'}`}
                  alt={user.name}
                  width="40"
                  height="40"
                  className="rounded-circle me-2"
                />
                <strong>{user.name}</strong>
              </div>
              <div className="card-body">
                <p>{post.content}</p>
                {post.image && (
                  <img
                    src={`${API_BASE}/uploads/${post.image}`}
                    alt="Post"
                    className="img-fluid rounded mt-2"
                    style={{ maxHeight: "300px", objectFit: "cover" }}
                  />
                )}
              </div>
              <div className="card-footer d-flex justify-content-between align-items-center">
                <button
                  className={`btn btn-sm ${likes[post._id] ? "btn-danger" : "btn-outline-danger"}`}
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

export default UserProfile;
