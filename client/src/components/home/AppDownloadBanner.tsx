import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const AppDownloadBanner: React.FC = () => {
  return (
    <section className="py-6 px-4 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-secondary to-secondary-dark rounded-lg overflow-hidden">
        <div className="flex flex-col md:flex-row items-center p-6 md:p-8">
          <div className="md:w-2/3 text-white mb-6 md:mb-0 md:pr-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Shop On the Go!</h2>
            <p className="text-white/90 mb-4">
              Download the Blinkeach app for a seamless shopping experience. 
              Get exclusive app-only offers and faster checkout.
            </p>
            <div className="flex flex-wrap gap-3">
              <a 
                href="#" 
                className="bg-black rounded-md px-4 py-2 inline-flex items-center"
                aria-label="Download on the App Store"
              >
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"></path>
                </svg>
                <div>
                  <div className="text-xs">Download on the</div>
                  <div className="text-sm font-medium">App Store</div>
                </div>
              </a>
              <a 
                href="#" 
                className="bg-black rounded-md px-4 py-2 inline-flex items-center"
                aria-label="Get it on Google Play"
              >
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="white">
                  <path d="m3 20.69 18-10.37L3 3.19v17.5z"></path>
                  <path d="M3 20.69V3.19l8.38 8.75L3 20.69zm0 0 18-10.37-8.38 8.75L3 20.69z"></path>
                  <path d="M3 3.19 11.38 12 3 20.69V3.19z"></path>
                </svg>
                <div>
                  <div className="text-xs">Get it on</div>
                  <div className="text-sm font-medium">Google Play</div>
                </div>
              </a>
            </div>
          </div>
          <div className="md:w-1/3 flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" 
              alt="Mobile App" 
              className="h-60 object-contain" 
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownloadBanner;
