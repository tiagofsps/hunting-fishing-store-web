import type { ComponentPropsWithRef } from 'react';
import { FIELD_LABEL_CLASS, joinClasses } from './styles';

/** Form field label. */
export function Label({ className, ...props }: ComponentPropsWithRef<'label'>) {
  return <label className={joinClasses(FIELD_LABEL_CLASS, className)} {...props} />;
}
