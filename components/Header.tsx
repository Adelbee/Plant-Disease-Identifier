
import React from 'react';
import { LeafIcon } from './icons/LeafIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center">
        <LeafIcon className="h-8 w-8 text-green-600 mr-3" />
        <h1 className="text-2xl md:text-3xl font-bold text-green-800 tracking-tight">
          Plant Disease Identifier
        </h1>
      </div>
    </header>
  );
};

export default Header;
