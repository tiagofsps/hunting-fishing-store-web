import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';
import { Label } from './Label';
import { Select } from './Select';
import { Spinner } from './Spinner';
import { Textarea } from './Textarea';

describe('form atoms', () => {
  it('applies the shared form styles and appends caller classes', () => {
    render(
      <>
        <Input aria-label="Email" className="custom-input" />
        <Select aria-label="Category" className="custom-select"><option>Rods</option></Select>
        <Textarea aria-label="Notes" className="custom-area" />
      </>
    );

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveClass('w-full', 'rounded-xl', 'custom-input');
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveClass('w-full', 'custom-select');
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveClass('w-full', 'custom-area');
  });

  it('forwards refs for react-hook-form registration', () => {
    const inputRef = createRef<HTMLInputElement>();
    const selectRef = createRef<HTMLSelectElement>();
    const textareaRef = createRef<HTMLTextAreaElement>();
    render(
      <>
        <Input ref={inputRef} aria-label="Email" />
        <Select ref={selectRef} aria-label="Category"><option value="rods">Rods</option></Select>
        <Textarea ref={textareaRef} aria-label="Notes" />
      </>
    );

    expect(inputRef.current).toBe(screen.getByRole('textbox', { name: 'Email' }));
    expect(selectRef.current).toBe(screen.getByRole('combobox', { name: 'Category' }));
    expect(textareaRef.current).toBe(screen.getByRole('textbox', { name: 'Notes' }));
  });

  it('preserves standard input attributes and disabled state', () => {
    render(<Input type="email" required disabled aria-label="Email" />);
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeRequired();
  });

  it('associates a Label with its field through htmlFor', () => {
    render(
      <>
        <Label htmlFor="address">Street address</Label>
        <Input id="address" />
      </>
    );
    expect(screen.getByLabelText('Street address')).toBeInTheDocument();
  });
});

describe('Spinner', () => {
  it('announces a localized loading state to assistive technology', () => {
    render(<Spinner label="A carregar" />);
    expect(screen.getByRole('status', { name: 'A carregar' })).toBeInTheDocument();
  });
});
