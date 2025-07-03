import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const API = process.env.REACT_APP_API_URL;



  useEffect(() => {
    if (!token) return navigate('/login');

    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        return navigate('/login');
      }
    } catch {
      localStorage.removeItem('token');
      return navigate('/login');
    }

    axios.get(`${API}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        navigate('/login');
      });
  }, [navigate, token]);

  const handleNotifClick = (notif) => {
    if ((notif.type === 'follow_request' || notif.type === 'follow_accepted')) {
      navigate('/follow-requests');
    } else if (notif.type === 'like' && notif.postId) {
      navigate(`/post/${notif.postId}`);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await axios.delete(`${API}/api/notifications/clear`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(prev => ({
        ...prev,
        notifications: [],
        stats: {
          ...prev.stats,
          notifications: 0
        }
      }));
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  if (loading) return <div className="container mt-5"><p>Loading...</p></div>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Dashboard</h2>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card text-center border-primary">
            <div className="card-body">
              <h5 className="card-title">Posts</h5>
              <p className="card-text display-6">{data.stats.posts}</p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card text-center border-success">
            <div
              className="card-body"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/follow-requests')}
            >
              <h5 className="card-title">Follow Requests</h5>
              <p className="card-text display-6">
                {data.stats.followRequests}
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card text-center border-warning">
            <div className="card-body">
              <h5 className="card-title">Notifications</h5>
              <p className="card-text display-6">
                {data.stats.notifications}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Header with Clear Button */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h3 className="mb-0">Recent Notifications</h3>
        {data.notifications.length > 0 && (
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={handleClearNotifications}
          >
            Clear All
          </button>
        )}
      </div>

      {(!data.notifications || data.notifications.length === 0) ? (
        <p>No notifications</p>
      ) : (
        <ul className="list-group">
          {data.notifications.map(notif => (
            <li
              key={notif._id}
              className="list-group-item list-group-item-action"
              onClick={() => handleNotifClick(notif)}
              style={{ cursor: 'pointer' }}
            >
              {notif.type === 'like' && notif.fromUser?.name &&
                `🖤 Your post was liked by @${notif.fromUser.name}`
              }
              {(notif.type === 'follow_request' || notif.type === 'follow_accepted') && notif.fromUser?.name &&
                `🤝 @${notif.fromUser.name} ${notif.type === 'follow_request' ? 'sent you a follow request' : 'accepted your request'}`
              }
              {!notif.fromUser?.name &&
                `🔔 New notification`
              }
              <small className="text-muted d-block">
                {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ''}
              </small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
