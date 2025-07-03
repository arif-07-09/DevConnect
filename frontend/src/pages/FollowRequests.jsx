import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const FollowRequests = () => {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");
  const API_BASE = process.env.REACT_APP_API_URL;

  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/follow/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch follow requests", err);
      setMessage("Failed to load follow requests.");
      clearMessageAfterDelay();
    }
  }, [token]);

  const clearMessageAfterDelay = () => {
    setTimeout(() => {
      setMessage("");
    }, 5000); // 5 seconds
  };

  const handleAccept = async (requesterId) => {
    try {
      await axios.put(`${API_BASE}/api/follow/accept/${requesterId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("✅ Follow request accepted.");
      fetchRequests();
    } catch (err) {
      console.error("Error accepting request", err);
      setMessage("❌ Error accepting request.");
    } finally {
      clearMessageAfterDelay();
    }
  };

  const handleReject = async (requesterId) => {
    try {
      await axios.delete(`${API_BASE}/api/follow/reject/${requesterId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("⚠️ Follow request rejected.");
      fetchRequests();
    } catch (err) {
      console.error("Error rejecting request", err);
      setMessage("❌ Error rejecting request.");
    } finally {
      clearMessageAfterDelay();
    }
  };

  useEffect(() => {
    if (token) {
      fetchRequests();
    }
  }, [token, fetchRequests]);

  return (
    <div className="container mt-5" style={{ maxWidth: "600px" }}>
      <h2 className="mb-4">Pending Follow Requests</h2>
      {message && <div className="alert alert-info">{message}</div>}

      {requests.length === 0 ? (
        <p>No follow requests.</p>
      ) : (
        <ul className="list-group">
          {requests.map((req) => (
            <li
              key={req._id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div className="d-flex align-items-center">
                <img
                  src={
                    req.follower?.profilePic
                      ? `${API_BASE}/uploads/${req.follower.profilePic}`
                      : `${API_BASE}/uploads/default-user.png`
                  }
                  alt="profile"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginRight: "10px",
                  }}
                />
                <span>
                  {req.follower?.name} ({req.follower?.email})
                </span>
              </div>
              <div>
                <button
                  className="btn btn-success btn-sm me-2"
                  onClick={() => handleAccept(req.follower._id)}
                >
                  Accept
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleReject(req.follower._id)}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FollowRequests;
