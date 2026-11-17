import type { ComponentPropsWithRef } from 'react';
import { FIELD_CONTROL_CLASS, joinClasses } from './styles';

/** Multi-line text input styled to match `Input`. Forwards `ref` for react-hook-form. */
export function Textarea({ className, ...props }: ComponentPropsWithRef<'textarea'>) {
  return <textarea className={joinClasses(FIELD_CONTROL_CLASS, className)} {...props} />;
}
