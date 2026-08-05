import { useId, type InputHTMLAttributes } from 'react';
import styles from './text-field.module.css';

export type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> &
  Readonly<{
    label: string;
    hint?: string;
    error?: string;
  }>;

export function TextField({
  error,
  hint,
  id: providedId,
  label,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const message = error ?? hint;
  const messageId = message ? `${id}-message` : undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        aria-describedby={messageId}
        aria-invalid={Boolean(error)}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        id={id}
      />
      {message ? (
        <span
          className={`${styles.message} ${error ? styles.error : ''}`}
          id={messageId}
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}
