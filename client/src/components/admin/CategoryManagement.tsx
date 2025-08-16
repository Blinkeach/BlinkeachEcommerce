import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, Trash2, Plus, Edit, Search, ArrowUpDown } from 'lucide-react';
import { Category, InsertCategory } from '@shared/schema';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';

// Form validation schema
const categorySchema = z.object({
  name: z.string().min(2, { message: 'Category name must be at least 2 characters' }),
  slug: z.string().min(2, { message: 'Slug must be at least 2 characters' }).regex(/^[a-z0-9-]+$/, { message: 'Slug must contain only lowercase letters, numbers, and hyphens' }),
  description: z.string().optional(),
  image: z.string().optional(),
  parent_id: z.number().optional().nullable(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().default(0),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const CategoryManagement: React.FC = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'displayOrder'>('displayOrder');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  // Fetch categories
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/admin/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/categories');
      return response.json();
    },
  });

  // Form for creating/editing categories
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image: '',
      parent_id: null,
      isActive: true,
      displayOrder: 0,
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const response = await apiRequest('POST', '/api/admin/categories', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Category created',
        description: 'Category has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create category',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCategory> }) => {
      const response = await apiRequest('PUT', `/api/admin/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Category updated',
        description: 'Category has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update category',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/categories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Category deleted',
        description: 'Category has been deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete category',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CategoryFormValues) => {
    if (currentCategory) {
      updateCategoryMutation.mutate({ id: currentCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
      parent_id: category.parent_id || null,
      isActive: category.isActive,
      displayOrder: category.displayOrder,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteCategory = (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleAddNewCategory = () => {
    setCurrentCategory(null);
    form.reset({
      name: '',
      slug: '',
      description: '',
      image: '',
      parent_id: null,
      isActive: true,
      displayOrder: 0,
    });
    setIsDialogOpen(true);
  };

  const handleGenerateSlug = () => {
    const name = form.getValues('name');
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      form.setValue('slug', slug);
    }
  };

  // Filter and sort categories
  const filteredCategories = categories
    ? categories
        .filter((category) =>
          category.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
          const aValue = a[sortField];
          const bValue = b[sortField];
          
          if (sortField === 'displayOrder') {
            return sortDirection === 'asc' 
              ? (aValue as number) - (bValue as number)
              : (bValue as number) - (aValue as number);
          } else {
            return sortDirection === 'asc' 
              ? (aValue as string).localeCompare(bValue as string)
              : (bValue as string).localeCompare(aValue as string);
          }
        })
    : [];

  const handleSort = (field: 'name' | 'displayOrder') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('Category Management')}</h1>
        <Button onClick={handleAddNewCategory}>
          <Plus className="mr-2 h-4 w-4" />
          {t('Add New Category')}
        </Button>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('Search categories...')}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Categories')}</CardTitle>
          <CardDescription>
            {t('Manage your product categories and subcategories.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center">
                    {t('Name')}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('displayOrder')}>
                  <div className="flex items-center">
                    {t('Display Order')}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchQuery
                      ? `No categories found matching "${searchQuery}"`
                      : 'No categories have been created yet.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.id}</TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell>
                      {category.parent_id && categories
                        ? categories.find((c) => c.id === category.parent_id)?.name || 'N/A'
                        : 'None'}
                    </TableCell>
                    <TableCell>{category.displayOrder}</TableCell>
                    <TableCell>
                      {category.isActive ? (
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {currentCategory ? t('Edit Category') : t('Add New Category')}
            </DialogTitle>
            <DialogDescription>
              {currentCategory
                ? t('Edit the details of the selected category.')
                : t('Create a new category for organizing products.')}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('Enter category name')} />
                    </FormControl>
                    <FormDescription>
                      {t('This is how the category will appear to customers.')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t('Slug')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('enter-slug-here')} />
                      </FormControl>
                      <FormDescription>
                        {t('Used in URLs. Only lowercase letters, numbers and hyphens.')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-8"
                  onClick={handleGenerateSlug}
                >
                  {t('Generate')}
                </Button>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Description')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t('Enter category description (optional)')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Image URL')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('Enter image URL (optional)')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Parent Category')}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                      defaultValue={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('Select parent category (optional)')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {categories &&
                          categories
                            .filter((c) => !currentCategory || c.id !== currentCategory.id)
                            .map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('Select a parent category to create a hierarchical structure.')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Display Order')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('Controls the order of display. Lower numbers appear first.')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-5">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t('Active')}</FormLabel>
                        <FormDescription>
                          {t('Inactive categories will not be visible to customers.')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="mt-6 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createCategoryMutation.isPending || updateCategoryMutation.isPending
                  }
                >
                  {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {currentCategory ? t('Update Category') : t('Create Category')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManagement;