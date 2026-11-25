import React from 'react';
import './ContentPages.css';

export default function RegisterPage({ onBack }) {
  return (
    <div className="content-page register-page">
      <button className="back-btn" onClick={onBack}>← BACK TO SEAT</button>

      <div className="content-container animate-slide-up">
        <div className="register-form-box glass">
          <header className="form-header">
            <h2>JOIN THE JOURNEY</h2>
            <p>Initialize your Brahmaputra Expedition credentials.</p>
          </header>

          <form className="premium-form" onSubmit={(e) => e.preventDefault()}>
            <div className="input-group">
              <label>FULL NAME</label>
              <input type="text" placeholder="Enter your name" />
            </div>

            <div className="input-group">
              <label>EMAIL ADDRESS</label>
              <input type="email" placeholder="email@expedition.com" />
            </div>

            <div className="input-group">
              <label>EXPEDITION ROLE</label>
              <select>
                <option>RETAIL VENDOR</option>
                <option>PRODUCT DESIGNER</option>
                <option>DEVELOPER</option>
                <option>EXPLORER</option>
              </select>
            </div>

            <button type="submit" className="submit-btn highlight-btn">
              SUBMIT CREDENTIALS
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
