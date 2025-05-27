import  { Download, Youtube } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  downloadCount?: number;
}

function Header({ downloadCount = 0 }: HeaderProps) {
  return (
    <header className="py-4">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-accent-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Download size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">E-Downloader</h1>
              <p className="text-sm text-gray-400">Download YouTube videos easily</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {downloadCount > 0 && (
              <div className="bg-dark-800 px-4 py-2 rounded-lg flex items-center gap-2">
                <Download size={16} className="text-accent-500" />
                <span>{downloadCount} Downloads</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 bg-red-600 bg-opacity-20 px-4 py-2 rounded-lg">
              <Youtube size={18} className="text-red-500" />
              <span className="text-red-200">YouTube Downloader</span>
            </div>
          </div>
        </motion.div>
      </div>
    </header>
  );
}

export default Header;
  