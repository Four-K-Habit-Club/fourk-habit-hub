// src/Navigation.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import { useLanguage } from '@/contexts/LanguageContext';
import { LayoutDashboard, Plus, History, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export const Navigation: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/log', icon: Plus, label: t('nav.log') },
    { path: '/history', icon: History, label: t('nav.history') },
  ];

  return (
    <nav className="bg-card border-r border-border shadow-sm h-screen w-64 flex flex-col"> {/* Changed to vertical sidebar */}
      <div className="flex flex-col gap-4 p-4"> {/* Stack items vertically with spacing */}
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant={location.pathname === item.path ? 'default' : 'ghost'}
              size="lg" // Larger buttons for vertical nav
              className={cn(
                "w-full justify-start gap-3 text-left", // Full width, left-aligned
                location.pathname === item.path && "bg-gradient-primary"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Button>
          </Link>
        ))}

        {/* Language dropdown at the bottom */}
        <div className="mt-auto"> {/* Pushes dropdown to bottom */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Globe className="w-5 h-5 mr-2" />
                Language
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setLanguage('en')}>
                English {language === 'en' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('en-sw')}>
                English-Swahili {language === 'en-sw' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('sw')}>
                Swahili {language === 'sw' && '✓'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};
