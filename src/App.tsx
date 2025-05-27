import  { useState, useEffect } from 'react';
import { Download, Youtube, Play, Link, Video, CheckCircle, Clipboard, AlertCircle, Search } from 'lucide-react';
import AnimatedBackground from './components/AnimatedBackground';
import Header from './components/Header';
import { motion } from 'framer-motion';
import { fetchVideoInfo, downloadVideo, extractYoutubeVideoId } from './services/youtubeService';
import { VideoInfo } from './types';

function App() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('paste');
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
   // Get initial download count from localStorage if available
  const [downloadCount, setDownloadCount] = useState(() => {
    try {
      const downloadHistory = JSON.parse(localStorage.getItem('e-downloader-history') || '[]');
      return downloadHistory.length;
    } catch (e) {
      return 0;
    }
  }); 

   // Advanced detection for YouTube videos in any tab
  useEffect(() => {
    // Storage key for sharing data between tabs
    const STORAGE_KEY = 'e-downloader-detected-videos';
    
    // Listen for video detection in current tab
    const checkForVideos = () => {
      if (activeTab !== 'auto') return;
      
      // This simulates detecting videos in the current tab
      const possibleVideoElements = document.querySelectorAll('video');
      const videoUrls = [];
      
      // In a real extension, we would extract actual playing URLs
      // For simulation, we'll check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const autoDetectUrl = urlParams.get('video');
      
      if (autoDetectUrl && autoDetectUrl.includes('youtube.com')) {
        videoUrls.push(autoDetectUrl);
        
        // Add to sessionStorage to simulate cross-tab detection
        try {
          const currentVideos = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
          if (!currentVideos.includes(autoDetectUrl)) {
            currentVideos.push(autoDetectUrl);
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentVideos));
            
            // Dispatch event to notify other tabs
            window.dispatchEvent(new CustomEvent('e-downloader-video-detected'));
          }
        } catch (error) {
          console.error('Error updating session storage:', error);
        }
        
        setUrl(autoDetectUrl);
      }
      
      // More advanced detection - if this was a real browser extension
      // we would use the browser.tabs API to detect videos in other tabs
      possibleVideoElements.forEach(video => {
        if (video.src && video.src.includes('youtube.com')) {
          videoUrls.push(video.src);
        }
      });
      
      // In a real extension, we would also check for embedded YouTube iframes
      document.querySelectorAll('iframe').forEach(iframe => {
        if (iframe.src && iframe.src.includes('youtube.com/embed')) {
          const videoId = iframe.src.split('/').pop()?.split('?')[0];
          if (videoId) {
            const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;
            videoUrls.push(fullUrl);
          }
        }
      });
    };
    
    // Function to check for videos stored by other tabs
    const checkStoredVideos = () => {
      if (activeTab !== 'auto') return;
      
      try {
        const storedVideos = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
        if (storedVideos.length > 0) {
          // Use the most recent detected video
          setUrl(storedVideos[storedVideos.length - 1]);
        }
      } catch (error) {
        console.error('Error reading from session storage:', error);
      }
    };
    
    // Set up event listeners for cross-tab communication
    const handleVideoDetected = () => {
      checkStoredVideos();
    };
    
    window.addEventListener('e-downloader-video-detected', handleVideoDetected);
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) {
        checkStoredVideos();
      }
    });
    
    // Simulate more frequent checks for this demo
    const interval = setInterval(checkForVideos, 3000);
    
    // Initial check
    checkForVideos();
    checkStoredVideos();
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('e-downloader-video-detected', handleVideoDetected);
    };
  }, [activeTab]); 

  const analyzeVideo = async () => {
    if (!url) return;
    
    // Check if it's a valid YouTube URL
    const videoId = extractYoutubeVideoId(url);
    if (!videoId) {
      setNotification({
        show: true,
        message: 'Invalid YouTube URL. Please enter a valid YouTube video URL.',
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification({show: false, message: '', type: 'success'});
      }, 3000);
      
      return;
    }
    
    setIsAnalyzing(true);
    setVideoInfo(null);
    
    try {
      const info = await fetchVideoInfo(url);
      
      if (info) {
        setVideoInfo(info);
        setSelectedFormat('1080p-mp4');
      } else {
        throw new Error('Failed to fetch video information');
      }
    } catch (error) {
      setNotification({
        show: true,
        message: 'Failed to analyze video. Please try again.',
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification({show: false, message: '', type: 'success'});
      }, 3000);
    } finally {
      setIsAnalyzing(false);
    }
  };

   const startDownload = async () => {
    if (!videoInfo || !selectedFormat) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      // Start download progress simulation with more realistic progression
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev < 30) {
            // First 30% moves quickly (preparing download)
            return prev + (Math.random() * 5);
          } else if (prev < 80) {
            // Middle progress slows down (actual download)
            return prev + (Math.random() * 3);
          } else if (prev < 95) {
            // Final stretch is slowest (processing)
            return prev + (Math.random() * 1);
          } else {
            // Last bit (finalizing)
            return prev + (Math.random() * 0.5);
          }
        });
      }, 200);
      
      // Get download link from our service
      const downloadUrl = await downloadVideo(videoInfo, selectedFormat);
      
      // Ensure progress reaches at least 95% before completing
      setTimeout(() => {
        clearInterval(progressInterval);
        setDownloadProgress(100);
        
        // Create a hidden anchor to trigger the download
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        
        // Format filename with quality and sanitize it for file systems
        // Remove invalid filename characters
        const [quality, format] = selectedFormat.split('-');
        const sanitizedTitle = videoInfo.title
          .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename chars
          .replace(/\s+/g, ' ')         // Replace multiple spaces with single space
          .trim();                       // Trim extra spaces
        
        a.download = `${sanitizedTitle} (${quality}).${format}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Add to download history in localStorage - useful for persistent download count
        try {
          const downloadHistory = JSON.parse(localStorage.getItem('e-downloader-history') || '[]');
          downloadHistory.push({
            id: videoInfo.videoId,
            title: videoInfo.title,
            quality: quality,
            format: format,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('e-downloader-history', JSON.stringify(downloadHistory));
        } catch (e) {
          console.error('Failed to save download history:', e);
        }
        
        // Clean up the blob URL
        setTimeout(() => {
          URL.revokeObjectURL(downloadUrl);
        }, 1000);
        
        // Reset the download state
        setTimeout(() => {
          setIsDownloading(false);
          setDownloadProgress(0);
          setDownloadCount(prevCount => prevCount + 1);
          
          setNotification({
            show: true,
            message: 'Download completed successfully!',
            type: 'success'
          });
          
          setTimeout(() => {
            setNotification({show: false, message: '', type: 'success'});
          }, 3000);
        }, 500);
      }, 3000);
    } catch (error) {
      setNotification({
        show: true,
        message: 'Download failed. Please try again.',
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification({show: false, message: '', type: 'success'});
      }, 3000);
      
      setIsDownloading(false);
    }
  }; 

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        setUrl(text);
        
        setNotification({
          show: true,
          message: 'URL pasted from clipboard!',
          type: 'success'
        });
        
        setTimeout(() => {
          setNotification({show: false, message: '', type: 'success'});
        }, 3000);
      }
    } catch (error) {
      setNotification({
        show: true,
        message: 'Failed to access clipboard.',
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification({show: false, message: '', type: 'success'});
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Notification */}
      {notification.show && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } shadow-lg flex items-center gap-2`}
        >
          {notification.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{notification.message}</span>
        </motion.div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <Header downloadCount={downloadCount} />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto mt-12 bg-dark-800 bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Tab Navigation */}
          <div className="flex border-b border-dark-600">
            <button 
              onClick={() => setActiveTab('paste')}
              className={`px-6 py-4 flex items-center gap-2 transition-all ${
                activeTab === 'paste' ? 'border-b-2 border-accent-500 text-accent-500' : 'text-gray-400'
              }`}
            >
              <Link size={18} />
              <span>Paste URL</span>
            </button>
            <button 
              onClick={() => setActiveTab('auto')}
              className={`px-6 py-4 flex items-center gap-2 transition-all ${
                activeTab === 'auto' ? 'border-b-2 border-accent-500 text-accent-500' : 'text-gray-400'
              }`}
            >
              <Play size={18} />
              <span>Auto Detect</span>
            </button>
          </div>
          
          <div className="p-6">
            {activeTab === 'paste' ? (
              <div className="flex flex-col">
                <div className="flex">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste YouTube video URL here..."
                      className="w-full px-4 py-3 bg-dark-700 rounded-l-lg border border-dark-600 input-glow focus:outline-none"
                    />
                    <button 
                      onClick={pasteFromClipboard}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      title="Paste from clipboard"
                    >
                      <Clipboard size={18} />
                    </button>
                  </div>
                  <button 
                    onClick={analyzeVideo}
                    disabled={!url || isAnalyzing}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-none transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Search size={18} />
                        <span>Search</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={videoInfo ? startDownload : analyzeVideo}
                    disabled={!url || isAnalyzing || (videoInfo && !selectedFormat) || isDownloading}
                    className="px-6 py-3 bg-accent-600 hover:bg-accent-700 rounded-r-lg transition-all btn-hover-effect flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={18} />
                    <span>Download</span>
                  </button>
                </div>
                
                <div className="mt-2 text-sm text-gray-400">
                  Enter a valid YouTube video URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative">
                  <Video size={48} className="text-accent-500 animate-pulse-slow" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="mt-4 text-xl font-medium">Waiting for videos...</h3>
                               <p className="mt-2 text-gray-400 text-center max-w-lg">
                  E-Downloader is actively monitoring for playing videos across all your tabs. 
                  When a YouTube video is detected, it will automatically capture the URL for easy downloading.
                </p> 
                
                {url && (
                  <div className="mt-6 bg-dark-700 p-4 rounded-lg w-full">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Youtube size={20} className="text-red-500" />
                        <span className="truncate max-w-sm">{url}</span>
                      </div>
                      <div className="flex">
                        <button 
                          onClick={analyzeVideo}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-l-lg transition-all flex items-center gap-2"
                        >
                          <Search size={16} />
                          <span>Search</span>
                        </button>
                        <button 
                          onClick={videoInfo ? startDownload : analyzeVideo}
                          disabled={!url || isAnalyzing || (videoInfo && !selectedFormat) || isDownloading}
                          className="px-4 py-2 bg-accent-600 hover:bg-accent-700 rounded-r-lg transition-all btn-hover-effect flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download size={16} />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Video info section */}
          {videoInfo && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border-t border-dark-600 p-6"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-2/5">
                  <div className="relative rounded-lg overflow-hidden">
                    <img 
                      src={videoInfo.thumbnail} 
                      alt={videoInfo.title}
                      className="w-full h-auto"
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-sm">
                      {videoInfo.duration}
                    </div>
                  </div>
                </div>
                
                <div className="md:w-3/5">
                  <h3 className="text-xl font-medium mb-4">{videoInfo.title}</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-sm text-gray-400 mb-2">Available formats:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {videoInfo.formats.map((format) => (
                        <button
                          key={`${format.quality}-${format.format}`}
                          onClick={() => setSelectedFormat(`${format.quality}-${format.format}`)}
                          className={`format-btn flex justify-between items-center ${
                            selectedFormat === `${format.quality}-${format.format}` ? 'active animate-glow' : ''
                          }`}
                        >
                          <span>{format.quality} ({format.format})</span>
                          <span className="text-sm text-gray-400">{format.size}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {isDownloading ? (
                    <div>
                      <div className="w-full bg-dark-700 rounded-full h-4 overflow-hidden">
                        <div 
                          className="bg-accent-500 h-full transition-all duration-300"
                          style={{ width: `${downloadProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-sm">
                        <span>{Math.round(downloadProgress)}% Downloaded</span>
                        <span className="text-gray-400">
                          {downloadProgress < 30 ? 'Preparing download...' : 
                           downloadProgress < 80 ? 'Downloading...' : 
                           downloadProgress < 95 ? 'Processing file...' : 'Finalizing...'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={startDownload}
                      disabled={!selectedFormat}
                      className="w-full py-3 bg-accent-600 hover:bg-accent-700 rounded-lg transition-all btn-hover-effect flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={18} />
                      <span>Download Now</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto text-center"
        >
          <h2 className="text-2xl font-bold mb-6">How to Download Videos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-dark-800 bg-opacity-80 backdrop-blur-lg p-6 rounded-xl">
              <div className="w-12 h-12 bg-accent-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link size={24} className="text-accent-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Paste URL</h3>
              <p className="text-gray-400">Copy the YouTube video URL from your browser and paste it into E-Downloader.</p>
            </div>
            
            <div className="bg-dark-800 bg-opacity-80 backdrop-blur-lg p-6 rounded-xl">
              <div className="w-12 h-12 bg-accent-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-accent-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Search Video</h3>
              <p className="text-gray-400">Click the search button to analyze the video and fetch all available download options.</p>
            </div>
            
            <div className="bg-dark-800 bg-opacity-80 backdrop-blur-lg p-6 rounded-xl">
              <div className="w-12 h-12 bg-accent-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download size={24} className="text-accent-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Download</h3>
              <p className="text-gray-400">Select your preferred format and click download to save the video to your device.</p>
            </div>
          </div>
        </motion.div>
      </div>
      
      <footer className="py-6 mt-20 border-t border-dark-700">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>E-Downloader &copy; {new Date().getFullYear()} | YouTube downloading made simple</p>
          <p className="mt-2">For personal and educational use only. Respect copyright laws.</p>
          <p>Developed by Imanzi Lutfy (Ellen cody) <a href="https://imanzilutfy.netlify.app/" target='_blank'><u className="text-yellow-500">Click To Hire me</u></a></p>
        </div>
      </footer>
    </div>
  );
}

export default App;
  