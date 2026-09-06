import Image from "next/image";

interface LogoIconProps {
  className?: string;
}

export function LogoIcon({ className = "w-10 h-10" }: LogoIconProps) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-xl ${className}`}>
      <Image
        src="/logo/Linkedon-logo.png"
        alt="Linkedon Logo"
        fill
        className="object-cover"
        priority
      />
    </div>
  );
}
