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
        type="button"
        className={`w-full h-[38px] px-3.5 bg-input hover:bg-card-hover text-foreground text-[13px] rounded-xl border border-input-border flex items-center justify-between transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-primary/40 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="truncate text-foreground">{selectedOption.label}</span>
        <svg
          className={`w-4 h-4 text-muted transition-transform duration-200 ${
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
        <div className="absolute z-30 w-full mt-1.5 py-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-3.5 py-2 text-[13px] cursor-pointer transition-colors ${
                selectedOption.value === option.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted hover:bg-card-hover hover:text-foreground"
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
