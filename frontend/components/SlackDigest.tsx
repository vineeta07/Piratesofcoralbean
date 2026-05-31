import React from 'react';
import { SlackData } from '../lib/types';

interface SlackDigestProps {
  slack: SlackData | null;
}

export default function SlackDigest({ slack }: SlackDigestProps) {
  if (!slack || !slack.blocks) return null;

  return (
    <div className="bg-[#1a1d21] rounded-xl overflow-hidden border border-[#3f4144] shadow-2xl font-sans mt-8">
      <div className="bg-[#2c2d30] px-4 py-2 border-b border-[#3f4144] flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span className="text-gray-400 text-sm ml-2 font-medium">Slack Digest Preview</span>
      </div>
      
      <div className="p-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
            CI
          </div>
          <div className="flex-1 text-gray-200">
            <div className="font-bold mb-1 flex items-baseline gap-2">
              <span>Coral Intelligence</span>
              <span className="bg-[#303336] text-[10px] px-1.5 py-0.5 rounded text-gray-400 uppercase tracking-wide">APP</span>
              <span className="text-xs text-gray-500 font-normal ml-1">9:00 AM</span>
            </div>
            
            <div className="flex flex-col gap-4 mt-3">
              {slack.blocks.map((block, idx) => {
                if (!block) return null;
                
                if (block.type === 'header') {
                  return <h3 key={idx} className="font-bold text-lg text-white">{block.text?.text}</h3>;
                }
                if (block.type === 'section') {
                  // Basic markdown parsing for the preview
                  const text = block.text?.text || '';
                  const formattedText = text
                    .split('\n')
                    .map((line, i) => {
                      let parsedLine = line;
                      // Bold
                      parsedLine = parsedLine.replace(/\*(.*?)\*/g, '<strong class="text-white font-bold">$1</strong>');
                      // Italic
                      parsedLine = parsedLine.replace(/_(.*?)_/g, '<em class="text-gray-400 not-italic">$1</em>');
                      
                      return (
                        <div key={i} dangerouslySetInnerHTML={{ __html: parsedLine }} className="mb-1" />
                      );
                    });
                  
                  return (
                    <div key={idx} className="text-[15px] leading-relaxed">
                      {formattedText}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
