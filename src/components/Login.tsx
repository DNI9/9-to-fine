import React, { useState } from "react";

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement OTP sending functionality
    setIsOtpSent(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement OTP verification functionality
    onLogin(); // Call the onLogin callback when verification is successful
  };

  return (
    <div className="login-container">
      <div className="login-heading">
        <span className="login-heading-small">login to</span>
        <span className="login-heading-large">9-to-fine</span>
      </div>
      {!isOtpSent ? (
        <form onSubmit={handleSendOtp}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <button type="submit">Send OTP</button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <div className="form-group">
            <label htmlFor="otp">Enter OTP</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
              placeholder="Enter OTP"
              maxLength={6}
            />
          </div>
          <button type="submit">Verify OTP</button>
        </form>
      )}
    </div>
  );
};

export default Login;
