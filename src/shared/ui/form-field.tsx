import { useForm, UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/src/shared/ui/label';
import { Input } from '@/src/shared/ui/input';
import { cn } from '@/src/shared/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  type?: string;
  description?: string;
  className?: string;
}

export function FormField<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  type = 'text',
  description,
  className,
}: FormFieldProps<T>) {
  const { register, formState: { errors } } = form;
  const error = errors[name];

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {label && (
        <Label 
          htmlFor={name} 
          className={cn(error && "text-destructive font-semibold")}
        >
          {label}
        </Label>
      )}
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={cn(
          "transition-all duration-300 focus:ring-2",
          error ? "border-destructive focus:ring-destructive/20" : "focus:ring-primary/20"
        )}
        {...register(name)}
      />
      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-[11px] font-medium text-destructive"
          >
            {error.message as string}
          </motion.p>
        ) : description ? (
          <p className="text-[11px] text-muted-foreground">{description}</p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
