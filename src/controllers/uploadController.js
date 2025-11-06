import multer from 'multer';
import supabase from '../config/supabase.js';
import path from 'path';
import fs from 'fs';

const upload = multer({ dest: 'uploads/' });

export const uploadImage = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}${fileExt}`;
    const filePath = file.path;

    // Upload file to Supabase bucket
    const { data, error } = await supabase.storage
      .from('blog-images') // your Supabase bucket name
      .upload(fileName, fs.createReadStream(filePath), {
        contentType: file.mimetype,
      });

    // Delete local temp file
    fs.unlinkSync(filePath);

    if (error) throw error;

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    return res.status(200).json({
      message: 'Image uploaded successfully',
      url: publicData.publicUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

export { upload };
