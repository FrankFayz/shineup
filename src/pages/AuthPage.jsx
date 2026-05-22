import React, { useState, useEffect } from 'react';
import '../styles/AuthPage.css';

const initialState = {
  fullName: '',
  email: '',
  password: '',
  university: '',
  course: '',
  year: '',
  studentId: '',
  careerInterests: '',
  phone: ''
};

const AuthPage = ({ onLogin }) => {
  const [form, setForm] = useState(initialState);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ==================== BACKEND INTEGRATION: CHECK EXISTING SESSION ====================
  // Django Backend Team: Replace this with your session validation endpoint
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // TODO: Backend - Implement session validation endpoint
        const response = await fetch('/api/auth/verify-session/', {
          method: 'GET',
          credentials: 'include', // Important for Django session cookies
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setIsAuthenticated(true);
          if (onLogin) {
            onLogin(userData); // This redirects to App.jsx main dashboard
          }
        }
      } catch (error) {
        console.log('No active session found');
        // Clear any invalid tokens
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
      }
    };

    checkExistingSession();
  }, [onLogin]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
  };

  // ==================== BACKEND INTEGRATION: LOGIN HANDLER ====================
  // Django Backend Team: This function sends login credentials to your backend
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Backend - Implement Django login endpoint
      // Expected Request: POST /api/auth/login/
      // Expected Payload: { email, password }
      const response = await fetch('/api/auth/login/', {
        method: 'POST',
        credentials: 'include', // Important for Django session cookies
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken(), // Django CSRF protection
        },
        body: JSON.stringify({ 
          email: email, 
          password: password 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // ==================== IMPORTANT: DASHBOARD REDIRECTION ====================
        // Backend Team: After successful authentication, call onLogin with user data
        // This will automatically redirect user to main App.jsx dashboard
        setIsAuthenticated(true);
        setIsLoading(false);
        
        // Notify parent component - THIS TRIGGERS REDIRECTION TO MAIN DASHBOARD (App.jsx)
        if (onLogin) {
          onLogin(data.user); // data.user should contain user profile from database
        }
        
      } else {
        // Handle Django validation errors
        const errorData = await response.json();
        alert(`Login failed: ${errorData.error || 'Invalid credentials'}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  // ==================== BACKEND INTEGRATION: REGISTRATION HANDLER ====================
  // Django Backend Team: This function sends registration data to your backend
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Backend - Implement Django registration endpoint
      // Expected Request: POST /api/auth/register/
      // Expected Payload: All form fields (see form object structure above)
      const response = await fetch('/api/auth/register/', {
        method: 'POST',
        credentials: 'include', // Important for Django session cookies
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken(), // Django CSRF protection
        },
        body: JSON.stringify(form), // Sends all form data to be stored in database
      });

      if (response.ok) {
        const data = await response.json();
        
        // ==================== IMPORTANT: DASHBOARD REDIRECTION ====================
        // Backend Team: After successful registration, call onLogin with user data
        // This will automatically redirect user to main App.jsx dashboard
        setIsAuthenticated(true);
        setIsLoading(false);
        alert('Registration successful! You are now logged in.');
        
        // Notify parent component - THIS TRIGGERS REDIRECTION TO MAIN DASHBOARD (App.jsx)
        if (onLogin) {
          onLogin(data.user); // data.user should contain newly created user profile from database
        }
        
      } else {
        // Handle Django validation errors (email exists, invalid data, etc.)
        const errorData = await response.json();
        const errorMessage = Object.values(errorData).flat().join(', ') || 'Registration failed';
        alert(`Registration failed: ${errorMessage}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  // ==================== BACKEND INTEGRATION: CSRF TOKEN HELPER ====================
  // Django Backend Team: This function gets CSRF token from Django
  const getCSRFToken = () => {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    return cookieValue || '';
  };

  const handleLogout = async () => {
    try {
      // TODO: Backend - Implement logout endpoint to clear Django session
      await fetch('/api/auth/logout/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCSRFToken(),
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear frontend state regardless of backend response
      setIsAuthenticated(false);
      setEmail('');
      setPassword('');
      setForm(initialState);
      
      // Clear any stored tokens (though we're using sessions)
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
    }
  };

  const switchToLogin = () => {
    setIsLogin(true);
    setForm(initialState);
  };

  const switchToRegister = () => {
    setIsLogin(false);
    setEmail('');
    setPassword('');
  };

  // ==================== BACKEND INTEGRATION: AUTHENTICATION STATUS ====================
  // If user is authenticated, show welcome message (this should redirect via parent)
  if (isAuthenticated) {
    return (
      <div className="auth-main-container">
        <div className="welcome-message">
          <h2>Welcome back!</h2>
          <p>Redirecting to your dashboard...</p>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-main-container">
      <div className="floating-elements">
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
      </div>
      
      <div className="auth-content-wrapper">
        <div className="auth-left">
          <div className="logo-circle">
            <span className="logo-text">🌟</span>
          </div>
          <h1 className="app-title">SHINE <span className="up-text">UP</span></h1>
          <p className="app-tagline">
            <span className="welcome-text">Welcome to the Academic Shine UP</span><br />
            <span className="desc-text">
              Where brilliance meets opportunity.<br />
              Upload, share, and shine before you graduate!
            </span>
          </p>
          
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🎓</span>
              <span className="feature-text">Academic Portfolio</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💼</span>
              <span className="feature-text">Employer Connections</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <span className="feature-text">Career Launchpad</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⭐</span>
              <span className="feature-text">Skill Showcase</span>
            </div>
          </div>
          
          <div className="dev-pics">
            <img src="https://t2informatik.de/en/wp-content/uploads/sites/2/2019/07/development-team.jpg" alt="Developers" className="dev-img" />
            <p className="dev-caption">Meet the Opportunities Through Shine UP</p>
          </div>
        </div>
        
        <div className="auth-right">
          {isLogin ? (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <h2>Login to Your Account</h2>
              <p className="form-subtitle">Welcome back! Please enter your details.</p>
              
              <div className="input-group">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group">
                <input 
                  type="password" 
                  placeholder="Enter your password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>
              
              <div className="remember-me">
                <label>
                  <input type="checkbox" defaultChecked /> Remember me
                </label>
              </div>
              
              <button type="submit" disabled={isLoading}>
                {isLoading ? <div className="loading-spinner"></div> : 'Login'}
              </button>
              
              <p className="auth-switch">
                Don't have an account?{' '}
                <span className="auth-link" onClick={switchToRegister}>
                  Sign up here
                </span>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              <h2>Create Your Account</h2>
              <p className="form-subtitle">Join thousands of students showcasing their talents</p>
              
              <div className="input-group">
                <input 
                  type="text" 
                  name="fullName" 
                  placeholder="Full Name"
                  value={form.fullName} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group">
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Email Address"
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group">
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Create Password"
                  value={form.password} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group">
                <input 
                  type="text" 
                  name="university" 
                  placeholder="University Name"
                  value={form.university} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group">
                <input 
                  type="text" 
                  name="course" 
                  placeholder="Course/Program"
                  value={form.course} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group">
                <input 
                  type="number" 
                  name="year" 
                  placeholder="Year of Study"
                  value={form.year} 
                  onChange={handleChange} 
                  min="1" 
                  max="8" 
                  required 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group">
                <input 
                  type="text" 
                  name="studentId" 
                  placeholder="Student ID"
                  value={form.studentId} 
                  onChange={handleChange} 
                  required 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group">
                <input 
                  type="text" 
                  name="careerInterests" 
                  placeholder="Career Interests (e.g., Software Engineering, Data Science)"
                  value={form.careerInterests} 
                  onChange={handleChange} 
                  disabled={isLoading}
                />
              </div>
              
              <div className="input-group">
                <input 
                  type="tel" 
                  name="phone" 
                  placeholder="Phone Number (optional)"
                  value={form.phone} 
                  onChange={handleChange} 
                  disabled={isLoading}
                />
              </div>
              
              <button type="submit" disabled={isLoading}>
                {isLoading ? <div className="loading-spinner"></div> : 'Create Account'}
              </button>
              
              <p className="auth-switch">
                Already have an account?{' '}
                <span className="auth-link" onClick={switchToLogin}>
                  Login here
                </span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;