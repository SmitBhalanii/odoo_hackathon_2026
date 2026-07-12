import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PlaceholderPage = ({ title, description }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center p-4">
      <div className="bg-[#17171C] border border-[#2A2A32] rounded-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">AF</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-400 mb-6">{description || 'This page is under construction.'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PlaceholderPage;
