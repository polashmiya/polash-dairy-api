import express from 'express';
import { upload, uploadImage } from '../controllers/uploadController.js';

const router = express.Router();

/**
 * @openapi
 * /api/upload:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload an image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Image uploaded successfully
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 */
router.post('/', upload.single('image'), uploadImage);

export default router;