
import React, { useMemo } from 'react';

// Make 'marked' available in the component scope
declare const marked: any;

interface AnalysisResultProps {
  result: string;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
  const formattedResult = useMemo(() => {
    if (typeof marked === 'undefined') {
      return result.replace(/\n/g, '<br />');
    }
    try {
      return marked.parse(result);
    } catch (e) {
      console.error("Error parsing markdown:", e);
      return result.replace(/\n/g, '<br />');
    }
  }, [result]);

  return (
    <div className="mt-6 w-full">
      <h3 className="text-xl font-bold text-green-800 border-b-2 border-green-200 pb-2 mb-4">
        AI Botanist Report
      </h3>
      <div 
        className="prose prose-green max-w-none prose-h2:text-lg prose-h2:font-semibold prose-h3:text-md prose-h3:font-semibold"
        dangerouslySetInnerHTML={{ __html: formattedResult }}
      />
    </div>
  );
};

export default AnalysisResult;
