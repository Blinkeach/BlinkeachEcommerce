import React from 'react';
import { Helmet } from 'react-helmet';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const AboutUsPage: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Helmet>
        <title>{t("about.title")} - Blinkeach</title>
        <meta name="description" content={t("about.meta_description")} />
      </Helmet>

      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {t("legal.back_to_home")}
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6">{t("about.title")}</h1>
      
      <div className="prose max-w-none">
        <h2>{t("about.our_story")}</h2>
        <p>
          {t("about.story_content")}
        </p>
        
        <h2>{t("about.our_mission")}</h2>
        <p>
          {t("about.mission_content")}
        </p>
        
        <h2>{t("about.our_values")}</h2>
        <ul>
          <li>
            <strong>{t("about.value_customer")}:</strong> {t("about.value_customer_desc")}
          </li>
          <li>
            <strong>{t("about.value_quality")}:</strong> {t("about.value_quality_desc")}
          </li>
          <li>
            <strong>{t("about.value_innovation")}:</strong> {t("about.value_innovation_desc")}
          </li>
          <li>
            <strong>{t("about.value_inclusivity")}:</strong> {t("about.value_inclusivity_desc")}
          </li>
          <li>
            <strong>{t("about.value_responsibility")}:</strong> {t("about.value_responsibility_desc")}
          </li>
        </ul>
        
        <h2>{t("about.our_team")}</h2>
        <p>
          {t("about.team_content")}
        </p>
        
        <h2>{t("about.our_achievements")}</h2>
        <p>
          {t("about.achievements_content")}
        </p>
        
        <h2>{t("about.join_us")}</h2>
        <p>
          {t("about.join_us_content")}
        </p>
      </div>
    </div>
  );
};

export default AboutUsPage;