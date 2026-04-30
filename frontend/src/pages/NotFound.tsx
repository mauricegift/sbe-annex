import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const NotFound = () => {
  const location = useLocation();
  const [titleText, setTitleText] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const title = "Page Not Found";
  const description = "Sorry, we couldn't find the page you're looking for. This feature is coming soon!";
  const [gradientIndex, setGradientIndex] = useState(0);
  const gradients = [
    "from-purple-500 to-blue-500",
    "from-pink-500 to-rose-500",
    "from-amber-500 to-red-500",
    "from-emerald-500 to-teal-500",
    "from-indigo-500 to-purple-500"
  ];

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // Typing animation for title
    let i = 0;
    const titleInterval = setInterval(() => {
      if (i < title.length) {
        setTitleText(title.substring(0, i + 1));
        i++;
      } else {
        clearInterval(titleInterval);
        // Start typing description after title completes
        let j = 0;
        const descInterval = setInterval(() => {
          if (j < description.length) {
            setDescriptionText(description.substring(0, j + 1));
            j++;
          } else {
            clearInterval(descInterval);
          }
        }, 30);
      }
    }, 50);

    // Cursor blink animation
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    // Gradient cycling animation
    const gradientInterval = setInterval(() => {
      setGradientIndex((prev) => (prev + 1) % gradients.length);
    }, 3000);

    return () => {
      clearInterval(titleInterval);
      clearInterval(cursorInterval);
      clearInterval(gradientInterval);
    };
  }, [location.pathname, gradients.length]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-techwork-purple/5 to-techwork-blue/5 dark:bg-gray-900">
      <div className="text-center max-w-md mx-auto p-8">
        {/* Bouncing 404 with different colors */}
        <div className="flex justify-center space-x-2 mb-8">
          <span 
            className="text-6xl font-bold font-heading bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent animate-bounce"
            style={{ animationDuration: '0.8s' }}
          >
            4
          </span>
          <span 
            className="text-6xl font-bold font-heading bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent animate-bounce"
            style={{ animationDuration: '1.2s', animationDelay: '0.2s' }}
          >
            0
          </span>
          <span 
            className="text-6xl font-bold font-heading bg-gradient-to-r from-amber-500 to-red-500 bg-clip-text text-transparent animate-bounce"
            style={{ animationDuration: '1s', animationDelay: '0.1s' }}
          >
            4
          </span>
        </div>

        {/* Typing text animation */}
        <div className="min-h-32 mb-6 text-left">
          <h1 className="text-2xl font-extrabold mb-4 text-gray-900 dark:text-white">
            {titleText}
            {(titleText.length === title.length && descriptionText.length < description.length) && (
              <span className={`ml-1 h-6 w-1 bg-current inline-block ${showCursor ? 'opacity-100' : 'opacity-0'}`}></span>
            )}
          </h1>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {descriptionText}
            {descriptionText.length === description.length && (
              <span className={`ml-1 h-5 w-0.5 bg-current inline-block ${showCursor ? 'opacity-100' : 'opacity-0'}`}></span>
            )}
          </p>
        </div>

        {/* Heartbeat button with changing gradient */}
        <a 
          href="/" 
          className={`inline-flex h-12 items-center justify-center rounded-full px-8 text-lg font-bold text-white shadow-lg transition-all duration-1000 animate-heartbeat bg-gradient-to-r ${gradients[gradientIndex]}`}
        >
          Return to Home
        </a>
      </div>

      <style>{`
        @keyframes heartbeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.05); }
          50% { transform: scale(1); }
          75% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-heartbeat {
          animation: heartbeat 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
