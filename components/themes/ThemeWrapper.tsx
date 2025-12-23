'use client';

import { ReactNode } from 'react';
import { BarThemeModern } from './BarThemeModern';
import { BarThemeClassic } from './BarThemeClassic';
import { BarThemeMid } from './BarThemeMid';
import { PizzaThemeModern } from './PizzaThemeModern';
import { PizzaThemeClassic } from './PizzaThemeClassic';
import { PizzaThemeMid } from './PizzaThemeMid';
import { SushiTheme } from './SushiTheme';
import { GenericTheme } from './GenericTheme';
import { GoldTheme } from './GoldTheme';

export default function ThemeWrapper({
  template,
  children,
}: {
  template: string;
  children: ReactNode;
}) {
  // Handle new template names
  switch (template) {
    case 'bar-modern':
      return <BarThemeModern>{children}</BarThemeModern>;
    case 'bar-classic':
      return <BarThemeClassic>{children}</BarThemeClassic>;
    case 'bar-mid':
      return <BarThemeMid>{children}</BarThemeMid>;
    case 'pizza-modern':
      return <PizzaThemeModern>{children}</PizzaThemeModern>;
    case 'pizza-classic':
      return <PizzaThemeClassic>{children}</PizzaThemeClassic>;
    case 'pizza-mid':
      return <PizzaThemeMid>{children}</PizzaThemeMid>;
    case 'sushi':
      return <SushiTheme>{children}</SushiTheme>;
    case 'gold':
      return <GoldTheme>{children}</GoldTheme>;
    // Fallback for old template names (backward compatibility)
    case 'bar':
      return <BarThemeModern>{children}</BarThemeModern>;
    case 'pizza':
      return <PizzaThemeModern>{children}</PizzaThemeModern>;
    default:
      return <GenericTheme>{children}</GenericTheme>;
  }
}


