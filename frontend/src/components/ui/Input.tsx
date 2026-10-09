import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

const base = 'w-full font-body transition-colors focus:outline-none';

const variants = {
  dark:
    'dark-input bg-ink-soft border border-ink-line text-bone ' +
    'placeholder:text-bone-muted/50 px-4 py-3 focus:border-blood',
  paper:
    'paper-input bg-transparent border-b-2 border-ink-text/40 text-ink-text ' +
    'placeholder:text-ink-text-dim/70 placeholder:italic ' +
    'focus:border-blood font-type text-lg rounded-none px-0 py-2',
};

type Variant = keyof typeof variants;

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: Variant;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: Variant;
}

export function Input({ variant = 'dark', className = '', ...rest }: InputProps) {
  return <input className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}

export function Textarea({ variant = 'dark', className = '', ...rest }: TextareaProps) {
  return (
    <textarea
      className={`${base} ${variants[variant]} resize-none ${className}`}
      {...rest}
    />
  );
}