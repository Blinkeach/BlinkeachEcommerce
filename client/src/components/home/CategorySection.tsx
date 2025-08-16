import React from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Home as HomeIcon,
  Building2,
  Palette,
  Tv,
  ShirtIcon,
  Zap,
  Baby,
} from "lucide-react";

interface Category {
  id: number;
  translationKey: string;
  icon: React.ReactNode;
  link: string;
}

const CategorySection: React.FC = () => {
  const { t } = useTranslation();

  const categories: Category[] = [
    {
      id: 1,
      translationKey: "categories.home",
      icon: <HomeIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-secondary" />,
      link: "/",
    },
    {
      id: 2,
      translationKey: "categories.home_office",
      icon: <Building2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-secondary" />,
      link: "/shop/home-office",
    },
    {
      id: 3,
      translationKey: "categories.arts_craft",
      icon: <Palette className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-secondary" />,
      link: "/shop/arts-craft",
    },
    {
      id: 4,
      translationKey: "categories.electronics",
      icon: <Tv className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-secondary" />,
      link: "/shop/electronics",
    },
    {
      id: 5,
      translationKey: "categories.fashion",
      icon: <ShirtIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-secondary" />,
      link: "/shop/fashion",
    },
    {
      id: 6,
      translationKey: "categories.appliances",
      icon: <Zap className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-secondary" />,
      link: "/shop/appliances",
    },
    {
      id: 7,
      translationKey: "categories.toys",
      icon: <Baby className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-secondary" />,
      link: "/shop/toy",
    },
  ];

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto mb-8">
      <h2 className="text-xl md:text-2xl font-semibold mb-6 text-center md:text-left">
        {t("categories.shop_by_category")}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
        {categories.map((category) => (
          <Link key={category.id} href={category.link}>
            <div className="flex flex-col items-center text-center p-2 sm:p-3 md:p-4 bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 bg-neutral-100 rounded-full flex items-center justify-center mb-2 md:mb-3">
                {category.icon}
              </div>
              <span className="text-xs sm:text-sm md:text-base text-neutral-800 font-medium leading-tight text-center break-words">
                {t(category.translationKey)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategorySection;
