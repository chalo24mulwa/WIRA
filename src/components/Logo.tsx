import Image from "next/image";
import Link from "next/link";

export function Logo({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  return (
    <Link href="/" className={`flex shrink-0 items-center ${className}`}>
      <span
        className={`inline-flex items-center rounded-lg px-1.5 py-1 ${
          dark ? "bg-white" : ""
        }`}
      >
        <Image
          src="/wira-logo.png"
          alt="WIRA"
          width={1639}
          height={440}
          priority
          className="h-6 w-auto sm:h-7"
        />
      </span>
    </Link>
  );
}
