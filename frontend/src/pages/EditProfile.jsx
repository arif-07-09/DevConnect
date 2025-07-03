// src/pages/EditProfile.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EditProfile = () => {
  const [form, setForm] = useState({ name: "", email: "", oldPassword: "", password: "" });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [userProfilePic, setUserProfilePic] = useState(""); // to display existing profile picture
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const API_BASE = process.env.REACT_APP_API_URL; // Adjust if needed
 // Adjust if needed

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const { name, email, profilePic } = res.data.user;
        setForm((prev) => ({ ...prev, name: name || "", email: email || "" }));

        if (profilePic) {
          setUserProfilePic(`${API_BASE}/uploads/${profilePic}`);
        }
      })
      .catch(() => navigate("/login"));
  }, [navigate, token]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoChange = (e) => {
    const selectedFile = e.target.files[0];
    setPhoto(selectedFile);
    if (selectedFile) {
      const previewUrl = URL.createObjectURL(selectedFile);
      setPhotoPreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      if (form.oldPassword) formData.append("oldPassword", form.oldPassword);
      if (form.password) formData.append("password", form.password);
      if (photo) formData.append("photo", photo);

      const res = await axios.put(`${API_BASE}/api/profile/update`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage(res.data.msg || "Profile updated successfully");
      setForm((prev) => ({ ...prev, oldPassword: "", password: "" }));

      // Refresh the userProfilePic after successful save
      if (res.data.user?.profilePic) {
        setUserProfilePic(`${API_BASE}/uploads/${res.data.user.profilePic}`);
      }
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err) {
      setMessage(err.response?.data?.msg || "Profile update failed");
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "500px" }}>
      <h2>Edit Profile</h2>
      {message && <div className="alert alert-info">{message}</div>}

      {userProfilePic && !photoPreview && (
        <div className="mb-3">
          <img
            src={userProfilePic}
            alt="Current Profile"
            style={{ width: "100px", height: "100px", borderRadius: "50%" }}
          />
        </div>
      )}
      {photoPreview && (
        <div className="mb-3">
          <img
            src={photoPreview}
            alt="New Profile Preview"
            style={{ width: "100px", height: "100px", borderRadius: "50%" }}
          />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          className="form-control mb-2"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          required
        />
        <input
          className="form-control mb-2"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        <input
          className="form-control mb-2"
          type="password"
          name="oldPassword"
          value={form.oldPassword}
          onChange={handleChange}
          placeholder="Current Password"
        />
        <input
          className="form-control mb-2"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="New Password (optional)"
        />
        <input
          className="form-control mb-3"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
        />
        <button className="btn btn-success w-100">Update Profile</button>
      </form>
    </div>
  );
};

export default EditProfile;
