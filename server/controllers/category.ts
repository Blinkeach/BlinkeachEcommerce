import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertCategorySchema } from '@shared/schema';
import { z } from 'zod';

const categoryController = {
  // Get all categories
  getAllCategories: async (req: Request, res: Response) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  },

  // Get a specific category by ID
  getCategoryById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
      
      const category = await storage.getCategoryById(id);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ message: 'Failed to fetch category' });
    }
  },

  // Get a category by slug
  getCategoryBySlug: async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      
      if (!slug) {
        return res.status(400).json({ message: 'Invalid category slug' });
      }
      
      const category = await storage.getCategoryBySlug(slug);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error fetching category by slug:', error);
      res.status(500).json({ message: 'Failed to fetch category' });
    }
  },

  // Create a new category
  createCategory: async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertCategorySchema.parse(req.body);
      
      // Check if category with same name or slug already exists
      const existingCategory = await storage.getCategoryBySlug(validatedData.slug);
      if (existingCategory) {
        return res.status(400).json({ message: 'A category with this slug already exists' });
      }
      
      // Create category
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid category data', 
          errors: error.errors 
        });
      }
      
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Failed to create category' });
    }
  },

  // Update a category
  updateCategory: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
      
      // Validate request body (partial validation for updates)
      const validatedData = insertCategorySchema.partial().parse(req.body);
      
      // Check if category exists
      const existingCategory = await storage.getCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // If slug is being updated, check it's not already in use
      if (validatedData.slug && validatedData.slug !== existingCategory.slug) {
        const categoryWithSlug = await storage.getCategoryBySlug(validatedData.slug);
        if (categoryWithSlug && categoryWithSlug.id !== id) {
          return res.status(400).json({ message: 'A category with this slug already exists' });
        }
      }
      
      // Update category
      const category = await storage.updateCategory(id, validatedData);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid category data', 
          errors: error.errors 
        });
      }
      
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Failed to update category' });
    }
  },

  // Delete a category
  deleteCategory: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
      
      // Check if category exists
      const existingCategory = await storage.getCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Check if the category has subcategories
      const subcategories = await storage.getSubcategories(id);
      if (subcategories.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete category with subcategories. Please delete or reassign subcategories first.' 
        });
      }
      
      // Check if the category has associated products
      const categoryProducts = await storage.getProductsByCategoryId(id);
      if (categoryProducts.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete category with associated products. Please reassign products first.' 
        });
      }
      
      // Delete category
      const success = await storage.deleteCategory(id);
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete category' });
      }
      
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Failed to delete category' });
    }
  },

  // Get subcategories of a category
  getSubcategories: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
      
      // Check if category exists
      const existingCategory = await storage.getCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Get subcategories
      const subcategories = await storage.getSubcategories(id);
      res.json(subcategories);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      res.status(500).json({ message: 'Failed to fetch subcategories' });
    }
  },

  // Get products in a category
  getCategoryProducts: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
      
      // Check if category exists
      const existingCategory = await storage.getCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Get products
      const products = await storage.getProductsByCategoryId(id);
      res.json(products);
    } catch (error) {
      console.error('Error fetching category products:', error);
      res.status(500).json({ message: 'Failed to fetch category products' });
    }
  }
};

export default categoryController;