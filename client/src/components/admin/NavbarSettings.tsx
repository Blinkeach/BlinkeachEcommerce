import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Image as ImageIcon, Link as LinkIcon, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface NavbarSettings {
  id?: number;
  logoImage: string;
  redirectLink: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const NavbarSettings: React.FC = () => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [redirectLink, setRedirectLink] = useState<string>('/');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current navbar settings
  const { data: currentSettings, isLoading } = useQuery<NavbarSettings>({
    queryKey: ['/api/navbar-settings']
  });

  // Update state when data loads
  React.useEffect(() => {
    if (currentSettings) {
      setRedirectLink(currentSettings.redirectLink || '/');
      setLogoPreview(currentSettings.logoImage);
    }
  }, [currentSettings]);

  // Update navbar settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/navbar-settings', {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update navbar settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/navbar-settings'] });
      toast({
        title: "Settings Updated",
        description: "Navbar settings have been updated successfully.",
      });
      setLogoFile(null);
      setUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploading(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData();
    
    if (logoFile) {
      formData.append('logoImage', logoFile);
    } else if (currentSettings?.logoImage) {
      formData.append('logoImage', currentSettings.logoImage);
    }
    
    formData.append('redirectLink', redirectLink);

    updateSettingsMutation.mutate(formData);
  };

  const resetToDefault = () => {
    setRedirectLink('/');
    setLogoFile(null);
    setLogoPreview('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading navbar settings...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Navbar Configuration
        </CardTitle>
        <CardDescription>
          Customize the navbar logo and set where users are redirected when they click on it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Image Section */}
          <div className="space-y-4">
            <Label htmlFor="logo" className="text-base font-medium">
              Navbar Logo
            </Label>
            
            {/* Current/Preview Logo */}
            {(logoPreview || currentSettings?.logoImage) && (
              <div className="flex items-center space-x-4">
                <div className="relative w-24 h-12 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={logoPreview || currentSettings?.logoImage}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/api/placeholder-image';
                    }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  Current logo
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose New Logo
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={resetToDefault}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset to Default
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {logoFile && (
              <div className="text-sm text-green-600">
                New logo selected: {logoFile.name}
              </div>
            )}
          </div>

          {/* Redirect Link Section */}
          <div className="space-y-2">
            <Label htmlFor="redirectLink" className="text-base font-medium flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Redirect Link
            </Label>
            <Input
              id="redirectLink"
              type="text"
              value={redirectLink}
              onChange={(e) => setRedirectLink(e.target.value)}
              placeholder="Enter redirect URL (e.g., /, /home, /products)"
              className="w-full"
            />
            <div className="text-xs text-gray-500">
              When users click on the navbar logo, they will be redirected to this URL.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={uploading || updateSettingsMutation.isPending}
              className="flex items-center gap-2"
            >
              {uploading || updateSettingsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {uploading || updateSettingsMutation.isPending ? 'Updating...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NavbarSettings;