import type { ComponentPropsWithRef } from 'react';
import { FIELD_CONTROL_CLASS, joinClasses } from './styles';

/** Text input styled to match every other form control. Forwards `ref` for react-hook-form. */
export function Input({ className, ...props }: ComponentPropsWithRef<'input'>) {
  return <input className={joinClasses(FIELD_CONTROL_CLASS, className)} {...props} />;
}
