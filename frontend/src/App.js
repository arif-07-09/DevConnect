// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Logout from './pages/Logout.jsx';
import Navbar from './components/Navbar.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import UsersList from './pages/UsersList.jsx';
import EditProfile from './pages/EditProfile.jsx';
import { ToastContainer } from 'react-toastify';
import SessionExpired from './pages/SessionExpired';
import Dashboard from './pages/Dashboard.jsx';
import Posts from './pages/Posts';
import UserProfile from './pages/UserProfile.jsx';
import FollowRequests from "./pages/FollowRequests"; // adjust path if needed
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // ⬅️ This line is critical
import PostPage from './pages/PostPage';
import PostJob from './pages/PostJob';
import Jobs from './pages/Jobs';
import JobApplicants from './pages/JobApplicants';


const App = () => {
  return (
    <Router>
      <Navbar />
      <ToastContainer position="top-center" />
      <Routes>
        <Route path="/login" element={<Login />}  />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/users" element={<UsersList />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/follow-requests" element={<FollowRequests />} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="/post/:postId" element={<PostPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route path="/session-expired" element={<SessionExpired />} />
        {/* Job routes */}
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:jobId/applicants" element={<JobApplicants />} />
      </Routes>
    </Router>
  );
};

export default App;
