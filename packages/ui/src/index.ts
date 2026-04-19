/**
 * @shimokitan/ui - Shared component library
 *
 * Re-exports all public components and utilities for the monorepo.
 */

// --- Primitives (shadcn/ui) ---
export { Button, buttonVariants } from "./components/ui/button";
export { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";
export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
} from "./components/ui/dialog";
export { Toaster } from "./components/ui/sonner";
export { Input } from "./components/ui/input";
export { Textarea } from "./components/ui/textarea";
export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "./components/ui/select";
export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuGroup,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup,
} from "./components/ui/dropdown-menu";
export {
    Sheet,
    SheetPortal,
    SheetOverlay,
    SheetTrigger,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
} from "./components/ui/sheet";

// --- Composite Components ---
export { MediaUploader } from "./components/MediaUploader";
export { PresignedUploader } from "./components/PresignedUploader";
export { AudioWidget } from "./components/AudioWidget";
export type { Track } from "./components/AudioWidget";
export { Badge, badgeVariants } from "./components/Badge";
export { BentoCard } from "./components/BentoCard";
export { CyberpunkShell, CyberpunkStyles } from "./components/CyberpunkShell";
export { InlineMarkdown } from "./components/InlineMarkdown";
export { NavigationLink } from "./components/NavigationLink";
export { NotFound } from "./components/NotFound";
export { ErrorDisplay } from "./components/ErrorDisplay";
export { DistrictAvatar } from "./components/DistrictAvatar";

// --- Theme ---
export { ThemeProvider } from "./components/theme-provider";

// --- Utilities ---
export { cn } from "./lib/utils";
