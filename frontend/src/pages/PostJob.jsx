import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PostJob = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    salary: '',
    skills: '',
  });
  const [error, setError] = useState('');
  const [isHirer, setIsHirer] = useState(false);
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_BASE;
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const checkUserRole = async () => {
      try {
        const res = await axios.get(`${API}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsHirer(res.data.user.about === 'hiring');
        if (res.data.user.about !== 'hiring') {
          navigate('/');
        }
      } catch (err) {
        navigate('/login');
      }
    };

    checkUserRole();
  }, [API, navigate, token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post(
        `${API}/api/jobs`,
        {
          ...form,
          skills: form.skills.split(',').map(skill => skill.trim()).filter(Boolean),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to post job');
    }
  };

  if (!isHirer) return null;

  return (
    <div className="container mt-5" style={{ maxWidth: '600px' }}>
      <h2 className="mb-4">Post a New Job</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          className="form-control mb-3"
          type="text"
          name="title"
          placeholder="Job Title"
          value={form.title}
          onChange={handleChange}
          required
        />
        <textarea
          className="form-control mb-3"
          name="description"
          placeholder="Job Description"
          value={form.description}
          onChange={handleChange}
          rows="4"
          required
        />
        <input
          className="form-control mb-3"
          type="text"
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          required
        />
        <input
          className="form-control mb-3"
          type="number"
          name="salary"
          placeholder="Salary"
          value={form.salary}
          onChange={handleChange}
        />
        <input
          className="form-control mb-3"
          type="text"
          name="skills"
          placeholder="Required Skills (comma separated)"
          value={form.skills}
          onChange={handleChange}
        />
        <button className="btn btn-primary w-100" type="submit">
          Post Job
        </button>
      </form>
    </div>
  );
};

export default PostJob;
