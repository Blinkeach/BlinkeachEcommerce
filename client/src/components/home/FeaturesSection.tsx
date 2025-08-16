import React from "react";
import { Truck, RefreshCcw, ShieldCheck, Headphones } from "lucide-react";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: FeatureProps[] = [
  {
    icon: <Truck className="h-8 w-8 text-secondary" />,
    title: "Free Shipping",
    description: "On orders above ₹1",
  },
  {
    icon: <RefreshCcw className="h-8 w-8 text-secondary" />,
    title: "Easy Returns",
    description: "7-day return policy",
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-secondary" />,
    title: "Secure Payment",
    description: "100% secure checkout",
  },
  {
    icon: <Headphones className="h-8 w-8 text-secondary" />,
    title: "24/7 Support",
    description: "Dedicated customer service",
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-6 px-4 max-w-7xl mx-auto bg-white rounded-lg shadow-sm my-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-4"
          >
            <div className="text-3xl text-secondary mb-3">{feature.icon}</div>
            <h3 className="font-medium text-neutral-800 mb-1">
              {feature.title}
            </h3>
            <p className="text-sm text-neutral-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
