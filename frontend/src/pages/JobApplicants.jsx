import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

const JobApplicants = () => {
  const { jobId } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const API = process.env.REACT_APP_API_BASE;
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchApplicants = async () => {
      try {
        const res = await axios.get(`${API}/api/jobs/${jobId}/applicants`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setApplicants(res.data.applicants);
        setJobTitle(res.data.title || 'Applicants');
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to load applicants');
      }
    };

    fetchApplicants();
  }, [API, jobId, token, navigate]);

  const handleDeleteApplicant = async (userId) => {
    try {
      await axios.delete(`${API}/api/jobs/${jobId}/applicants/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setApplicants(prev => prev.filter(a => a._id !== userId));
    } catch (err) {
      alert(err.response?.data?.msg || 'Error deleting applicant');
    }
  };

  return (
    <div className="container mt-5">
      <h3 className="mb-4">Applicants for: {jobTitle}</h3>
      {error && <div className="alert alert-danger">{error}</div>}

      {applicants.length === 0 ? (
        <p>No applicants found.</p>
      ) : (
        <ul className="list-group">
          {applicants.map(applicant => (
            <li
              key={applicant._id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                <img
                  src={`${API}/uploads/${applicant.profilePic || 'default-user.png'}`}
                  alt={applicant.name}
                  className="rounded-circle me-2"
                  width="40"
                  height="40"
                  style={{ objectFit: 'cover' }}
                />
                <Link to={`/user/${applicant._id}`} className="fw-bold text-decoration-none">
                  {applicant.name}
                </Link>
                <span className="ms-2 text-muted">({applicant.email})</span>
              </div>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDeleteApplicant(applicant._id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default JobApplicants;
