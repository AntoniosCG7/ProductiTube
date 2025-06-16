import * as React from 'react';

interface SimpleTooltipProps {
  content: string;
  children: React.ReactElement;
}

function useTooltip() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const showTooltip = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipHeight = 45;
      const headerAndNavHeight = 200;
      const shouldFlip = rect.top < headerAndNavHeight + tooltipHeight;
      setIsFlipped(shouldFlip);
    }

    setIsVisible(true);
  }, []);

  const hideTooltip = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 150);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isVisible,
    isFlipped,
    triggerRef,
    showTooltip,
    hideTooltip,
  };
}

export function SimpleTooltip({ content, children }: SimpleTooltipProps) {
  const { isVisible, isFlipped, triggerRef, showTooltip, hideTooltip } = useTooltip();

  const clonedChild = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      if (children.props.onMouseEnter) {
        children.props.onMouseEnter(e);
      }
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip();
      if (children.props.onMouseLeave) {
        children.props.onMouseLeave(e);
      }
    },
    onFocus: (e: React.FocusEvent) => {
      showTooltip();
      if (children.props.onFocus) {
        children.props.onFocus(e);
      }
    },
    onBlur: (e: React.FocusEvent) => {
      hideTooltip();
      if (children.props.onBlur) {
        children.props.onBlur(e);
      }
    },
  });

  return (
    <div ref={triggerRef} className="relative inline-block">
      {clonedChild}
      {isVisible && (
        <div
          className={`
            absolute z-50 w-72 px-4 py-3 text-sm font-medium
            border border-gray-300 rounded-xl shadow-2xl
            backdrop-blur-sm transition-all duration-500 ease-out
            animate-in fade-in-0 zoom-in-95 slide-in-from-top-4
            ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          `}
          style={{
            left: '50%',
            transform: `translateX(-50%)`,
            top: isFlipped ? 'calc(100% + 8px)' : 'auto',
            bottom: isFlipped ? 'auto' : 'calc(100% + 8px)',
            fontSize: '14px',
            lineHeight: '1.5',
            letterSpacing: '0.025em',
            backgroundColor: 'white',
            color: '#000000',
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 10px 20px -5px rgba(0, 0, 0, 0.15),
              0 0 0 1px rgba(0, 0, 0, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.9)
            `,
            animationDuration: '0.4s',
            animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            className={`
              absolute left-1/2 transform -translate-x-1/2 w-0 h-0
              ${
                isFlipped
                  ? '-top-2 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white'
                  : '-bottom-2 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white'
              }
            `}
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
            }}
          />

          <div className="relative">
            <div className="relative whitespace-normal break-words leading-relaxed font-medium text-center">
              <div className="text-black">{content}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const Tooltip = SimpleTooltip;
export const TooltipTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const TooltipContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
