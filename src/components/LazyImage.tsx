import { useEffect, useRef, useState, memo } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  /** Mostrar skeleton enquanto carrega */
  showSkeleton?: boolean;
}

/**
 * Imagem com lazy loading nativo + IntersectionObserver fallback,
 * fade-in suave e skeleton enquanto carrega.
 */
function LazyImageBase({
  src,
  alt,
  className,
  showSkeleton = true,
  ...rest
}: LazyImageProps) {
  const ref = useRef<HTMLImageElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisible(true);
              observer.disconnect();
            }
          });
        },
        { rootMargin: "200px" },
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }
    setVisible(true);
  }, []);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {showSkeleton && !loaded && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      <img
        ref={ref}
        src={visible ? src : undefined}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        )}
        {...rest}
      />
    </div>
  );
}

export const LazyImage = memo(LazyImageBase);
