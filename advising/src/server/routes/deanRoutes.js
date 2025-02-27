import { Router } from 'express';
import multer from 'multer';
import {getDeanUserInfo} from '../Dean/deanController.js';
import { verifyToken } from '../middleware/auth.js';


const router = Router();

router.get('/user-infoo', verifyToken,getDeanUserInfo);





export default router;