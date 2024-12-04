/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/index.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful:', data);
        setError('');
        localStorage.setItem('token', data.token);

        // Decode the token to check the role
        const decodedToken = JSON.parse(atob(data.token.split('.')[1]));
        console.log('Decoded Token:', decodedToken);

        // Navigate based on user role
        if (decodedToken.role === 'advisor') {
          navigate('/advisor-landing');
        } else if (decodedToken.role === 'dept_chair') {
          navigate('/department-chair-landing');
        } else if (decodedToken.role === 'student') {
          navigate('/dashboard');
        } else if (decodedToken.role === 'faculty') {
          navigate('/faculty-landing');
        } else if (decodedToken.role === 'coordinator') {
          navigate('/coordinator-dashboard');
        }else {
          setError('Role not recognized');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Server error');
    }
  };

  return (
    <div className="login-page">
      <nav className="navbar">
        <div className="navbar-brand"><a href="/">
           
          </a></div>
        <div className="navbar-links">
          <a href="/">Home</a> | <a href="/forms">Forms</a> | <a href="/coop">Coop</a>
        </div>
      </nav>
 
      <div className="login-container">
        <div className="login-box">
          <h2>LOGIN</h2>
          <form onSubmit={handleSubmit}>
            {error && <p className="error">{error}</p>}
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="RIT Username"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>
            <button type="submit" className="login-button">Login</button>
          </form>
 
          <div className="login-footer">
            <a href="/forgot-username">Forgot Username?</a> | <a href="/forgot-password">Forgot Password?</a>
            <br />
            <a href="/change-password">Change Password</a>
            <p>
              Need assistance? Please contact the RIT Service Center at 585-475-5000 or visit <a href="https://help.rit.edu">help.rit.edu</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
 }
 
 export default LoginPage;
 