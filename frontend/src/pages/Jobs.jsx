// src/pages/Jobs.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [openDropdownJobId, setOpenDropdownJobId] = useState(null); // per-job dropdown (like Profile.jsx)
  const token = localStorage.getItem('token');
  const API = process.env.REACT_APP_API_BASE;
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchJobsAndUser = async () => {
      try {
        const profile = await axios.get(`${API}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(profile.data.user);

        const res = await axios.get(`${API}/api/jobs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setJobs(res.data.jobs);
      } catch (err) {
        setError(err.response?.data?.msg || 'Error loading jobs');
      }
    };

    fetchJobsAndUser();
  }, [API, token, navigate]);

  const isApplied = (job) => {
    if (!user) return false;
    return job.applicants?.some(applicant => applicant._id === user._id);
  };

  // Apply / Withdraw (job seeker)
  const handleApplyOrWithdraw = async (jobId, applied) => {
    try {
      if (applied) {
        // Withdraw application
        await axios.delete(`${API}/api/jobs/${jobId}/withdraw`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Apply for job
        await axios.post(`${API}/api/jobs/${jobId}/apply`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // Update local state without a full re-fetch
      setJobs(prev =>
        prev.map(job =>
          job._1d === jobId || job._id === jobId // small defensive check in case of different id keys
            ? {
                ...job,
                applicants: applied
                  ? job.applicants.filter(a => a._id !== user._id) // remove self if withdrawn
                  : [...(job.applicants || []), user], // add self if applied
              }
            : job
        )
      );
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to update application status');
    }
  };

  // Remove applicant by hirer
  const handleDeleteApplicant = async (jobId, userId) => {
    try {
      await axios.delete(`${API}/api/jobs/${jobId}/applicants/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setJobs(prev =>
        prev.map(job =>
          job._id === jobId
            ? {
                ...job,
                applicants: (job.applicants || []).filter(a => a._id !== userId),
              }
            : job
        )
      );
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to remove applicant');
    }
  };

  // Delete job by hirer (action moved into dropdown)
  const handleDeleteJob = async (jobId) => {
    const confirmed = window.confirm('Are you sure you want to delete this job?');
    if (!confirmed) {
      setOpenDropdownJobId(null);
      return;
    }

    try {
      await axios.delete(`${API}/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setJobs(prev => prev.filter(job => job._id !== jobId));
      setOpenDropdownJobId(null);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to delete job');
      setOpenDropdownJobId(null);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Job Opportunities</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {jobs.length === 0 ? (
        <p>No jobs available at the moment.</p>
      ) : (
        <div className="d-flex flex-column gap-4">
          {jobs.map(job => (
            <div key={job._id} className="card shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-start">
                <h5>{job.title}</h5>

                {/* Dropdown like Profile.jsx */}
                {user?.about === 'hiring' && job.postedBy._id === user._id && (
                  <div className="position-relative">
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => setOpenDropdownJobId(prev => (prev === job._id ? null : job._id))}
                    >
                      ⋮
                    </button>
                    {openDropdownJobId === job._id && (
                      <ul
                        className="dropdown-menu show position-absolute end-0"
                        style={{ zIndex: 1000 }}
                      >
                        <li>
                          <button
                            className="dropdown-item text-danger"
                            onClick={() => handleDeleteJob(job._id)}
                          >
                            🗑️ Delete Job
                          </button>
                        </li>
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <p className="mb-1"><strong>Description:</strong> {job.description}</p>
              <p className="mb-1"><strong>Location:</strong> {job.location}</p>
              <p className="mb-1"><strong>Salary:</strong> ₹{job.salary}</p>
              {job.skills?.length > 0 && (
                <p className="mb-1"><strong>Skills:</strong> {job.skills.join(', ')}</p>
              )}
              <p className="mb-2">
                <strong>Posted By:</strong> {job.postedBy?.name}
              </p>

              {/* Job seeker buttons */}
              {user?.about === 'job_seeker' && job.postedBy._id !== user._id && (
                <button
                  className={`btn btn-sm ${isApplied(job) ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                  onClick={() => handleApplyOrWithdraw(job._id, isApplied(job))}
                >
                  {isApplied(job) ? 'Withdraw Application' : 'Apply'}
                </button>
              )}

              {/* Hirer view of applicants */}
              {user?.about === 'hiring' && job.postedBy._id === user._id && (
                <div className="mt-3">
                  <h6>Applicants:</h6>
                  {job.applicants?.length === 0 ? (
                    <p>No applicants yet.</p>
                  ) : (
                    <ul className="list-group">
                      {job.applicants.map(applicant => (
                        <li
                          key={applicant._id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <Link
                              to={`/user/${applicant._id}`}
                              style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                              <img
                                src={`${API}/uploads/${applicant.profilePic || 'default-user.png'}`}
                                alt={applicant.name}
                                className="rounded-circle me-2"
                                width="35"
                                height="35"
                                style={{ objectFit: 'cover' }}
                              />
                              <strong>{applicant.name}</strong>
                            </Link>
                            <span> – {applicant.email}</span>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteApplicant(job._id, applicant._id)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Jobs;
