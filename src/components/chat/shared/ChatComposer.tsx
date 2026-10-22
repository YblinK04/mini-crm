'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md';

interface ChatComposerProps {

  onSend: (text: string) => Promise<unknown>;
  isPending?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  size?: Size;
  className?: string;
}

const SIZE_CLASSES: Record<Size, { textarea: string; button: string }> = {
  sm: {
    textarea: 'min-h-[40px] text-xs',
    button: 'h-10 w-10',
  },
  md: {
    textarea: 'min-h-[44px] text-sm',
    button: 'h-[44px] w-[44px]',
  },
};

export function ChatComposer({
  onSend,
  isPending = false,
  placeholder = 'Написать сообщение...',
  ariaLabel = 'Отправить сообщение',
  size = 'md',
  className,
}: ChatComposerProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setText('');
    try {
      await onSend(trimmed);
    } catch {
      setText((prev) => (prev.length > 0 ? prev : trimmed));
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const cls = SIZE_CLASSES[size];

  return (
    <div className={cn('flex items-end gap-2', className)}>
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        aria-label="Текст сообщения"
        rows={1}
        className={cn(
          'max-h-[120px] flex-1 resize-none rounded-xl',
          cls.textarea,
        )}
      />
      <Button
        type="button"
        size="icon"
        onClick={() => void handleSubmit()}
        disabled={!text.trim()}
        className={cn('shrink-0 rounded-xl', cls.button)}
        aria-label={ariaLabel}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}