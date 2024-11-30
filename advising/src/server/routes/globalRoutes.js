import { Router } from 'express';
import { login } from '../global/login.js'; 
import { verifyToken } from '../middleware/auth.js'; 
import { sendEmail } from '../utils/email.js'; // Import sendEmail function

const router = Router();

// Login route
router.post('/login', login);

// Protected route example (optional)
router.get('/protected', verifyToken, (req, res) => {
  res.json({ msg: 'This is a protected route', user: req.userName, role: req.userRole });
});

// Test Email Route
router.post('/send-test-email', async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    // Call the sendEmail function
    await sendEmail(to, subject, text);

    res.status(200).json({ msg: `Email sent successfully to ${to}` });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ msg: 'Failed to send email', error: error.message });
  }
});

export default router;
