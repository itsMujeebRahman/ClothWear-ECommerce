import { cn } from "@/lib/utils";
import {
  FaFacebook as Facebook,
  FaGithub as Github,
  FaLinkedin as Linkedin,
  FaSlack as Slack,
  FaYoutube as Youtube,
} from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";

interface Props {
  className?: string;
  iconClassName?: string;
  tooltipClassName?: string;
}

const socialLinks = [
  {
    title: "Youtube",
    href: "https://www.youtube.com",
    icon: <Youtube className="w-5 h-5" />,
  },
  {
    title: "GitHub",
    href: "https://www.github.com",
    icon: <Github className="w-5 h-5" />,
  },
  {
    title: "Facebook",
    href: "https://www.facebook.com",
    icon: <Facebook className="w-5 h-5" />,
  },
  {
    title: "LinkedIn",
    href: "https://www.linkedin.com",
    icon: <Linkedin className="w-5 h-5" />,
  },
  {
    title: "Slack",
    href: "https://www.slack.com",
    icon: <Slack className="w-5 h-5" />,
  },
];

export default function SocialMedia({
  className,
  iconClassName,
  tooltipClassName,
}: Props) {
  return (
    <TooltipProvider>
      <div className={cn("flex ietms-center gap-3.5", className)}>
        {socialLinks.map((item) => (
          <Tooltip key={item.title}>
            <TooltipTrigger asChild>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "p-2 border rounded-full hover:text-white hover:border-white",
                  iconClassName,
                )}
              >
                {item.icon}
              </a>
            </TooltipTrigger>
            <TooltipContent
              className={cn(
                "bg-white text-black font-semibold text-xs p-2 rounded-2xl",
                tooltipClassName,
              )}
            >
              {item.title}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
