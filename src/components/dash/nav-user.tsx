"use client"
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import {
  ChevronsUpDown,
  LogOut,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { PresentationChartBarIcon } from '@heroicons/react/24/outline'

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {

  const router = useRouter()
  const { isMobile } = useSidebar()

  const handleSignOut = () => {
    signOut({ redirect: false }).then(() => {
      router.push('/login') // Redirige a la página de login
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
<Avatar className="h-8 w-8 rounded-full">
  <AvatarImage src={user.avatar} alt={user.name} className="rounded-full" />
  <AvatarFallback className="rounded-full">N</AvatarFallback>
</Avatar>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name} </span>
              </div>
             </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
  side="top"
  align="center"
            sideOffset={4}
          >
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => router.push('/')}
            >
              <PresentationChartBarIcon className="mr-2 size-4" />
              <span>Volver al Sistema</span>
            </DropdownMenuItem>


            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
              <LogOut className="mr-2 size-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
