import * as LucideIcons from 'lucide-react';
import React from 'react';

type IconComponent = React.ComponentType<{ className?: string }>;
const icons = LucideIcons as unknown as Record<string, IconComponent>;

export function getWeatherIcon(name: string): IconComponent {
  return icons[name] || LucideIcons.Cloud;
}
