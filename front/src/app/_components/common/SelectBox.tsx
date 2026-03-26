"use client";

import React, { useState, useRef, useEffect } from "react";

interface SelectBoxProps {
  options: { label: string; value: string }[];
  defaultValue?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function SelectBox({
  options,
  defaultValue,
  onChange,
  disabled,
}: SelectBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    options.find((opt) => opt.value === defaultValue) || options[0]
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (option: { label: string; value: string }) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={`w-full h-[32px] px-3 bg-gray-700 text-white text-[14px] rounded-md border border-gray-600 flex items-center justify-between hover:bg-gray-600 transition-all duration-300 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="truncate">{selectedOption.label}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg">
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-3 py-1.5 text-[14px] cursor-pointer ${
                selectedOption.value === option.value
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-600"
              }`}
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SelectBox;
