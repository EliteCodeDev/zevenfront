// src/components/dash/nav-main.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; // Obtener la URL actual
import { type LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname() || ""; // Asegurar que pathname siempre tenga un valor válido

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname?.toLowerCase() === item.url.toLowerCase(); // Verifica si la URL está activa
          const hasSubItems = item.items && item.items.length > 0;
          
          // Verifica si cualquier sub-item está activo
          const isSubItemActive = hasSubItems && item.items.some(
            subItem => pathname?.toLowerCase() === subItem.url.toLowerCase()
          );

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isSubItemActive || item.isActive}
              className="group/collapsible w-full"
            >
              <SidebarMenuItem className="group/collapsible-trigger">
                {hasSubItems ? (
                  // Si tiene subitems, renderizar como dropdown
                  <>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between gap-2 px-4 py-2 rounded-lg transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">
                        <div className="flex items-center gap-2">
                          {item.icon && <item.icon className="w-5 h-5" />}
                          <span>{item.title}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-9 space-y-1 mt-1">
                      {item.items.map((subItem) => {
                        const isSubActive = pathname?.toLowerCase() === subItem.url.toLowerCase();
                        return (
                          <Link key={subItem.title} href={subItem.url} className="block">
                            <div className={`px-4 py-2 rounded-lg transition-all text-sm ${
                              isSubActive 
                                ? "bg-zinc-700 text-white font-semibold shadow-md" 
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}>
                              {subItem.title}
                            </div>
                          </Link>
                        );
                      })}
                    </CollapsibleContent>
                  </>
                ) : (
                  // Si no tiene subitems, renderizar como link normal
                  <div className="flex py-1 mt-2 w-full">
                    {isActive ? (
                      <div className="flex-grow">
                        <SidebarMenuButton
                          tooltip={item.title}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-700 text-white font-semibold shadow-md"
                        >
                          {item.icon && <item.icon className="w-5 h-5" />}
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </div>
                    ) : (
                      <Link href={item.url} className="flex-grow">
                        <SidebarMenuButton
                          tooltip={item.title}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          {item.icon && <item.icon className="w-5 h-5" />}
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </Link>
                    )}
                  </div>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}