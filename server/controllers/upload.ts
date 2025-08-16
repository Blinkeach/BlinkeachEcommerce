import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import multer from "multer";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Define multer storage
const storage = multer.memoryStorage();

// Create multer upload instance for images
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Check if the file is an allowed image type
    if (file.mimetype.startsWith('image/jpeg') || 
        file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg') {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only JPG, JPEG, and PNG files are allowed'));
    }
  }
});

// Create multer upload instance for 3D models
export const upload3d = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size for 3D models
  },
  fileFilter: (req, file, cb) => {
    // Check if the file is an allowed 3D model type
    const allowed3dTypes = [
      'model/gltf-binary',
      'model/gltf+json', 
      'application/octet-stream', // for .glb, .obj files
      'text/plain' // for some .obj files
    ];
    
    const fileExt = file.originalname.toLowerCase();
    const valid3dExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.dae'];
    const hasValidExtension = valid3dExtensions.some(ext => fileExt.endsWith(ext));
    
    if (hasValidExtension) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only GLB, GLTF, OBJ, FBX, and DAE files are allowed'));
    }
  }
});

const uploadController = {
  uploadImage: async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate a unique filename
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png'];
      
      if (!validExtensions.includes(fileExtension)) {
        return res.status(400).json({ 
          message: "Invalid file type. Only JPG, JPEG, and PNG files are allowed." 
        });
      }

      const uniqueFilename = `${randomUUID()}${fileExtension}`;
      const filePath = path.join(uploadDir, uniqueFilename);
      
      // Save the file
      fs.writeFileSync(filePath, file.buffer);
      
      // Generate URL to the uploaded file
      const fileUrl = `/uploads/${uniqueFilename}`;
      
      res.status(201).json({ 
        message: "File uploaded successfully", 
        url: fileUrl 
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  },

  uploadMultipleImages: async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const validExtensions = ['.jpg', '.jpeg', '.png'];
      const uploadResults = [];
      
      // Process each file
      for (const file of files) {
        // Check file extension
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (!validExtensions.includes(fileExtension)) {
          continue; // Skip invalid files
        }

        // Generate a unique filename
        const uniqueFilename = `${randomUUID()}${fileExtension}`;
        const filePath = path.join(uploadDir, uniqueFilename);
        
        // Save the file
        fs.writeFileSync(filePath, file.buffer);
        
        // Generate URL to the uploaded file
        const fileUrl = `/uploads/${uniqueFilename}`;
        
        uploadResults.push({
          originalName: file.originalname,
          url: fileUrl
        });
      }
      
      if (uploadResults.length === 0) {
        return res.status(400).json({ 
          message: "No valid files were uploaded. Only JPG, JPEG, and PNG files are allowed." 
        });
      }
      
      res.status(201).json({ 
        message: `${uploadResults.length} files uploaded successfully`, 
        files: uploadResults 
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  },

  upload3dModel: async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No 3D model file uploaded" });
      }

      // Generate a unique filename
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const valid3dExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.dae'];
      
      if (!valid3dExtensions.includes(fileExtension)) {
        return res.status(400).json({ 
          message: "Invalid file type. Only GLB, GLTF, OBJ, FBX, and DAE files are allowed." 
        });
      }

      const uniqueFilename = `${randomUUID()}${fileExtension}`;
      const filePath = path.join(uploadDir, uniqueFilename);
      
      // Save the file
      fs.writeFileSync(filePath, file.buffer);
      
      // Generate URL to the uploaded file
      const fileUrl = `/uploads/${uniqueFilename}`;
      
      res.status(201).json({ 
        message: "3D model uploaded successfully", 
        url: fileUrl,
        originalName: file.originalname,
        size: file.size,
        type: fileExtension.slice(1) // Remove the dot
      });
    } catch (error) {
      console.error("Error uploading 3D model:", error);
      res.status(500).json({ message: "Failed to upload 3D model" });
    }
  }
};

export default uploadController;