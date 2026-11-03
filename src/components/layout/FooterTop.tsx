import type { ReactNode } from "react";
import {
  LuClock as Clock,
  LuMail as Mail,
  LuMapPin as MapPin,
  LuPhone as Phone,
} from "react-icons/lu";

interface ContactItemProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
}

const contactItems: ContactItemProps[] = [
  {
    title: "Visit Us",
    subtitle: "Kerala, India",
    icon: (
      <MapPin
        size={24}
        className="text-gray-600 group-hover:text-black transition-colors"
      />
    ),
  },
  {
    title: "Call Us",
    subtitle: "+91 8765467867",
    icon: (
      <Phone
        size={24}
        className="text-gray-600 group-hover:text-black transition-colors"
      />
    ),
  },
  {
    title: "Working Hours",
    subtitle: "Mon - Sat : 10:00 AM - 7:00 PM",
    icon: (
      <Clock
        size={24}
        className="text-gray-600 group-hover:text-black transition-colors"
      />
    ),
  },
  {
    title: "Email Us",
    subtitle: "clothswear@gmail.com",
    icon: (
      <Mail
        size={24}
        className="text-gray-600 group-hover:text-black transition-colors"
      />
    ),
  },
];

function ContactItem({ icon, title, subtitle }: ContactItemProps) {
  return (
    <div className="flex items-center gap-3 group hover:bg-gray-50 p-4 transition-colors">
      {icon}
      <div>
        <h3 className="font-semibold text-gray-900 group-hover:text-gray-900 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 text-sm mt-1 group-hover:text-gray-900 transition-colors">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export default function FooterTop() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 border-b">
      {contactItems.map((item) => (
        <ContactItem
          key={item.title}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
        />
      ))}
    </div>
  );
}
