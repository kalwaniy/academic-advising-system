import { Router } from 'express';
import multer from 'multer';
import {getVPUserInfo} from '../VP/vpcontroller.js';
import { verifyToken } from '../middleware/auth.js';


const router = Router();

router.get('/user-infoo', verifyToken,getVPUserInfo );





export default router;