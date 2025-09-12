import React, { useState, useEffect } from 'react';
import styles from './ContactUsSection.module.css';

export default function ContactUsSection({ apiBaseUrl }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [userQueries, setUserQueries] = useState([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'error'|'success', text: '' }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchUserQueries = async () => {
    setLoadingQueries(true);
    setFeedback(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/support-queries/user`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUserQueries(data);
    } catch (err) {
      console.error('[Fetch User Queries Error]', err);
      setFeedback({ type: 'error', text: 'Failed to load your queries.' });
    } finally {
      setLoadingQueries(false);
    }
  };

  useEffect(() => {
    fetchUserQueries();
  }, [apiBaseUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/support-queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.msg || `HTTP ${res.status}`);
      }
      setFeedback({ type: 'success', text: 'Query submitted successfully.' });
      setFormData({ name: '', email: '', subject: '', message: '' }); // Clear form
      fetchUserQueries();
    } catch (err) {
      console.error('[Submit Query Error]', err);
      setFeedback({ type: 'error', text: 'Failed to submit query.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Contact Support</h1>

      <div className={styles.contactInfo}>
        <p>Welcome to the NCC Portal! For any inquiries, support, or feedback, please reach out to us using the details below.</p>
        <p><strong>Email:</strong> <a href="mailto:gitam.nccportal@gmail.com">student@nccportal.com</a></p>
        <p><strong>Phone:</strong> <a href="tel:9160308520">9160308520</a></p>
        <p><strong>Address:</strong> NCC OFFICE, Near Blue Bells Canteen, GITAM University</p>
        <p><strong>Office Hours:</strong> Monday to Friday, 9:00 AM – 5:00 PM (Closed on public holidays)</p>
        <p><strong>Emergency Contact:</strong> <a href="tel:9876543210">9876543210</a> (For urgent matters only)</p>
      </div>

      <h2 className={styles.sectionTitle}>Send Us a Message</h2>
      
      {feedback && (
        <div className={
          `${styles.feedback}
          ${feedback.type === 'error' ? styles.error : styles.success}`
        }>
          {feedback.text}
        </div>
      )}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email Address"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="subject"
          placeholder="Subject"
          value={formData.subject}
          onChange={handleInputChange}
          required
        />
        <textarea
          name="message"
          rows="5"
          placeholder="Your Message"
          value={formData.message}
          onChange={handleInputChange}
          required
        ></textarea>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      <h2 className={styles.sectionTitle}>Your Previous Queries</h2>
      {loadingQueries ? (
        <p className={styles.loadingText}>Loading...</p>
      ) : userQueries.length === 0 ? (
        <p className={styles.noData}>You have not submitted any queries yet.</p>
      ) : (
        <div className={styles.listWrapper}>
          {userQueries.map((q) => (
            <div key={q.query_id} className={styles.queryCard}>
              <div className={styles.queryHeader}>
                <span className={styles.queryDate}>
                  {new Date(q.created_at).toLocaleDateString()}{' '}
                  {new Date(q.created_at).toLocaleTimeString()}
                </span>
                <span className={`${styles.status} ${q.status === 'Resolved' ? styles.resolved : styles.pending}`}>
                  Status: <strong>{q.status}</strong>
                </span>
              </div>
              <p className={styles.userMessage}><strong>Your message:</strong> {q.message}</p>
              {q.response ? (
                <p className={styles.adminResponse}><strong>Response:</strong> {q.response}</p>
              ) : (
                <p className={styles.pending}>Awaiting response...</p>
              )}
            </div>
          ))}
        </div>
      )}
      
      <h2 className={styles.sectionTitle}>Visit Us</h2>
      <div className={styles.map}>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.1234567890123!2d83.12345678901234!3d17.123456789012345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDA3JzI0LjQiTiA4M8KwMDcnMjQuNCJF!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin"
          allowFullScreen=""
          loading="lazy"
          title="NCC Office Map"
        ></iframe>
      </div>
      
      <div className={styles.socialMedia}>
        <p>Follow us on Instagram: <a href="https://www.instagram.com/gitam_ncc_ctr" target="_blank" rel="noreferrer">@gitam_ncc_ctr</a></p>
      </div>
      
      <div className={styles.footerLinks}>
        <a href="about-us.html">About Us</a> |
        <a href="faq.html">FAQs</a> |
        <a href="privacy-policy.html">Privacy Policy</a> |
        <a href="terms-of-service.html">Terms of Service</a>
      </div>
    </div>
  );
}
