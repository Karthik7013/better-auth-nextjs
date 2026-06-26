"use client";

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { PlusIcon, PencilIcon, Trash2Icon, ChevronDown, ChevronRight, Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatDuration } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/error-state"
import { UploadField } from "@/components/upload-field"

interface Episode {
  id: number
  seasonId: number
  episodeNumber: number
  title: string
  slug: string
  description: string | null
  videoUrl: string | null
  thumbnailUrl: string | null
  backdropUrl: string | null
  durationSeconds: number | null
  releaseDate: string | null
}

interface Season {
  id: number
  seriesId: number
  seasonNumber: number
  title: string | null
  description: string | null
  episodeCount?: number
  episodes?: Episode[]
}

export default function AdminSeriesDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null)
  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false)
  const [episodeDialogOpen, setEpisodeDialogOpen] = useState(false)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null)
  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(null)

  const { data: series, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-series-detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/series/${id}`)
      if (!res.ok) throw new Error("Failed to fetch series")
      return res.json()
    },
  })

  const { data: seasonsData, refetch: refetchSeasons } = useQuery({
    queryKey: ["admin-series-seasons", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/series/${id}/seasons`)
      if (!res.ok) throw new Error("Failed to fetch seasons")
      return res.json() as Promise<{ seasons: Season[] }>
    },
  })

  const { data: episodesData, refetch: refetchEpisodes } = useQuery({
    queryKey: ["admin-season-episodes", expandedSeason],
    queryFn: async () => {
      if (!expandedSeason) return { episodes: [] }
      const res = await fetch(`/api/admin/series/${id}/seasons/${expandedSeason}/episodes`)
      if (!res.ok) throw new Error("Failed to fetch episodes")
      return res.json() as Promise<{ episodes: Episode[] }>
    },
    enabled: !!expandedSeason,
  })

  const saveSeasonMutation = useMutation({
    mutationFn: async (data: { seasonNumber?: number; title?: string }) => {
      if (editingSeason) {
        const res = await fetch(`/api/admin/series/${id}/seasons/${editingSeason.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Update failed")
      } else {
        const res = await fetch(`/api/admin/series/${id}/seasons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Create failed")
      }
    },
    onSuccess: () => {
      toast.success(editingSeason ? "Season updated" : "Season created")
      setSeasonDialogOpen(false)
      setEditingSeason(null)
      refetchSeasons()
    },
    onError: () => toast.error("Failed to save season"),
  })

  const deleteSeasonMutation = useMutation({
    mutationFn: async (seasonId: number) => {
      const res = await fetch(`/api/admin/series/${id}/seasons/${seasonId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
    },
    onSuccess: () => {
      toast.success("Season deleted")
      refetchSeasons()
    },
    onError: () => toast.error("Failed to delete season"),
  })

  const saveEpisodeMutation = useMutation({
    mutationFn: async (data: any) => {
      const seasonId = activeSeasonId!
      if (editingEpisode) {
        const res = await fetch(`/api/admin/series/${id}/seasons/${seasonId}/episodes/${editingEpisode.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Update failed")
      } else {
        const res = await fetch(`/api/admin/series/${id}/seasons/${seasonId}/episodes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Create failed")
      }
    },
    onSuccess: () => {
      toast.success(editingEpisode ? "Episode updated" : "Episode created")
      setEpisodeDialogOpen(false)
      setEditingEpisode(null)
      if (expandedSeason) refetchEpisodes()
    },
    onError: () => toast.error("Failed to save episode"),
  })

  const deleteEpisodeMutation = useMutation({
    mutationFn: async (episodeId: number) => {
      if (!expandedSeason) return
      const res = await fetch(`/api/admin/series/${id}/seasons/${expandedSeason}/episodes/${episodeId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
    },
    onSuccess: () => {
      toast.success("Episode deleted")
      if (expandedSeason) refetchEpisodes()
    },
    onError: () => toast.error("Failed to delete episode"),
  })

  if (isLoading) return <Skeleton className="h-96 rounded-lg" />
  if (isError) return <ErrorState message="Failed to load series." onRetry={refetch} />

  const seasons = seasonsData?.seasons || []
  const episodes = episodesData?.episodes || []

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/series")}>
          <ChevronRight className="size-4 rotate-180" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{series?.title}</h1>
          <p className="text-muted-foreground mt-1">Manage seasons and episodes.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Seasons</h2>
        <Button onClick={() => { setEditingSeason(null); setSeasonDialogOpen(true) }} size="sm">
          <PlusIcon className="size-4" /> Add Season
        </Button>
      </div>

      {seasons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No seasons yet. Add one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {seasons.map((season) => (
            <Card key={season.id}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setExpandedSeason(expandedSeason === season.id ? null : season.id)}
                    className="flex items-center gap-2 text-left flex-1"
                  >
                    {expandedSeason === season.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    <span className="font-semibold">Season {season.seasonNumber}</span>
                    {season.title && (
                      <span className="text-muted-foreground font-normal">— {season.title}</span>
                    )}
                    <Badge variant="secondary" className="ml-2">
                      {season.episodeCount ?? 0} episodes
                    </Badge>
                  </button>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => {
                      setActiveSeasonId(season.id)
                      setEditingEpisode(null)
                      setEpisodeDialogOpen(true)
                    }}>
                      <PlusIcon className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => {
                      setEditingSeason(season)
                      setSeasonDialogOpen(true)
                    }}>
                      <PencilIcon className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7 text-rose-500" onClick={() => {
                      if (confirm(`Delete Season ${season.seasonNumber} and all its episodes?`)) {
                        deleteSeasonMutation.mutate(season.id)
                      }
                    }}>
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedSeason === season.id && (
                <CardContent className="px-4 pb-4 pt-0 border-t">
                  {episodes.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No episodes yet.</p>
                  ) : (
                    <div className="divide-y">
                      {episodes.map((ep) => (
                        <div key={ep.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-sm font-medium text-muted-foreground w-8 shrink-0">
                              {ep.episodeNumber}.
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{ep.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {ep.durationSeconds ? formatDuration(ep.durationSeconds) : "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="size-7" onClick={() => {
                              setActiveSeasonId(season.id)
                              setEditingEpisode(ep)
                              setEpisodeDialogOpen(true)
                            }}>
                              <PencilIcon className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-7 text-rose-500" onClick={() => {
                              if (confirm(`Delete "${ep.title}"?`)) {
                                deleteEpisodeMutation.mutate(ep.id)
                              }
                            }}>
                              <Trash2Icon className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <SeasonDialog
        open={seasonDialogOpen}
        onOpenChange={setSeasonDialogOpen}
        editingSeason={editingSeason}
        onSave={(data) => saveSeasonMutation.mutate(data)}
        saving={saveSeasonMutation.isPending}
      />

      <EpisodeDialog
        open={episodeDialogOpen}
        onOpenChange={setEpisodeDialogOpen}
        editingEpisode={editingEpisode}
        onSave={(data) => saveEpisodeMutation.mutate(data)}
        saving={saveEpisodeMutation.isPending}
      />
    </div>
  )
}

function SeasonDialog({
  open, onOpenChange, editingSeason, onSave, saving,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editingSeason: Season | null
  onSave: (data: { seasonNumber?: number; title?: string }) => void
  saving: boolean
}) {
  const [seasonNumber, setSeasonNumber] = useState(editingSeason?.seasonNumber?.toString() || "")
  const [title, setTitle] = useState(editingSeason?.title || "")

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setSeasonNumber(""); setTitle("") }; onOpenChange(o) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingSeason ? "Edit Season" : "Add Season"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Season Number</label>
            <Input type="number" value={seasonNumber} onChange={(e) => setSeasonNumber(e.target.value)} placeholder="Auto if empty" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title (optional)</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Season 1: Origins" />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave({
            seasonNumber: seasonNumber ? parseInt(seasonNumber) : undefined,
            title: title || undefined,
          })} disabled={saving}>
            {saving && <Loader2Icon className="size-4 animate-spin" />}
            {editingSeason ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EpisodeDialog({
  open, onOpenChange, editingEpisode, onSave, saving,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editingEpisode: Episode | null
  onSave: (data: any) => void
  saving: boolean
}) {
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [title, setTitle] = useState(editingEpisode?.title || "")
  const [slug, setSlugState] = useState(editingEpisode?.slug || "")
  const [episodeNumber, setEpisodeNumber] = useState(editingEpisode?.episodeNumber?.toString() || "")
  const [description, setDescription] = useState(editingEpisode?.description || "")
  const [videoUrl, setVideoUrl] = useState(editingEpisode?.videoUrl || "")
  const [thumbnailUrl, setThumbnailUrl] = useState(editingEpisode?.thumbnailUrl || "")
  const [backdropUrl, setBackdropUrl] = useState(editingEpisode?.backdropUrl || "")
  const [durationSeconds, setDurationSeconds] = useState(editingEpisode?.durationSeconds?.toString() || "")
  const [releaseDate, setReleaseDate] = useState(editingEpisode?.releaseDate || "")

  function generateSlug(title: string): string {
    return title
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  }

  function reset() {
    setTitle(editingEpisode?.title || "")
    setSlugState(editingEpisode?.slug || "")
    setEpisodeNumber(editingEpisode?.episodeNumber?.toString() || "")
    setDescription(editingEpisode?.description || "")
    setVideoUrl(editingEpisode?.videoUrl || "")
    setThumbnailUrl(editingEpisode?.thumbnailUrl || "")
    setBackdropUrl(editingEpisode?.backdropUrl || "")
    setDurationSeconds(editingEpisode?.durationSeconds?.toString() || "")
    setReleaseDate(editingEpisode?.releaseDate || "")
    setSlugManuallyEdited(!!editingEpisode?.slug)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingEpisode ? "Edit Episode" : "Add Episode"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Episode Number</label>
            <Input type="number" value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value)} placeholder="Auto if empty" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title *</label>
            <Input value={title} onChange={(e) => {
              setTitle(e.target.value)
              if (!slugManuallyEdited) setSlugState(generateSlug(e.target.value))
            }} placeholder="Episode title" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Slug *</label>
            <Input value={slug} onChange={(e) => { setSlugManuallyEdited(true); setSlugState(e.target.value) }} placeholder="episode-slug" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30 resize-y min-h-16" placeholder="Episode description" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Video URL</label>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <UploadField label="Thumbnail" folder="thumbnails" value={thumbnailUrl} onChange={setThumbnailUrl} />
            </div>
            <div className="space-y-1.5">
              <UploadField label="Backdrop" folder="backdrops" value={backdropUrl} onChange={setBackdropUrl} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Duration (seconds)</label>
              <Input type="number" value={durationSeconds} onChange={(e) => setDurationSeconds(e.target.value)} placeholder="3600" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Release Date</label>
              <Input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave({
            title,
            slug,
            episodeNumber: episodeNumber ? parseInt(episodeNumber) : undefined,
            description: description || null,
            videoUrl: videoUrl || null,
            thumbnailUrl: thumbnailUrl || null,
            backdropUrl: backdropUrl || null,
            durationSeconds: durationSeconds ? parseInt(durationSeconds) : null,
            releaseDate: releaseDate || null,
          })} disabled={saving || !title || !slug}>
            {saving && <Loader2Icon className="size-4 animate-spin" />}
            {editingEpisode ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
