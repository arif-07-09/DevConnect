// src/pages/Users.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const API_BASE = process.env.REACT_APP_API_BASE;

  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      try {
        const [profileRes, usersRes] = await Promise.all([
          axios.get(`${API_BASE}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setMyId(profileRes.data.user._id);
        setUsers(usersRes.data);
      } catch (err) {
        setError(err.response?.data?.msg || "Error loading users");
      }
    };

    fetchUsers();
  }, [token]);

  const handleFollowToggle = async (userId, status) => {
    try {
      if (status === "not_following" || status === "follow_back") {
        await axios.post(`${API_BASE}/api/follow/${userId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (status === "requested" || status === "following") {
        await axios.delete(`${API_BASE}/api/unfollow/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // Update user list after change
      const updatedUsers = await axios.get(`${API_BASE}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(updatedUsers.data);
    } catch (err) {
      alert(err.response?.data?.msg || "Action failed");
    }
  };

  const getFollowStatus = (user) => {
    if (user._id === myId) return "self";
    if (user.followers?.includes(myId)) return "following";
    if (user.pendingRequests?.includes(myId)) return "requested";
    if (user.following?.includes(myId)) return "follow_back";
    return "not_following";
  };

  const renderButton = (user, status) => {
    if (status === "self") return null;

    const buttonLabel = {
      following: "Unfollow",
      requested: "Requested",
      follow_back: "Follow Back",
      not_following: "Follow",
    }[status];

    const buttonClass = {
      following: "btn-outline-danger",
      requested: "btn-outline-secondary",
      follow_back: "btn-outline-primary",
      not_following: "btn-outline-primary",
    }[status];

    return (
      <button
        className={`btn btn-sm ${buttonClass}`}
        onClick={() => handleFollowToggle(user._id, status)}
        disabled={status === "requested"}
      >
        {buttonLabel}
      </button>
    );
  };

  return (
    <div className="container mt-5">
      <h2>All Users</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="list-group">
        {users.map((user) => {
          const status = getFollowStatus(user);
          const profileLink = user._id === myId ? "/profile" : `/user/${user._id}`;

          return (
            <div
              key={user._id}
              className="list-group-item d-flex align-items-center justify-content-between"
            >
              <div className="d-flex align-items-center">
                <Link to={profileLink} className="me-3">
                  <img
                    src={`${API_BASE}/uploads/${user.profilePic || "default-user.png"}`}
                    alt="profile"
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                </Link>
                <div>
                  <Link to={profileLink} style={{ textDecoration: "none", color: "inherit" }}>
                    <h5 className="mb-1">{user.name}</h5>
                  </Link>
                  <p className="mb-0">{user.email}</p>
                </div>
              </div>

              {renderButton(user, status)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Users;
