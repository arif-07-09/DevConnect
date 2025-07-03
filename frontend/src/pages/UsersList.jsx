import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      try {
        const profile = await axios.get(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyId(profile.data.user._id);

        const res = await axios.get(`${API_BASE}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(res.data);
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

      // Refresh user list
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

    const iFollow = user.followers?.includes(myId);
    const theyFollowMe = user.following?.includes(myId);
    const pending = user.pendingRequests?.includes(myId);

    if (iFollow) return "following";
    if (pending) return "requested";
    if (theyFollowMe) return "follow_back";
    return "not_following";
  };

  return (
    <div className="container mt-5">
      <h2>All Users</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="list-group">
        {users.map((user) => {
          const status = getFollowStatus(user);

          return (
            <div
              key={user._id}
              className="list-group-item d-flex align-items-center justify-content-between"
            >
              <div className="d-flex align-items-center">
                <Link to={user._id === myId ? '/profile' : `/user/${user._id}`} className="me-3">
  <img
    src={`${API_BASE}/uploads/${user.profilePic || 'default-user.png'}`}
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
  <Link
    to={user._id === myId ? '/profile' : `/user/${user._id}`}
    style={{ textDecoration: "none", color: "inherit" }}
  >
    <h5 className="mb-1">{user.name}</h5>
  </Link>
  <p className="mb-0">{user.email}</p>
</div>

              </div>

              {status !== "self" && (
                <button
                  className={`btn btn-sm ${
                    status === "following"
                      ? "btn-outline-danger"
                      : status === "requested"
                      ? "btn-outline-secondary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => handleFollowToggle(user._id, status)}
                >
                  {status === "following"
                    ? "Unfollow"
                    : status === "requested"
                    ? "Requested"
                    : status === "follow_back"
                    ? "Follow Back"
                    : "Follow"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Users;
