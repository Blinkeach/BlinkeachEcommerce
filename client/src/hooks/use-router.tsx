import { useLocation } from 'wouter';

export function useRouter() {
  const [, navigate] = useLocation();

  const pushWithTransition = (to: string, options?: { replace?: boolean }) => {
    // Add a small delay to allow for animation to start
    // before the actual navigation happens
    setTimeout(() => {
      if (options?.replace) {
        window.history.replaceState(null, '', to);
      } else {
        navigate(to);
      }
    }, 50);
  };

  const hardNavigate = (to: string) => {
    window.location.href = to;
  };

  return {
    pushWithTransition,
    hardNavigate
  };
}