import React from 'react';

// Using Heroicons v2 SVG content & custom icons
// https://heroicons.com/

interface IconProps {
    className?: string;
}

export const LogoIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691v4.992" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.962 9.348h4.992m-4.993 0 3.181-3.183a8.25 8.25 0 0 1 11.667 0l3.181 3.183" />
    </svg>
);

export const ShopifyLogoIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="currentColor"><path d="M68.5 27.9c-2-1.1-4.3-1.8-6.9-1.8-3.7 0-6.9 1.4-9.3 4.2-2.2 2.6-3.3 5.8-3.3 9.5 0 2.4 1 5.3 2.9 7.6 1.7 2.1 3.5 3.3 5.3 3.6v-8.3c0-2.3 1.2-4.1 3.7-5.4 1.2-.6 2.6-1 4.1-1 .7 0 1.4.1 2 .3l1.8-6.7z"></path><path d="M49.4 43.1c-2-2.7-3-6-3-9.7 0-4.1 1.3-7.7 3.9-10.8s5.9-4.6 9.9-4.6c2.1 0 4.1.5 5.9 1.5l-3.3 12.3c-1.3-.4-2.7-.6-4.1-.6-2.9 0-5.1 1.2-6.5 3.5-1.5 2.5-2.2 5.5-2.2 9 0 2.2.5 4.3 1.6 6.3l-8.2 2.3zm-14.6-25.5c2.3-2.8 5.4-4.2 9.3-4.2 3.3 0 6.3 1.1 8.8 3.4 2.3 2.1 3.4 4.1 3.4 6s-.8 3.5-2.5 4.8c-1.6 1.3-3.1 2-4.6 2h-4.3c-2.3 0-4.1-.6-5.4-1.7-1.3-1.1-2-2.8-2-4.9 0-3.3 1.2-5.9 3.5-7.8z M32 40.8c.2-3.4 1.7-6.2 4.6-8.3 3-2.2 6.5-3.3 10.5-3.3h.3L44 42.4c-2.8.8-5.1 1.2-6.9 1.2-2.2 0-4-.5-5.3-1.5-1.4-1-2.2-2.5-2.2-4.3z"></path><path d="M40 0C17.9 0 0 17.9 0 40s17.9 40 40 40 40-17.9 40-40S62.1 0 40 0zm28.5 45.1c-.8 2.8-2.6 5-5.3 6.6-2.7 1.6-5.5 2.4-8.4 2.4-4.6 0-8.4-1.6-11.4-4.7-3-3.1-4.5-7.1-4.5-11.8 0-4.1 1.4-7.8 4.1-11.1 2.8-3.3 6.2-5 10.4-5 3.2 0 6.1 1 8.6 3l-1.8 6.5c-1.6-.9-3.2-1.4-4.9-1.4-2.3 0-4.2 1-5.7 3-1.5 2-2.2 4.5-2.2 7.4 0 3.3 1 6.1 3.1 8.4 2.1 2.3 4.5 3.4 7.3 3.4 1.7 0 3.3-.4 4.8-1.1 1.5-.7 2.6-1.9 3.3-3.5l1.8 6.4zM24.7 18.2h8.7v29.3c0 2.2-.5 3.9-1.6 5.1-1 1.2-2.6 1.7-4.7 1.7-1.4 0-2.8-.2-4.2-.6V18.2z"></path></svg>
);

export const WooCommerceLogoIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4.566 2.022L0 8.336l4.606 6.388 4.608-6.388zm10.23.01L10.23 8.42l4.566 6.315 4.566-6.315zm-3.31 8.35L6.89 21.978l4.597-6.388 4.596 6.388L21.36 10.38z"></path></svg>
);

export const ShiprocketLogoIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256"><path d="M228.44,103.56,154.31,29.44a19.89,19.89,0,0,0-28.17-.11L28.26,127.17a19.9,19.9,0,0,0,.11,28.17l74.13,74.13a19.9,19.9,0,0,0,28.17.11l97.88-97.88A19.9,19.9,0,0,0,228.44,103.56Zm-40,56.09-32,32-24-24,32-32,24,24Z"></path></svg>
);

export const DelhiveryLogoIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 12"><path d="M20,6a6,6,0,0,0-6-6H9.4A6,6,0,0,0,3.54,5.4L0,9,3.52,9,6.5,12h7.4A6.09,6.09,0,0,0,20,6ZM6,6A2,2,0,1,1,4,4,2,2,0,0,1,6,6Z"></path></svg>
);


export const ChartPieIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
    </svg>
);

export const DocumentTextIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);

export const Cog6ToothIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 0 1 0 1.255c-.008.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.6 6.6 0 0 1-.22.128c-.333.183-.582.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 0 1 0-1.255c.008-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.354.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

export const ArrowTrendingUpIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 18 9-9 4.5 4.5L21.75 6" />
  </svg>
);

export const ArrowTrendingDownIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 6 9 9 4.5-4.5L21.75 18" />
  </svg>
);

export const BellIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);

export const XMarkIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export const ShieldCheckIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Z" />
    </svg>
);

export const MapPinIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
);

export const ArrowPathIcon: React.FC<IconProps> = ({ className="w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691V7.5A2.25 2.25 0 0 1 15 5.25v1.5" />
    </svg>
);

export const ExclamationCircleIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
);

export const ExclamationTriangleIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
);

export const DocumentCheckIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m4.5 13.5 3-3m0 0-3 3m3-3v-6m-1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);

export const CalendarDaysIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" />
    </svg>
);

export const DocumentArrowDownIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.158 10.302L12 18.335l3.582-3.782M12 12.335v6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m9.75 9.75h4.875c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.875" />
    </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

export const LinkIcon: React.FC<IconProps> = ({ className="w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
);

export const Bars3Icon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

export const ScaleIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52v1.6c-1.646.383-3.292.6-5 .6a48.62 48.62 0 0 0-5-.6v-1.6c1.01-.203 2.01-.377 3-.52m3.75 2.25A48.47 48.47 0 0 1 12 7.5c-2.291 0-4.545-.16-6.75-.47m13.5 0v9c-1.646.383-3.292.6-5 .6a48.62 48.62 0 0 0-5-.6v-9" />
    </svg>
);

export const TruckIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 0 0 .083-1.587l.018-.11a3.375 3.375 0 0 0 3.282-3.465V6.375c0-1.745 1.42-3.166 3.166-3.166h5.25a3.166 3.166 0 0 1 3.166 3.166v4.628c0 1.25.64 2.364 1.623 2.942l.09.055a3.375 3.375 0 0 0 3.282 3.465l.018.11a3.375 3.375 0 0 0 .083 1.587v1.875m-4.5-6H9" />
    </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

export const CpuChipIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5m0 16.5v-1.5m3.75-12h1.5m-18 0h1.5m15 3.75h1.5m-18 0h1.5M12 4.5v15m-3.75-15h7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5V3m0 18v-1.5M8.25 4.5V3m0 18v-1.5m7.5-15V3m0 18v-1.5M4.5 8.25H3m18 0h-1.5M4.5 15.75H3m18 0h-1.5" />
    </svg>
);

export const PuzzlePieceIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.75a4.5 4.5 0 0 1 4.5 4.5v4.5m-4.5-4.5a4.5 4.5 0 0 0-4.5 4.5v4.5m4.5-4.5H6.75m0 0v4.5m0-4.5a4.5 4.5 0 0 1 4.5-4.5h4.5M6.75 11.25a4.5 4.5 0 0 0-4.5 4.5v4.5m4.5-4.5H2.25m4.5 0a4.5 4.5 0 0 1 4.5-4.5h4.5" />
    </svg>
);

export const ArrowPathRoundedSquareIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691V7.5a2.25 2.25 0 0 1 2.25-2.25h1.5M2.25 7.5A2.25 2.25 0 0 1 4.5 5.25h1.5M21.75 7.5c0 4.142-3.358 7.5-7.5 7.5-4.142 0-7.5-3.358-7.5-7.5S10.358 0 14.25 0c4.142 0 7.5 3.358 7.5 7.5Zm-15 0A2.25 2.25 0 0 1 9 5.25h1.5" />
    </svg>
);

export const ChevronUpIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
    </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

export const ChevronUpDownIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
    </svg>
);