import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Signup form state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    department: '',
    password: '',
    confirmPassword: ''
  });
  
  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      // If backend is not ready, simulate login with mock data for development
      if (!response.ok && response.status === 404) {
        // Mock login for development
        const mockToken = 'mock-jwt-token-' + Date.now();
        const mockUser = {
          id: 1,
          name: 'Abhay Bapodara',
          email: loginData.email,
          role: 'Admin', // Can be changed to test different roles
          department: 'IT'
        };
        
        localStorage.setItem('authToken', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        navigate('/dashboard');
        return;
      }
      
      const result = await response.json();
      
      if (result.error) {
        alert(result.error.message);
        return;
      }
      
      // Store JWT token
      localStorage.setItem('authToken', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      // Mock login as fallback for development
      const mockToken = 'mock-jwt-token-' + Date.now();
      const mockUser = {
        id: 1,
        name: 'Abhay Bapodara',
        email: loginData.email,
        role: 'Admin',
        department: 'IT'
      };
      
      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          department: signupData.department,
          password: signupData.password
          // Note: No role field - always creates Employee role
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        alert(result.error.message);
        return;
      }
      
      // Show success toast and switch to login
      alert('Account created successfully! Please log in.');
      setIsSignupMode(false);
      setLoginData({ email: signupData.email, password: '' });
      setSignupData({
        name: '',
        email: '',
        department: '',
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      alert('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    // Simulate password reset for hackathon
    console.log(`Password reset link sent to: ${resetEmail}`);
    alert(`Password reset link sent to ${resetEmail}`);
    setShowForgotPassword(false);
    setResetEmail('');
  };

  const toggleMode = () => {
    setIsSignupMode(!isSignupMode);
    // Reset forms when toggling
    setLoginData({ email: '', password: '' });
    setSignupData({
      name: '',
      email: '',
      department: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center p-4">
      {/* Animated Card */}
      <div 
        className="w-full max-w-md animate-fade-scale-in"
        key={isSignupMode ? 'signup' : 'login'}
      >
        <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg shadow-2xl p-8">
          {/* Logo/Avatar */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">AF</span>
            </div>
          </div>

          {/* Login Mode */}
          {!isSignupMode && (
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-400 hover:text-blue-300 transition"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2A2A32]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#17171C] text-gray-400">New here?</span>
                </div>
              </div>

              {/* Info Callout */}
              <div className="p-3 bg-[#1A1A22] border border-[#2A2A32] rounded-lg">
                <p className="text-sm text-gray-400 text-center">
                  Sign up creates an employee account — admin roles are assigned later.
                </p>
              </div>

              {/* Create Account Button */}
              <button
                type="button"
                onClick={toggleMode}
                className="w-full py-3 bg-transparent border-2 border-[#2A2A32] hover:border-blue-500 text-gray-300 hover:text-white font-medium rounded-lg transition"
              >
                Create Account
              </button>
            </form>
          )}

          {/* Signup Mode */}
          {isSignupMode && (
            <form onSubmit={handleSignup} className="space-y-5">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Department Dropdown */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-300 mb-2">
                  Department
                </label>
                <select
                  id="department"
                  required
                  value={signupData.department}
                  onChange={(e) => setSignupData({ ...signupData, department: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="">Select department</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  required
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Info Callout */}
              <div className="p-3 bg-[#1A1A22] border border-[#2A2A32] rounded-lg">
                <p className="text-sm text-gray-400 text-center">
                  Sign up creates an employee account — admin roles are assigned later.
                </p>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2A2A32]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#17171C] text-gray-400">Already have an account?</span>
                </div>
              </div>

              {/* Back to Login Button */}
              <button
                type="button"
                onClick={toggleMode}
                className="w-full py-3 bg-transparent border-2 border-[#2A2A32] hover:border-blue-500 text-gray-300 hover:text-white font-medium rounded-lg transition"
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-6 w-full max-w-md animate-fade-scale-in">
            <h3 className="text-xl font-semibold text-white mb-4">Reset Password</h3>
            <form onSubmit={handleForgotPassword}>
              <div className="mb-4">
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0F0F12] border border-[#2A2A32] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 py-2.5 bg-transparent border border-[#2A2A32] hover:border-gray-400 text-gray-300 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeScaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-scale-in {
          animation: fadeScaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
