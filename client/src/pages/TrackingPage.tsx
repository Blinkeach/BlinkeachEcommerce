import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, MapPin, Clock, CheckCircle, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TrackingUpdate {
  timestamp: Date;
  status: string;
  location: string;
  description: string;
}

interface TrackingInfo {
  success: boolean;
  trackingId: string;
  status: string;
  currentLocation: string;
  updates: TrackingUpdate[];
  estimatedDelivery?: Date;
  message?: string;
  errors?: string[];
}

const statusConfig = {
  'picked_up': { label: 'Picked Up', color: 'bg-blue-500', icon: Package },
  'in_transit': { label: 'In Transit', color: 'bg-yellow-500', icon: Truck },
  'out_for_delivery': { label: 'Out for Delivery', color: 'bg-orange-500', icon: MapPin },
  'delivered': { label: 'Delivered', color: 'bg-green-500', icon: CheckCircle },
  'returned': { label: 'Returned', color: 'bg-red-500', icon: Package },
  'cancelled': { label: 'Cancelled', color: 'bg-gray-500', icon: Package }
};

export default function TrackingPage() {
  const { t } = useTranslation();
  const [trackingId, setTrackingId] = useState("");
  const [submittedTrackingId, setSubmittedTrackingId] = useState("");

  const { data: trackingInfo, isLoading, error } = useQuery<TrackingInfo>({
    queryKey: ['/api/delivery/track', submittedTrackingId],
    enabled: !!submittedTrackingId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      setSubmittedTrackingId(trackingId.trim());
    }
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: 'bg-gray-500',
      icon: Package
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your tracking ID to get real-time updates on your shipment
          </p>
        </div>

        {/* Tracking Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Track Shipment
            </CardTitle>
            <CardDescription>
              Enter your tracking ID or waybill number to track your order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-4">
              <Input
                type="text"
                placeholder="Enter tracking ID (e.g., DHL123456789)"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!trackingId.trim() || isLoading}>
                {isLoading ? "Tracking..." : "Track Order"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tracking Results */}
        {submittedTrackingId && (
          <>
            {error && (
              <Card className="mb-8 border-red-200">
                <CardContent className="pt-6">
                  <div className="text-center text-red-600">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Tracking Error</h3>
                    <p>Unable to fetch tracking information. Please check your tracking ID and try again.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {trackingInfo && !trackingInfo.success && (
              <Card className="mb-8 border-yellow-200">
                <CardContent className="pt-6">
                  <div className="text-center text-yellow-600">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Information Found</h3>
                    <p>{trackingInfo.message || "No tracking information available for this ID."}</p>
                    {trackingInfo.errors && trackingInfo.errors.length > 0 && (
                      <ul className="mt-2 text-sm">
                        {trackingInfo.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {trackingInfo && trackingInfo.success && (
              <>
                {/* Current Status */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Tracking ID: {trackingInfo.trackingId}</span>
                      <Badge className={`${getStatusConfig(trackingInfo.status).color} text-white`}>
                        {getStatusConfig(trackingInfo.status).label}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Current Location</p>
                            <p className="text-muted-foreground">{trackingInfo.currentLocation}</p>
                          </div>
                        </div>
                        {trackingInfo.estimatedDelivery && (
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Estimated Delivery</p>
                              <p className="text-muted-foreground">
                                {new Date(trackingInfo.estimatedDelivery).toLocaleDateString('en-IN', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-center">
                        {React.createElement(getStatusConfig(trackingInfo.status).icon, {
                          className: `h-16 w-16 ${getStatusConfig(trackingInfo.status).color.replace('bg-', 'text-')}`
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tracking Timeline */}
                {trackingInfo.updates && trackingInfo.updates.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tracking History</CardTitle>
                      <CardDescription>
                        Complete timeline of your shipment journey
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {trackingInfo.updates.map((update, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${
                                index === 0 ? 'bg-primary' : 'bg-muted-foreground'
                              }`} />
                              {index < trackingInfo.updates.length - 1 && (
                                <div className="w-px h-8 bg-muted-foreground/30 mt-2" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium">{update.description}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(update.timestamp).toLocaleString('en-IN')}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground">{update.location}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Can't find your tracking ID?</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Your tracking ID is usually sent via email or SMS once your order is shipped. 
                  Check your order confirmation or shipping notification.
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Check Order Status
                </Button>
              </div>
              <div>
                <h4 className="font-medium mb-2">Contact Support</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  If you're having trouble tracking your order or need assistance, 
                  our support team is here to help.
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}