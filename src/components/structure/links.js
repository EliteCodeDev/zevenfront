// links.js   parte general q contendra todos los arrays necesarios
import { HomeIcon, UserCircleIcon, CreditCardIcon, ChatBubbleLeftEllipsisIcon, LifebuoyIcon, ArrowRightOnRectangleIcon, CheckBadgeIcon, ClockIcon } from '@heroicons/react/24/outline';

export const navigation = [
    { icon: HomeIcon, name: 'Dashboard', id: 'main', href: '/' }, // Mantengo el icono para Dashboard.
    { icon: UserCircleIcon, name: 'Profile', id: 'profile', href: '/profile' }, // Icono más representativo para el perfil.
    { icon: ClockIcon, name: 'History', id: 'history', href: '/historial' }, // Representa historial de challenges.
    { icon: CheckBadgeIcon, name: 'Verification', id: 'verification', href: '/verification' }, // Icono más representativo para el perfil.
    { icon: CreditCardIcon, name: 'Billing', id: 'billing', href: '/billing' }, // Representa pagos y facturación.
    { icon: ChatBubbleLeftEllipsisIcon, name: 'Social', id: 'social', href: '/social' }, // Representa interacciones sociales.
    { icon: LifebuoyIcon, name: 'Support', id: 'support', href: '/support' }, // Icono clásico de soporte.
    { icon: ArrowRightOnRectangleIcon, name: 'Return to Website', id: 'website', href: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || 'https://zevenglobalfunding.com/' }, // Icono clásico de salir.


];

export const userNavigation = [
    { name: 'Your Profile', href: '/profile' },
    { name: 'Administrator', href: '/admin/dashboard', adminOnly: true },
    { name: 'Withdrawals', href: '/billing' },
    { name: 'Sign Out', href: '/', signOut: true },
];

// Puedes colocar esta constante en un archivo de configuración o en el mismo componente
export const principalButton = [
    { name: 'New Zeven Challenge', href: '/start-challenge' }
];

export const FooterNav = [
    { name: 'Privacy Policy', href: `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || ""}/privacy-policy/` },
    {
        name: 'Terms and Conditions', href: `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || ""}/terms-of-service/`
    }
];