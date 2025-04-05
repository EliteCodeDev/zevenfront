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
const FixedSizeIcon = ({ Icon, size = 20 }) => {
  return <Icon size={size} style={{ minWidth: size, minHeight: size }} />;
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

      setUserData({
        email: session.user.email || "correo@ejemplo.com",
        avatar: avatarUrl, // Avatar de Gravatar
        name: session.user.email || session.firstName, // Si no hay nombre, usar parte del email
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
      // Usamos un tamaño ligeramente mayor para este ícono específico
      icon: (props) => <FixedSizeIcon Icon={FileCode} size={22} {...props} />,
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
    <>
      {/* Estilo para el ítem específico cuando el sidebar está colapsado */}
      {isSidebarCollapsed && (
        <style jsx global>{`
          .creador-challenges-item svg {
            min-width: 22px !important;
            min-height: 22px !important;
            width: 22px !important;
            height: 22px !important;
          }
        `}</style>
      )}

      <Sidebar collapsible="icon" className="bg-black" {...props}>
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
    </>
  );
}