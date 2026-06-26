"use client";

import { useState, useRef } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { UploadField } from "@/components/upload-field"
import { z } from "zod"

const seriesFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional().or(z.literal("")),
  thumbnailUrl: z.string().optional().or(z.literal("")),
  backdropUrl: z.string().optional().or(z.literal("")),
  releaseDate: z.string().optional().or(z.literal("")),
  tagIds: z.array(z.number()),
})

type SeriesFormData = z.infer<typeof seriesFormSchema>

interface Tag {
  id: number
  name: string
}

interface SeriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<SeriesFormData>
  editSeriesId?: number
  onSuccess: () => void
}

export function SeriesDialog({ open, onOpenChange, initialData, editSeriesId, onSuccess }: SeriesDialogProps) {
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const prevOpen = useRef(open)
  const stagedUrls = useRef<Set<string>>(new Set())
  const initialUrls = useRef<Set<string>>(new Set())
  const justSaved = useRef(false)

  function deleteUploadedFile(url: string) {
    fetch(`/api/upload/file?url=${encodeURIComponent(url)}`, { method: "DELETE" }).catch(() => {})
  }

  function handleRemoveUpload(url: string) {
    if (stagedUrls.current.has(url)) {
      stagedUrls.current.delete(url)
      deleteUploadedFile(url)
    }
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SeriesFormData>({
    resolver: zodResolver(seriesFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      thumbnailUrl: "",
      backdropUrl: "",
      releaseDate: "",
      tagIds: [],
    },
  })

  const watchedTagIds = watch("tagIds")

  const { data: allTags } = useQuery<Tag[]>({
    queryKey: ["admin-tags-select"],
    queryFn: async () => {
      const res = await fetch("/api/admin/tags?limit=100")
      if (!res.ok) throw new Error("Failed to fetch tags")
      const data = await res.json()
      return data.tags ?? []
    },
    enabled: open,
  })

  const { mutate: saveSeries, isPending: saving } = useMutation({
    mutationFn: async (formData: SeriesFormData) => {
      const body = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description || null,
        thumbnailUrl: formData.thumbnailUrl || null,
        backdropUrl: formData.backdropUrl || null,
        releaseDate: formData.releaseDate || null,
        tagIds: formData.tagIds,
      }

      if (editSeriesId) {
        const res = await fetch(`/api/admin/series/${editSeriesId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error("Update failed")
      } else {
        const res = await fetch("/api/admin/series", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error("Create failed")
      }
    },
    onSuccess: () => {
      justSaved.current = true
      stagedUrls.current.clear()
      toast.success(editSeriesId ? "Series updated" : "Series created")
      onOpenChange(false)
      onSuccess()
    },
    onError: () => {
      toast.error(editSeriesId ? "Failed to update series" : "Failed to create series")
    },
  })

  function generateSlug(title: string): string {
    return title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  }

  function handleDialogOpen(open: boolean) {
    if (!open && !justSaved.current) {
      for (const url of stagedUrls.current) {
        deleteUploadedFile(url)
      }
      stagedUrls.current.clear()
    }

    if (open && !prevOpen.current) {
      stagedUrls.current = new Set()
      justSaved.current = false

      if (initialData) {
        initialUrls.current = new Set(
          [initialData.thumbnailUrl, initialData.backdropUrl].filter(Boolean) as string[]
        )
        reset({
          title: initialData.title ?? "",
          slug: initialData.slug ?? "",
          description: initialData.description ?? "",
          thumbnailUrl: initialData.thumbnailUrl ?? "",
          backdropUrl: initialData.backdropUrl ?? "",
          releaseDate: initialData.releaseDate ?? "",
          tagIds: initialData.tagIds ?? [],
        })
        setSlugManuallyEdited(!!initialData.slug)
      } else {
        initialUrls.current = new Set()
        reset()
        setSlugManuallyEdited(false)
      }
    }

    prevOpen.current = open
    onOpenChange(open)
  }

  function onSubmit(data: SeriesFormData) {
    saveSeries(data)
  }

  function handleUploadChange(field: "thumbnailUrl" | "backdropUrl", url: string) {
    if (url && !initialUrls.current.has(url)) {
      stagedUrls.current.add(url)
    }
    setValue(field, url)
  }

  function toggleTag(tagId: number) {
    const current = watchedTagIds
    const next = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId]
    setValue("tagIds", next, { shouldValidate: true })
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editSeriesId ? "Edit Series" : "Add Series"}</DialogTitle>
          <DialogDescription>
            {editSeriesId
              ? "Update the series details below."
              : "Fill in the details to add a new series."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Title</label>
                <Input
                  {...register("title")}
                  onChange={(e) => {
                    setValue("title", e.target.value, { shouldValidate: true })
                    if (!slugManuallyEdited) {
                      setValue("slug", generateSlug(e.target.value), { shouldValidate: false })
                    }
                  }}
                  placeholder="Series title"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  {...register("slug")}
                  onChange={(e) => {
                    setSlugManuallyEdited(true)
                    setValue("slug", e.target.value, { shouldValidate: true })
                  }}
                  placeholder="series-slug"
                />
                {errors.slug && (
                  <p className="text-xs text-destructive">{errors.slug.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                {...register("description")}
                placeholder="Series description"
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 resize-y min-h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <UploadField
                  label="Thumbnail"
                  folder="thumbnails"
                  value={watch("thumbnailUrl") ?? ""}
                  onChange={(url) => handleUploadChange("thumbnailUrl", url)}
                  onRemove={handleRemoveUpload}
                />
              </div>
              <div className="space-y-1.5">
                <UploadField
                  label="Backdrop"
                  folder="backdrops"
                  value={watch("backdropUrl") ?? ""}
                  onChange={(url) => handleUploadChange("backdropUrl", url)}
                  onRemove={handleRemoveUpload}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Release Date</label>
              <Input
                type="date"
                {...register("releaseDate")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags?.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "inline-flex h-7 items-center gap-1 rounded-full px-3 text-xs font-medium transition-colors",
                      watchedTagIds.includes(tag.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {tag.name}
                  </button>
                ))}
                {allTags?.length === 0 && (
                  <span className="text-sm text-muted-foreground">No tags available.</span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={() => handleDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2Icon className="size-4 animate-spin" />}
              {editSeriesId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
