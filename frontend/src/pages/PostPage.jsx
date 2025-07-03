import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const PostPage = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const API = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!token) return;

    axios.get(`${API}/api/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setPost(res.data))
    .catch(err => {
      console.error(err);
      setError('Failed to load post.');
    });
  }, [postId, token]);

  if (error) return <div className="container mt-5"><p>{error}</p></div>;
  if (!post) return <div className="container mt-5"><p>Loading...</p></div>;

  return (
    <div className="container mt-4" style={{ maxWidth: '600px' }}>
      <div className="card">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <Link to={`/user/${post.author._id}`}>
              <img
                src={`${API}/uploads/${post.author.profilePic || 'default-user.png'}`}
                alt="profile"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginRight: '10px'
                }}
              />
            </Link>
            <h5 className="mb-0">{post.author.name}</h5>
          </div>
          <p>{post.content}</p>
          {post.image && (
            <img
              src={`${API}/uploads/${post.image}`}
              alt="post"
              className="img-fluid rounded mb-2"
            />
          )}
          <small className="text-muted d-block">{new Date(post.createdAt).toLocaleString()}</small>
          <div className="mt-2">
            <strong>{post.likeCount} likes</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPage;
