// src/pages/SessionExpired.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const SessionExpired = () => {
  return (
    <main className="container mt-5 text-center">
      <div role="alert">
        <h2 className="text-danger mb-3">Session Expired</h2>
        <p className="mb-4">Please login again to continue.</p>
        <Link className="btn btn-primary" to="/login">Go to Login</Link>
      </div>
    </main>
  );
};

export default SessionExpired;
