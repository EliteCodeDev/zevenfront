"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import { Users, Award, UserCheck, Activity, FileCode, Trophy } from "lucide-react";

import { NavMain } from "@/components/dash/nav-main";
import { NavUser } from "@/components/dash/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import md5 from 'md5';

// Componente personalizado para íconos con tamaño fijo
const FixedSizeIcon = ({ Icon, size = 20, className = "", ...props }) => {
  return (
    <Icon 
      size={size} 
      className={`${className}`} 
      style={{ 
        minWidth: size, 
        minHeight: size 
      }} 
      {...props} 
    />
  );
};

export function AppSidebar({ ...props }) {
  const { data: session, status } = useSession();
  const [userData, setUserData] = React.useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  // Monitorear estado del sidebar
  React.useEffect(() => {
    const checkSidebarState = () => {
      const sidebarElement = document.querySelector('[role="navigation"]');
      if (sidebarElement) {
        const state = sidebarElement.getAttribute('data-state');
        setIsSidebarCollapsed(state === 'closed');
      }
    };

    // Verificar inicialmente
    checkSidebarState();

    // Configurar un observador para detectar cambios
    const observer = new MutationObserver(checkSidebarState);
    const sidebar = document.querySelector('[role="navigation"]');
    
    if (sidebar) {
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ['data-state']
      });
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  // Efecto para actualizar el estado cuando session esté disponible
  React.useEffect(() => {
    if (session) {
      const avatarUrl = `https://www.gravatar.com/avatar/${md5(session.user.email.trim().toLowerCase())}?s=40&d=retro`;
      
      // Intentar obtener firstName y lastName de la sesión
      let firstName = '';
      let lastName = '';
      
      // Verificar si existe session.user.firstName y session.user.lastName
      if (session.user.firstName && session.user.lastName) {
        firstName = session.user.firstName;
        lastName = session.user.lastName;
      } 
      // Verificar si existe session.firstName y session.lastName
      else if (session.firstName && session.lastName) {
        firstName = session.firstName;
        lastName = session.lastName;
      }
      // Si no hay nombres, extraer del email
      else {
        const emailParts = session.user.email.split('@');
        const nameParts = emailParts[0].split('.');
        
        if (nameParts.length > 1) {
          firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
          lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
        } else {
          firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
          lastName = '';
        }
      }

      setUserData({
        email: session.user.email,
        avatar: avatarUrl,
        firstName: firstName,
        //lastName: lastName,
        // Mantenemos name para compatibilidad con versiones anteriores
        name: `${firstName} ${lastName}`.trim()
      });
    }
  }, [session]);

  const isLoading = status === "Cargando" || !userData;

  const navMain = [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: (props) => <FixedSizeIcon Icon={Users} {...props} />,
      isActive: false,
    },
    {
      title: "Usuarios",
      url: "/admin/users",
      icon: (props) => <FixedSizeIcon Icon={Users} {...props} />,
      isActive: false,
    },
    {
      title: "Challenges",
      url: "/admin/challenges",
      icon: (props) => <FixedSizeIcon Icon={Award} {...props} />,
      isActive: false,
    },
    {
      title: "Retiros",
      url: "/admin/withdrawals",
      icon: (props) => <FixedSizeIcon Icon={UserCheck} {...props} />,
      isActive: false,
    },
    {
      title: "Broker Accounts",
      url: "/admin/brokerAccount",
      icon: (props) => <FixedSizeIcon Icon={Activity} {...props} />,
      isActive: false,
    },
    {
      title: "Creador de challenges",
      url: "#",
      icon: (props) => (
        <FixedSizeIcon 
          Icon={FileCode} 
          size={22} 
          {...props} 
          className={`
            creator-challenges-icon 
            ${isSidebarCollapsed 
              ? 'sidebar-collapsed-icon  flex items-start justify-start' 
              : ''
            }
          `} 
        />
      ),
      className: "creador-challenges-item",
      isActive: false,
      items: [
        {
          title: "Steps",
          url: "/admin/steps",
        },
        {
          title: "Fases, Categorias y Balances",
          url: "/admin/manager",
        },
        {
          title: "Condiciones",
          url: "/admin/parameters",
        },
      ],
    },
    {
      title: "Premios",
      url: "/admin/awards",
      icon: (props) => <FixedSizeIcon Icon={Trophy} {...props} />,
      isActive: false,
    },
  ];

  return (
    <Sidebar 
      collapsible="icon" 
      className="bg-black" 
      {...props}
    >
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        {isLoading ? (
          <p className="text-center text-gray-500">Cargando sesión...</p>
        ) : (
          <NavUser user={userData} />
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}