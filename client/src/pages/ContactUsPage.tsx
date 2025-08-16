import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft, Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const ContactUsPage: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const contactMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("contact.message_sent"),
        description: t("contact.thank_you_message"),
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Helmet>
        <title>{t("contact.title")} - Blinkeach</title>
        <meta name="description" content={t("contact.meta_description")} />
      </Helmet>

      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {t("back_to_home")}
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6">{t("contact.title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {t("contact.get_in_touch")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("contact.get_in_touch_description")}
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <h3 className="font-medium">{t("contact.email_us")}</h3>
                <p className="text-sm text-muted-foreground">
                  support@blinkeach.com
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <h3 className="font-medium">{t("contact.call_us")}</h3>
                <p className="text-sm text-muted-foreground">+91 8274019912</p>
                <p className="text-sm text-muted-foreground">
                  {t("contact.business_hours")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <h3 className="font-medium">{t("contact.visit_us")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("contact.headquarters")}
                  <br />
                  {t("contact.address_line1")}
                  <br />
                  {t("contact.address_line2")} <br />
                  {t("contact.address_line3")} <br />
                  {t("contact.address_line4")}
                  <br />
                  {t("contact.address_line5")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <h3 className="font-medium">{t("contact.live_chat")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("contact.live_chat_availability")}
                  <br />
                  {t("contact.live_chat_hours")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t("contact.send_message")}</CardTitle>
              <CardDescription>{t("contact.form_description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      {t("contact.name")}
                    </label>
                    <Input
                      id="name"
                      placeholder={t("contact.name_placeholder")}
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      {t("contact.email")}
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("contact.email_placeholder")}
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    {t("contact.phone")}
                  </label>
                  <Input
                    id="phone"
                    placeholder={t("contact.phone_placeholder")}
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    {t("contact.subject")}
                  </label>
                  <Input
                    id="subject"
                    placeholder={t("contact.subject_placeholder")}
                    value={formData.subject}
                    onChange={(e) =>
                      handleInputChange("subject", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    {t("contact.message")}
                  </label>
                  <Textarea
                    id="message"
                    placeholder={t("contact.message_placeholder")}
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      handleInputChange("message", e.target.value)
                    }
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={contactMutation.isPending}
                >
                  {contactMutation.isPending ? "Sending..." : t("submit")}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center text-xs text-muted-foreground">
              {t("contact.form_footer")}
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">{t("contact.faq_title")}</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">
              {t("contact.faq_business_hours_question")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("contact.faq_business_hours_answer")}
            </p>
          </div>

          <div>
            <h3 className="font-medium">
              {t("contact.faq_track_order_question")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("contact.faq_track_order_answer")}
            </p>
          </div>

          <div>
            <h3 className="font-medium">
              {t("contact.faq_return_policy_question")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("contact.faq_return_policy_answer")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
