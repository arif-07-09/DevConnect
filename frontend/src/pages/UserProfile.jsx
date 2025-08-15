import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likes, setLikes] = useState({});
  const [followStatus, setFollowStatus] = useState("");
  const [myId, setMyId] = useState(null);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const API_BASE = process.env.REACT_APP_API_BASE;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const profileRes = await axios.get(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const myUser = profileRes.data.user;
        setMyId(myUser._id);

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

        const allUsersRes = await axios.get(`${API_BASE}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const targetUser = allUsersRes.data.find((u) => u._id === id);

        const status = (() => {
          if (targetUser._id === myUser._id) return "self";
          if (targetUser.followers?.includes(myUser._id)) return "following";
          if (targetUser.pendingRequests?.includes(myUser._id)) return "requested";
          if (targetUser.following?.includes(myUser._id)) return "follow_back";
          return "not_following";
        })();

        setFollowStatus(status);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.msg || "Error loading user");
      }
    };

    fetchData();
  }, [id, navigate, token]);

  const toggleLike = async (postId) => {
    try {
      const isLiked = likes[postId];

      if (isLiked) {
        await axios.delete(`${API_BASE}/api/posts/${postId}/unlike`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_BASE}/api/posts/${postId}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setLikes((prev) => ({ ...prev, [postId]: !prev[postId] }));
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? { ...post, likeCount: post.likeCount + (isLiked ? -1 : 1) }
            : post
        )
      );
    } catch (err) {
      console.error("Error updating like/unlike:", err);
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (followStatus === "not_following" || followStatus === "follow_back") {
        await axios.post(`${API_BASE}/api/follow/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFollowStatus("requested");
      } else if (followStatus === "requested" || followStatus === "following") {
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
              className={`btn btn-sm mt-2 ${followStatus === "following"
                ? "btn-outline-danger"
                : followStatus === "requested"
                ? "btn-outline-secondary"
                : "btn-outline-primary"
              }`}
              onClick={handleFollowToggle}
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
                  className={`btn btn-sm ${likes[post._id] ? "btn-outline-danger" : "btn-outline-primary"}`}
                  onClick={() => toggleLike(post._id)}
                >
                  {likes[post._id] ? "👎 Unlike" : "👍 Like"}
                </button>
                <span>{post.likeCount || 0} likes</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
