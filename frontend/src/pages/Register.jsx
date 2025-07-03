// src/pages/Register.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', about: 'job_seeker' });
  const [profilePic, setProfilePic] = useState(null);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  const API = process.env.REACT_APP_API_URL;
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setProfilePic(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('password', form.password);
      formData.append('about', form.about);
      if (profilePic) {
        formData.append('profilePic', profilePic);
      }

      await axios.post('{API}/api/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const loginRes = await axios.post('{API}/api/login', {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem('token', loginRes.data.token);
      navigate('/profile');
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Error occurred');
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '400px' }}>
      <h2>Register</h2>
      {message && <div className="alert alert-info">{message}</div>}

      <form onSubmit={handleSubmit}>
        <input
          className="form-control mb-2"
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          className="form-control mb-2"
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <div className="input-group mb-2">
          <input
            className="form-control"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <select
          className="form-control mb-3"
          name="about"
          value={form.about}
          onChange={handleChange}
          required
        >
          <option value="job_seeker">Looking for a Job</option>
          <option value="hiring">Hiring</option>
        </select>

        <label className="form-label">Upload Profile Picture</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="form-control mb-3"
        />

        <button className="btn btn-primary w-100" type="submit">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
