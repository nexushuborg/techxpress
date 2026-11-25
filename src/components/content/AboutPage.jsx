import React from 'react';
import './ContentPages.css';

export default function AboutPage({ onBack }) {
  return (
    <div className="content-page about-page">
      <button className="back-btn" onClick={onBack}>← BACK TO SEAT</button>
      
      <div className="content-container animate-fade-in">
        <header className="page-header">
          <h1>THE BRAHMAPUTRA <span>EXPEDITION</span></h1>
          <p className="subtitle">Crafting the Future of High-End Commerce.</p>
        </header>

        <section className="about-grid">
          <div className="about-card glass">
            <h3>OUR VISION</h3>
            <p>To redefine the digital landscape with cinematic, immersive experiences that bridge the gap between storytelling and utility.</p>
          </div>

          <div className="about-card glass">
            <h3>THE TECHNOLOGY</h3>
            <p>Powered by React, GSAP, and a custom 'Cover-Match' coordinate system, TechXpress deliver unmatched responsive precision.</p>
          </div>

          <div className="about-card glass">
            <h3>THE JOURNEY</h3>
            <p>From the platform zoom to the seat-side dashboard, every interaction is a measured step towards visual excellence.</p>
          </div>
        </section>

        <footer className="page-footer">
          <p>© 2026 TECHXPRESS SYSTEMS. ALL RIGHTS RESERVED.</p>
        </footer>
      </div>
    </div>
  );
}
