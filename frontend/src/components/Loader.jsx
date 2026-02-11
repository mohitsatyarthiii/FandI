import { Loader2 } from 'lucide-react';

const Loader = ({ size = 24, className = '' }) => {
  return (
    <Loader2 className={`animate-spin ${className}`} size={size} />
  );
};

export default Loader;