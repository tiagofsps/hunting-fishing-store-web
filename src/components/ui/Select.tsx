import type { ComponentPropsWithRef } from 'react';
import { FIELD_CONTROL_CLASS, joinClasses } from './styles';

/** Select dropdown styled to match `Input`. Forwards `ref` for react-hook-form. */
export function Select({ className, ...props }: ComponentPropsWithRef<'select'>) {
  return <select className={joinClasses(FIELD_CONTROL_CLASS, className)} {...props} />;
}
