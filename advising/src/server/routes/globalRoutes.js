import { Router } from 'express';
import { login } from '../global/login.js'; 
import { verifyToken } from '../middleware/auth.js'; 

const router = Router();

// Login route
router.post('/login', login);

// Protected route example (optional)
router.get('/protected', verifyToken, (req, res) => {
  res.json({ msg: 'This is a protected route', user: req.userName, role: req.userRole });
});

export default router;
