import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'default' | 'small';
  active?: boolean;
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const Button = ({
  size = 'default',
  active = false,
  className,
  type = 'button',
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={cx(
      styles.button,
      size === 'small' && styles.small,
      active && styles.active,
      className,
    )}
    {...props}
  />
);
