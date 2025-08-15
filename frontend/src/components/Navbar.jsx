// src/components/Navbar.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState('');
  const [openJobsMenu, setOpenJobsMenu] = useState(false);
  const navigate = useNavigate();
  const jobsRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          toast.warning('Session expired. Please login again.');
          navigate('/session-expired');
        } else {
          setIsAuthenticated(true);
          setUserType(decoded.about); // hiring or job_seeker
        }
      } catch (err) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        toast.error('Invalid session. Please login again.');
        navigate('/session-expired');
      }
    } else {
      setIsAuthenticated(false);
    }
  }, [navigate]);

  // Close jobs menu when clicking outside
  useEffect(() => {
    function handleOutsideClick(e) {
      if (jobsRef.current && !jobsRef.current.contains(e.target)) {
        setOpenJobsMenu(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light px-4">
      <Link className="navbar-brand" to="/">DevConnect</Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse justify-content-between" id="navbarNav">
        <ul className="navbar-nav">
          {!isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/register">Register</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/profile">Profile</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/users">Users</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/edit-profile">Edit Profile</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard">Dashboard</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/posts">Posts</Link>
              </li>

              {/* Jobs Dropdown - Pure React */}
              <li className="nav-item" ref={jobsRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="nav-link btn btn-link"
                  onClick={() => setOpenJobsMenu(prev => !prev)}
                  style={{ textDecoration: 'none' }}
                >
                  Jobs ▾
                </button>

                {openJobsMenu && (
                  <ul
                    className="dropdown-menu show"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      zIndex: 1000,
                      display: 'block'
                    }}
                  >
                    {userType === 'hiring' && (
                      <li>
                        <Link
                          className="dropdown-item"
                          to="/post-job"
                          onClick={() => setOpenJobsMenu(false)}
                        >
                          Post a Job
                        </Link>
                      </li>
                    )}
                    {userType === 'job_seeker' && (
                      <li>
                        <Link
                          className="dropdown-item"
                          to="/jobs"
                          onClick={() => setOpenJobsMenu(false)}
                        >
                          Apply for a Job
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </li>
            </>
          )}
        </ul>

        {isAuthenticated && (
          <button className="btn btn-outline-danger" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
