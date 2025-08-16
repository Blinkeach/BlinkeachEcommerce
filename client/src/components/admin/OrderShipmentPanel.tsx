import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Truck, Package, ExternalLink, MapPin, Phone, Mail, Weight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Order {
  id: number;
  userId: number;
  status: string;
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  trackingId?: string;
  trackingUrl?: string;
  createdAt: string;
}

interface OrderShipmentPanelProps {
  order: Order;
}

interface ShipmentRequest {
  orderId: number;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  deliveryAddress: string;
  city: string;
  state: string;
  pincode: string;
  weight: number;
  orderValue: number;
  isCod: boolean;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export default function OrderShipmentPanel({ order }: OrderShipmentPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customWeight, setCustomWeight] = useState<number>(1);
  const [customNotes, setCustomNotes] = useState<string>("");
  const queryClient = useQueryClient();

  const createShipmentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${order.id}/create-shipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight: customWeight,
          notes: customNotes
        })
      });
      return await response.json();
    },
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Shipment Created Successfully",
          description: `Tracking ID: ${response.trackingId}`,
        });
        // Refresh order data
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      } else {
        toast({
          title: "Shipment Creation Failed",
          description: response.message || "Unknown error occurred",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error Creating Shipment",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  });

  const trackShipmentMutation = useMutation({
    mutationFn: async (trackingId: string) => {
      const response = await fetch(`/api/delivery/track/${trackingId}`);
      return await response.json();
    },
    onSuccess: (response) => {
      if (response.success) {
        const status = response.status;
        const location = response.currentLocation;
        toast({
          title: "Tracking Updated",
          description: `Status: ${status} | Location: ${location}`,
        });
      } else {
        toast({
          title: "Tracking Failed",
          description: response.message || "Unable to fetch tracking information",
          variant: "destructive"
        });
      }
    }
  });

  const addressParts = order.shippingAddress.split(',').map(part => part.trim());
  const pincode = addressParts[addressParts.length - 1] || 'Unknown';
  const state = addressParts[addressParts.length - 2] || 'Unknown';
  const city = addressParts[addressParts.length - 3] || 'Unknown';

  const handleCreateShipment = () => {
    createShipmentMutation.mutate();
  };

  const handleTrackShipment = () => {
    if (order.trackingId) {
      trackShipmentMutation.mutate(order.trackingId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'shipped': return 'bg-purple-500';
      case 'out_for_delivery': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader 
        className="cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">Order #{order.id}</CardTitle>
              <CardDescription>
                {order.userName} • {new Date(order.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(order.status)} text-white`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {order.trackingId && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Truck className="h-3 w-3 mr-1" />
                Shipped
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Order Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Details
              </h4>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <p className="font-medium">{order.userName}</p>
                <p className="text-sm text-gray-600">{order.shippingAddress}</p>
                <div className="flex gap-4 text-sm">
                  <span><strong>City:</strong> {city}</span>
                  <span><strong>State:</strong> {state}</span>
                  <span><strong>PIN:</strong> {pincode}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Contact Information</h4>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                {order.userPhone && (
                  <p className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3" />
                    {order.userPhone}
                  </p>
                )}
                {order.userEmail && (
                  <p className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3" />
                    {order.userEmail}
                  </p>
                )}
                <p className="text-sm">
                  <strong>Payment:</strong> {order.paymentMethod.toUpperCase()}
                </p>
                <p className="text-sm">
                  <strong>Amount:</strong> ₹{(order.totalAmount / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Shipment Section */}
          {!order.trackingId ? (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Create Shipment
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="weight" className="flex items-center gap-2">
                    <Weight className="h-3 w-3" />
                    Package Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={customWeight}
                    onChange={(e) => setCustomWeight(parseFloat(e.target.value) || 1)}
                    placeholder="Enter package weight"
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Special Instructions</Label>
                  <Textarea
                    id="notes"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Additional notes for delivery partner"
                    rows={2}
                  />
                </div>
              </div>

              <Button 
                onClick={handleCreateShipment}
                disabled={createShipmentMutation.isPending || order.status === 'cancelled'}
                className="w-full md:w-auto"
              >
                {createShipmentMutation.isPending ? (
                  "Creating Shipment..."
                ) : (
                  <>
                    <Truck className="h-4 w-4 mr-2" />
                    Create Shipment with Delhivery
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Shipment Information
              </h4>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-green-800">Shipment Created</p>
                    <p className="text-sm text-green-600">
                      Tracking ID: <span className="font-mono">{order.trackingId}</span>
                    </p>
                  </div>
                  <Badge className="bg-green-500 text-white">
                    <Truck className="h-3 w-3 mr-1" />
                    Shipped
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleTrackShipment}
                    disabled={trackShipmentMutation.isPending}
                  >
                    {trackShipmentMutation.isPending ? "Tracking..." : "Update Tracking"}
                  </Button>
                  
                  {order.trackingUrl && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(order.trackingUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on Delhivery
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}