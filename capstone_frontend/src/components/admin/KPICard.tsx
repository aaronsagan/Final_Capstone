import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  to?: string;
  variant?: "emerald" | "blue" | "purple" | "pink" | "amber";
}

export const KPICard = ({ title, value, icon: Icon, description, trend, to, variant = "emerald" }: KPICardProps) => {
  const variants: Record<string, string> = {
    emerald:
      "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200/60 dark:border-emerald-700/40",
    blue:
      "bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-800/10 border-sky-200/60 dark:border-sky-700/40",
    purple:
      "bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/10 border-violet-200/60 dark:border-violet-700/40",
    pink:
      "bg-gradient-to-br from-fuchsia-50 to-pink-100 dark:from-fuchsia-900/20 dark:to-fuchsia-800/10 border-pink-200/60 dark:border-fuchsia-700/40",
    amber:
      "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 border-amber-200/60 dark:border-amber-700/40",
  };

  const Container = to ? Link : ("div" as any);
  const containerProps: any = to ? { to } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Container {...containerProps} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-xl">
        <Card className={`group border ${variants[variant]} transition-all hover:shadow-lg hover:-translate-y-0.5`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-background/60 dark:bg-background/20 flex items-center justify-center ring-1 ring-border group-hover:scale-105 transition-transform">
              <Icon className="h-4 w-4 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <div className={`text-xs mt-2 ${trend.positive ? "text-green-600" : "text-red-600"}`}>
                {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% from last month
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
    </motion.div>
  );
};
