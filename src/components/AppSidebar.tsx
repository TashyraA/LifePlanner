import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Home, Calendar, DollarSign, Dumbbell, UtensilsCrossed, BookOpen, GraduationCap, PiggyBank, Settings } from 'lucide-react';

export function AppSidebar() {
  const location = useLocation();
  
  const menuItems = [
    { title: 'Home', icon: Home, href: '/home' },
    { title: 'Planner', icon: Calendar, href: '/planner' },
    { title: 'Finance', icon: DollarSign, href: '/finance' },
    { title: 'Budget', icon: PiggyBank, href: '/finance/budget' },
    { title: 'Fitness', icon: Dumbbell, href: '/fitness' },
    { title: 'Meals', icon: UtensilsCrossed, href: '/meals' },
    { title: 'College', icon: GraduationCap, href: '/college' },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-coquette-brown-200">
        <div className="flex items-center gap-2 px-4 py-3">
          <h1 className="text-lg font-bold text-coquette-brown-600 italic">My Planner</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-coquette-brown-500">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-coquette-brown-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === '/settings'}>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}