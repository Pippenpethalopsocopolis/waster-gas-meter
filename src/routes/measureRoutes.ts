import express from 'express';
import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { uploadImage, confirmMeasureValue, listMeasures } from '../controllers/measureController.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

router.post('/upload', uploadImage);
router.patch('/confirm', confirmMeasureValue);
router.get('/:customer_code/list', listMeasures);
router.use('/images', express.static(path.join(__dirname, '../../', 'images')));

export default router;