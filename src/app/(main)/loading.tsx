import { Loader2Icon } from "lucide-react";

export default function MainLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2Icon className="size-8 animate-spin text-primary" />
    </div>
  );
}
