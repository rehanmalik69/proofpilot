"use client";

import { RotateCw, Sparkles, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

type SubmitButtonIconName = "sparkles" | "trash" | "refresh";

type SubmitButtonProps = {
  label: string;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
  iconName?: SubmitButtonIconName;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

const iconMap = {
  refresh: RotateCw,
  sparkles: Sparkles,
  trash: Trash2,
} satisfies Record<SubmitButtonIconName, typeof Sparkles>;

export function SubmitButton({
  label,
  pendingLabel,
  className,
  disabled,
  iconName,
  size,
  variant,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const Icon = iconName ? iconMap[iconName] : null;

  return (
    <Button
      type="submit"
      className={className}
      disabled={pending || disabled}
      size={size}
      variant={variant}
    >
      {Icon ? <Icon className="size-4" /> : null}
      {pending ? pendingLabel : label}
    </Button>
  );
}
