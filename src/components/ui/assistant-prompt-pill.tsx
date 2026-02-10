import { useEffect, useRef, useState } from "react";
import { ArrowUp, Plus } from "lucide-react";
import { cn } from "../../lib/utils";

interface AssistantPromptPillProps {
  onOpenAssistant: () => void;
  onSubmitPrompt: (prompt: string) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function AssistantPromptPill({
  onOpenAssistant,
  onSubmitPrompt,
  disabled = false,
  className,
  placeholder = "Ask NutriAI",
}: AssistantPromptPillProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  const handleSubmit = async () => {
    if (disabled) return;

    const prompt = draft.trim();
    if (!prompt) return;

    await onSubmitPrompt(prompt);
    setDraft("");
    setIsExpanded(false);
  };

  const handleOpen = () => {
    if (disabled) return;
    onOpenAssistant();
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 pb-[env(safe-area-inset-bottom)] sm:left-auto sm:right-6 sm:translate-x-0",
        className
      )}
    >
      <div
        className={cn(
          "flex h-12 items-center gap-2 rounded-full border border-border/60 bg-background/70 px-2 shadow-lg backdrop-blur-md transition-all duration-200",
          "w-[min(calc(100vw-1rem),18rem)] sm:w-[18rem]",
          isExpanded && "w-[min(calc(100vw-1rem),22rem)] sm:w-[22rem]"
        )}
      >
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Open assistant"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
        </button>

        {isExpanded ? (
          <input
            ref={inputRef}
            id="assistant-prompt-input"
            name="assistant-prompt-input"
            type="text"
            autoComplete="off"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setIsExpanded(false);
                return;
              }
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            aria-label="Assistant prompt"
            placeholder={`${placeholder}...`}
            className="h-8 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            disabled={disabled}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="h-8 flex-1 text-left text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Expand assistant prompt"
            disabled={disabled}
          >
            {placeholder}
          </button>
        )}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          aria-label="Send message"
          disabled={disabled || !isExpanded || !draft.trim()}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            disabled || !isExpanded || !draft.trim()
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          )}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
