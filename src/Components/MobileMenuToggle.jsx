import { X, Menu } from 'lucide-react';

const MobileMenuToggle = ({ sidebarOpen, setSidebarOpen }) => (
  <button
    onClick={() => setSidebarOpen(!sidebarOpen)}
    className="md:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-800 rounded-full shadow-lg"
  >
    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
  </button>
);

export default MobileMenuToggle;
